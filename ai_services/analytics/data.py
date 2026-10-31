"""Read-only access to analytics data. Python never writes to the application database."""

from __future__ import annotations

import ssl
from dataclasses import dataclass
from datetime import timedelta
from urllib.parse import unquote, urlparse

import pandas as pd

from ai_services.analytics.extraction import extract
from ai_services.config import ai_config

LOOKBACK_DAYS = 40


@dataclass
class Frames:
    customers: pd.DataFrame
    orders: pd.DataFrame
    events: pd.DataFrame
    feedback: pd.DataFrame
    releases: pd.DataFrame
    as_of: pd.Timestamp

    def upto(self, as_of) -> "Frames":
        ts = pd.Timestamp(as_of)
        return Frames(self.customers, self.orders[self.orders.ordered_at <= ts],
                      self.events[self.events.event_timestamp <= ts],
                      self.feedback[self.feedback.event_timestamp <= ts],
                      self.releases[self.releases.release_timestamp <= ts], ts)


def _utc(s: pd.Series) -> pd.Series:
    return pd.to_datetime(s, utc=True, format="ISO8601" if s.dtype == object else None).dt.tz_localize(None)


def frames_from_generated(data: dict) -> Frames:
    """Build frames straight from generator output, for tests and offline evaluation."""
    customers = pd.DataFrame(data["customers"]).assign(customer_ref=lambda d: d.external_customer_id)
    customers["id"] = customers.customer_ref
    customers["first_order_at"] = _utc(customers.first_order_at)
    orders = pd.DataFrame(data["orders"]).rename(columns={"customer_ref": "customer_id"})
    orders["ordered_at"] = _utc(orders.ordered_at)
    events = pd.DataFrame(data["events"]).rename(columns={"customer_ref": "customer_id"})
    events["id"] = range(1, len(events) + 1)
    events["event_timestamp"] = _utc(events.event_timestamp)
    feedback = pd.DataFrame(data["feedback"]).rename(columns={"customer_ref": "customer_id"})
    feedback["id"] = range(1, len(feedback) + 1)
    feedback["event_timestamp"] = _utc(feedback.event_timestamp)
    feedback["category"] = [extract(t, r)["category"] for t, r in zip(feedback.text, feedback.rating)]
    releases = pd.DataFrame(data["releases"])
    releases["release_timestamp"] = _utc(releases.release_timestamp)
    return Frames(customers, orders, events, feedback, releases, pd.Timestamp(data["meta"]["sim_now"]).tz_localize(None))


def connect():
    import pymysql

    url = urlparse(ai_config.AI_DB_URL)
    if not url.hostname:
        raise RuntimeError("AI_DB_URL is not configured")
    kwargs = {}
    if ai_config.AI_DB_SSL_CA:
        kwargs["ssl"] = ssl.create_default_context(cafile=ai_config.AI_DB_SSL_CA)
    conn = pymysql.connect(host=url.hostname, port=url.port or 3306, user=unquote(url.username or ""),
                           password=unquote(url.password or ""), database=url.path.lstrip("/"),
                           charset="utf8mb4", read_timeout=120, **kwargs)
    with conn.cursor() as cur:
        try:
            cur.execute("SET SESSION TRANSACTION READ ONLY")
        except pymysql.MySQLError:
            pass  # the database user is already read-only; this is only a second guard
        cur.execute("SET time_zone = '+00:00'")
    return conn


def _query(conn, sql: str, params=()) -> pd.DataFrame:
    with conn.cursor() as cur:
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description]
        return pd.DataFrame(cur.fetchall(), columns=cols)


_cache: dict = {}


def load_frames(as_of: str) -> Frames:
    """Load the analysis window, cached until the underlying row counts or clock change."""
    ts = pd.Timestamp(as_of)
    ts = ts.tz_convert(None) if ts.tzinfo else ts
    since = (ts - timedelta(days=LOOKBACK_DAYS)).to_pydatetime()
    conn = connect()
    try:
        version = tuple(_query(conn, "SELECT (SELECT COUNT(*) FROM feedback) f, (SELECT COUNT(*) FROM operational_events) e, "
                                     "(SELECT COUNT(*) FROM orders) o, (SELECT COUNT(*) FROM feedback WHERE category IS NOT NULL) c, "
                                     "(SELECT COUNT(*) FROM product_releases) r").iloc[0].tolist())
        key = (str(ts), version)
        if _cache.get("key") == key:
            return _cache["frames"]
        customers = _query(conn, "SELECT id, city, customer_segment, platform, device_os, app_version, first_order_at FROM customers")
        orders = _query(conn, "SELECT external_order_id, customer_id, status, CAST(amount AS DOUBLE) amount, payment_method, platform, "
                              "device_os, app_version, city, ordered_at, bank, payment_gateway, psp_app, os, os_version, device_model, network_type FROM orders WHERE ordered_at >= %s AND ordered_at <= %s", (since, ts.to_pydatetime()))
        events = _query(conn, "SELECT id, event_type, event_timestamp, customer_id, order_id, payment_status, payment_method, "
                              "CAST(amount AS DOUBLE) amount, platform, device_os, app_version, city, metadata, bank, payment_gateway, psp_app, os, os_version, device_model, network_type, http_status, latency_ms, error_code FROM operational_events "
                              "WHERE event_timestamp >= %s AND event_timestamp <= %s OR event_type IN "
                              "('weather_alert','menu_price_change','marketing_campaign','app_release_deployed')", (since, ts.to_pydatetime()))
        feedback = _query(conn, "SELECT id, source, customer_id, order_id, channel, rating, text, category, sentiment, event_timestamp "
                                "FROM feedback WHERE event_timestamp >= %s AND event_timestamp <= %s AND processing_status = 'processed' AND domain = 'payments'", (since, ts.to_pydatetime()))
        releases = _query(conn, "SELECT version, platform, release_timestamp, description FROM product_releases WHERE release_timestamp <= %s", (ts.to_pydatetime(),))
    finally:
        conn.close()
    for df, col in ((orders, "ordered_at"), (events, "event_timestamp"), (feedback, "event_timestamp"),
                    (releases, "release_timestamp"), (customers, "first_order_at")):
        df[col] = pd.to_datetime(df[col])
    frames = Frames(customers, orders, events, feedback, releases, ts)
    _cache.update(key=key, frames=frames)
    return frames


def load_feedback_by_ids(ids: list[int]) -> pd.DataFrame:
    if not ids:
        return pd.DataFrame(columns=["id", "text", "rating"])
    conn = connect()
    try:
        marks = ",".join(["%s"] * len(ids))
        return _query(conn, f"SELECT id, text, rating FROM feedback WHERE id IN ({marks})", tuple(ids))
    finally:
        conn.close()
