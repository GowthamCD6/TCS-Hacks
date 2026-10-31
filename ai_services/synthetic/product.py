"""Product domain data: real review text attached to a SYNTHETIC world for fictional "Zenbuds Pro".

Orders, batches, returns and tickets are synthetic. Review text is real, but its order link and date
are synthetic. Run from the repository root:  python -m ai_services.synthetic.product
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "synthetic_product"
TRUTH = ROOT / "eval" / "hidden_truth_product.json"
SEED = 20261105
START = datetime(2026, 9, 15, tzinfo=timezone.utc)
DAYS = 60
END = START + timedelta(days=DAYS)
B207_FROM = datetime(2026, 10, 5, tzinfo=timezone.utc)
B207_TO = datetime(2026, 10, 28, tzinfo=timezone.utc)
FIRMWARE_V13 = datetime(2026, 10, 12, tzinfo=timezone.utc)
SALE_FROM, SALE_TO = datetime(2026, 10, 8, tzinfo=timezone.utc), datetime(2026, 10, 22, tzinfo=timezone.utc)
COURIER_FROM, COURIER_TO = datetime(2026, 10, 15, tzinfo=timezone.utc), datetime(2026, 10, 20, tzinfo=timezone.utc)
COURIER_CITIES = ["Pune", "Delhi"]
PRODUCT_RE = r"earbud|earphone|headphone|headset|tws|neckband|bluetooth|smartwatch|power bank"
PRICE = 2499
CITIES = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Pune"]
BATCHES = [("B-198", "SUP-C", -5, 18, 700), ("B-201", "SUP-A", -5, 25, 1000), ("B-204", "SUP-B", 10, 40, 900),
           ("B-207", "SUP-C", 20, 43, 1200), ("B-210", "SUP-A", 30, 60, 900), ("B-212", "SUP-B", 42, 60, 800)]
PLANTED = ["Stopped charging after two weeks", "Not charging at all now, the case light stays off", "Earbuds will not charge any more after 12 days",
           "Worked fine then suddenly not charging", "The charging case died within a fortnight", "Left earbud is not charging since last week"]
TICKET_OTHER = ["Where is my order", "How do I pair the earbuds", "Need an invoice copy", "Sound is low on one side"]
RETURN_OTHER = ["changed_mind", "wrong_item", "sound_quality", "physical_damage"]


def prepare_reviews() -> pd.DataFrame:
    path = RAW / "flipkart_reviews.csv"
    df = None
    for encoding in ("utf-8", "cp1252"):
        try:
            df = pd.read_csv(path, encoding=encoding, on_bad_lines="skip")
            break
        except UnicodeDecodeError:
            continue
    if df is None:  # stray bytes defeat both, so keep what decodes
        df = pd.read_csv(path, encoding="cp1252", encoding_errors="replace", on_bad_lines="skip")
    df = df.dropna(subset=["ProductName"])
    kept = df[df.ProductName.str.contains(PRODUCT_RE, case=False, regex=True)]
    if len(kept) < 300:
        kept = df
    rows = []
    for r in kept.itertuples():
        text = " ".join(str(t) for t in (r.Review, r.Summary) if isinstance(t, str)).strip()
        rating = pd.to_numeric(r.Rate, errors="coerce")
        words = str(r.ProductName).split()
        if words:  # the first word of a listing is its brand
            text = re.sub(re.escape(words[0]), "", text, flags=re.I).strip()
        if len(text) >= 8 and pd.notna(rating):
            rows.append({"rating": int(rating), "text": text[:600]})
    out = pd.DataFrame(rows).drop_duplicates("text")
    out.to_csv(RAW / "product_reviews.csv", index=False)
    print("product reviews kept", len(out))
    return out


def iso(ts: datetime) -> str:
    return ts.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def generate(reviews: pd.DataFrame, n_orders: int = 3000, seed: int = SEED) -> dict:
    rng = np.random.default_rng(seed)
    batches = [{"batch_id": b, "supplier": s, "start": START + timedelta(days=a), "end": START + timedelta(days=e), "units_produced": u} for b, s, a, e, u in BATCHES]
    orders, returns, tickets, feedback = [], [], [], []
    failures = []
    for i in range(n_orders):
        day = START + timedelta(days=float(rng.uniform(0, DAYS)))
        live = [b for b in batches if b["start"] <= day < b["end"]]
        weights = np.array([3.0 if b["batch_id"] == "B-207" else 1.0 for b in live])
        batch = live[int(rng.choice(len(live), p=weights / weights.sum()))]
        delivered = day + timedelta(days=float(rng.uniform(2, 6)))
        city = str(rng.choice(CITIES, p=[0.26, 0.22, 0.2, 0.12, 0.12, 0.08]))
        firmware = "v1.3" if day >= FIRMWARE_V13 and rng.random() < 0.55 else "v1.2"
        in_sale = SALE_FROM <= day < SALE_TO
        campaign = "FEST-26" if in_sale and rng.random() < 0.65 else None
        courier = "COURIER-EVT-1" if COURIER_FROM <= delivered < COURIER_TO and city in COURIER_CITIES and rng.random() < 0.7 else None
        order = {"order_id": f"ZB-{i + 1:05d}", "batch_id": batch["batch_id"], "supplier": batch["supplier"], "city": city, "order_date": iso(day), "delivery_date": iso(delivered),
                 "buyer_type": str(rng.choice(["new", "returning", "business"], p=[0.5, 0.42, 0.08])), "campaign_id": campaign, "firmware": firmware, "courier_incident": courier, "price": PRICE}
        orders.append(order)
        fail_p = 0.3 if batch["batch_id"] == "B-207" else 0.004
        if rng.random() < fail_p:
            when = delivered + timedelta(days=float(rng.uniform(10, 20)))
            if when < END:
                failures.append((order, when))
                if rng.random() < 0.6:
                    returns.append({"order_id": order["order_id"], "reason_code": "not_charging", "returned_at": iso(when + timedelta(days=2))})
                if rng.random() < 0.7:
                    tickets.append({"order_id": order["order_id"], "topic": "not_charging", "text": "Customer reports the earbuds stopped charging", "opened_at": iso(when + timedelta(days=1))})
        elif rng.random() < (0.08 if courier else 0.04):
            at = delivered + timedelta(days=float(rng.uniform(1, 8)))
            if at < END:
                returns.append({"order_id": order["order_id"], "reason_code": "physical_damage" if courier else str(rng.choice(RETURN_OTHER)), "returned_at": iso(at)})
        if rng.random() < 0.08:
            at = delivered + timedelta(days=float(rng.uniform(0, 10)))
            if at < END:
                tickets.append({"order_id": order["order_id"], "topic": "general", "text": str(rng.choice(TICKET_OTHER)), "opened_at": iso(at)})

    planted = [failures[int(i)] for i in rng.permutation(len(failures))[:150] if failures[int(i)][0]["batch_id"] == "B-207"]
    for n, (order, when) in enumerate(planted):
        feedback.append({"source_record_id": f"zb-planted-{n}", "order_id": order["order_id"], "rating": int(rng.integers(1, 3)), "text": str(rng.choice(PLANTED)),
                         "event_timestamp": iso(when + timedelta(days=2)), "metadata": {"synthetic": True, "planted": True}})
    sample = reviews.sample(min(len(reviews), 1200), random_state=seed)
    for n, r in enumerate(sample.itertuples()):
        order = orders[int(rng.integers(0, len(orders)))]
        at = datetime.fromisoformat(order["delivery_date"].replace("Z", "+00:00")) + timedelta(days=float(rng.uniform(1, 9)))
        if at < END:
            feedback.append({"source_record_id": f"zb-real-{n}", "order_id": order["order_id"], "rating": int(r.rating), "text": r.text, "event_timestamp": iso(at),
                             "metadata": {"real_text": True, "synthetic_order_link_and_date": True}})
    sold = pd.Series([o["batch_id"] for o in orders]).value_counts()
    batch_rows = [{"batch_id": b["batch_id"], "supplier": b["supplier"], "started_at": iso(b["start"]), "units_produced": b["units_produced"], "units_sold": int(sold.get(b["batch_id"], 0))} for b in batches]
    affected = sorted({o["order_id"] for o, _ in failures if o["batch_id"] == "B-207"})
    truth = {"label": "SYNTHETIC answer key. Agent tools and APIs must never read this file.", "suspect": "batch_id=B-207", "hypothesis_key": "batch_id:B-207", "affected_orders": affected,
             "decoys": ["firmware:v1.3", "campaign_id:FEST-26", "courier_incident:COURIER-EVT-1"]}
    return {
        "batches": batch_rows, "orders": orders, "returns": returns, "tickets": tickets, "feedback": feedback,
        "firmware_releases": [{"version": "v1.2", "released_at": iso(START - timedelta(days=40))}, {"version": "v1.3", "released_at": iso(FIRMWARE_V13)}],
        "campaigns": [{"campaign_id": "FEST-26", "name": "Festival sale", "started_at": iso(SALE_FROM), "ended_at": iso(SALE_TO)}],
        "courier_incidents": [{"incident_ref": "COURIER-EVT-1", "city": c, "started_at": iso(COURIER_FROM), "ended_at": iso(COURIER_TO)} for c in COURIER_CITIES],
        "truth": truth, "meta": {"as_of": iso(END), "seed": seed, "synthetic": True, "product": "Zenbuds Pro (fictional)"},
    }


def main() -> None:
    reviews = prepare_reviews()
    data = generate(reviews)
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("batches", "orders", "returns", "tickets", "feedback", "firmware_releases", "campaigns", "courier_incidents"):
        with (OUT / f"{name}.jsonl").open("w", encoding="utf-8") as f:
            for row in data[name]:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
    (OUT / "meta.json").write_text(json.dumps(data["meta"]), encoding="utf-8")
    TRUTH.write_text(json.dumps(data["truth"], indent=2), encoding="utf-8")
    print({k: len(data[k]) for k in ("orders", "returns", "tickets", "feedback")}, "affected", len(data["truth"]["affected_orders"]))


if __name__ == "__main__":
    main()
