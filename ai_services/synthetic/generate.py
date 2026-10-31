"""Deterministic synthetic food-delivery dataset with one planted incident and six decoys.

Every record is synthetic and labelled so. Nothing here represents a real company or customer, which is
why banks, gateways and PSP apps have neutral names.

Run from the repository root:  python -m ai_services.synthetic.generate
Writes JSONL files for the Node seeder to data/synthetic/ and the hidden truth to eval/.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "synthetic"
TRUTH_PATH = ROOT / "eval" / "hidden_truth.json"

SEED = 20261031
START = datetime(2026, 8, 15, tzinfo=timezone.utc)
DAYS = 60
END = START + timedelta(days=DAYS)
RELEASE_V23 = END - timedelta(days=5, hours=6)
RAIN_START = END - timedelta(days=4)
RAIN_END = END - timedelta(days=1)
PRICE_CHANGE = END - timedelta(days=12)
CAMPAIGN_START = END - timedelta(days=18)

# Payment decoys, each on its own day, each breaking the funnel at a different stage.
BANK_OUTAGE = (END - timedelta(days=24, hours=-12), timedelta(hours=4), "BANK_B")
GATEWAY_FAILURE = (END - timedelta(days=17, hours=-13), timedelta(hours=3), "GATEWAY_C")
ORDER_OUTAGE = (END - timedelta(days=10, hours=-14), timedelta(minutes=90), None)

REVERSAL_TAT_DAYS = 5  # RBI TAT circular, 20 Sep 2019: UPI debit without confirmation, reversal by T+5
CITIES = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Pune"]
CITY_P = [0.26, 0.22, 0.2, 0.12, 0.12, 0.08]
RAIN_CITIES = ["Chennai", "Mumbai"]
ANDROID_OS = ["Android 12", "Android 13", "Android 14"]
ANDROID_OS_P = [0.25, 0.38, 0.37]
IOS_OS = ["iOS 16", "iOS 17"]
PAYMENTS = ["upi", "card", "wallet", "cod"]
PAYMENTS_P = [0.55, 0.22, 0.13, 0.10]
BANKS = ["BANK_A", "BANK_B", "BANK_C", "BANK_D", "BANK_E"]
BANKS_P = [0.32, 0.27, 0.19, 0.14, 0.08]
GATEWAYS = ["GATEWAY_A", "GATEWAY_B", "GATEWAY_C"]
GATEWAYS_P = [0.5, 0.32, 0.18]
PSPS = ["PSP_A", "PSP_B", "PSP_C"]
PSPS_P = [0.48, 0.38, 0.14]
ANDROID_DEVICES = ["DEVICE_A1", "DEVICE_A2", "DEVICE_A3", "DEVICE_A4"]
IOS_DEVICES = ["DEVICE_I1", "DEVICE_I2"]
NETWORKS = ["wifi", "4g", "5g"]
NETWORKS_P = [0.35, 0.5, 0.15]
ABANDON_P = 0.008  # customer leaves before entering the UPI PIN
BASE_DEBIT_FAIL_P = 0.017  # with ABANDON_P gives the 2.5% baseline recorded in data/calibration.json
AFFECTED_FAILURE_P = 0.32  # chance a v2.3 + Android 14 + UPI order loses its confirmation


@dataclass(frozen=True)
class Templates:
    payment_incident = [
        "Money deducted through UPI but no order was created in the app",
        "UPI payment went through, amount debited, app shows nothing placed",
        "paisa kat gaya but order nahi bana, please refund",
        "Paid Rs {amt} by UPI and the app is stuck on confirming payment, no order",
        "Payment confirmation screen hangs after UPI, money gone and no food",
        "My account was debited for order {oid} yet there is no order in my history",
        "After latest update UPI payment does not confirm and the amount was deducted",
        "Charged twice? UPI debit shows in bank but app says order not placed",
    ]
    payment_pending = [
        "UPI payment has been pending for a long time, my bank is not responding",
        "Payment failed again, the bank server seems down",
        "UPI keeps failing with a bank error, could not place my order",
    ]
    payment_background = [
        "Card payment was declined at checkout, had to retry",
        "UPI failed the first time but worked on the second attempt",
        "Refund for my cancelled order took longer than expected",
        "Wallet balance did not apply at checkout",
    ]
    delivery = [
        "Delivery was very late, food arrived cold",
        "Order delayed by more than an hour with no update",
        "Rider took too long, tracking was stuck for ages",
        "Late delivery again in heavy rain, food was soggy",
        "delivery bahut late thi, rider stuck tha",
    ]
    pricing = [
        "Menu prices went up again, this is too expensive now",
        "Prices are higher on the app than at the restaurant",
        "Why did the price of my usual biryani increase so much",
        "Platform fee and menu price hike make ordering not worth it",
    ]
    food = [
        "Food was cold and the packaging leaked",
        "Wrong item delivered, missing my dessert",
        "Quality of the food was poor this time",
    ]
    app = [
        "App is slow to load the restaurant list",
        "Search does not find my favourite restaurant",
        "App logged me out for no reason",
    ]
    positive = [
        "Great service, the food arrived hot and early",
        "Loved the quick delivery, thank you",
        "Smooth ordering experience, very happy",
    ]


def iso(ts: datetime) -> str:
    return ts.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def app_version_at(ts: datetime, platform: str, adopt_at: datetime) -> str:
    if platform == "ios":
        return "2.2" if ts >= START + timedelta(days=20) else "2.1"
    if ts >= adopt_at:
        return "2.3"
    return "2.2" if ts >= START + timedelta(days=20) else "2.1"


def in_window(ts: datetime, window: tuple) -> bool:
    return window[0] <= ts < window[0] + window[1]


def generate(n_customers: int = 5000, seed: int = SEED) -> dict:
    rng = np.random.default_rng(seed)
    customers, orders, events, feedback = [], [], [], []
    truth_orders, truth_reversed, truth_customers = [], [], set()
    claimers, lost = [], {}

    def choose(items, p=None):
        return items[int(rng.choice(len(items), p=p))]

    def add_feedback(cust, ts, text, oid=None, rating=2):
        fid = f"syn-fb-{len(feedback) + 1:06d}"
        channel = choose(["app_review", "support_ticket", "social", "in_app"], [0.35, 0.35, 0.15, 0.15])
        feedback.append({
            "source": "synthetic", "source_record_id": fid, "customer_ref": cust["external_customer_id"],
            "order_id": oid, "channel": channel, "rating": rating, "text": text,
            "language": "hi-en" if "nahi" in text or "bahut" in text else "en",
            "event_timestamp": iso(ts), "metadata": {"synthetic": True},
        })

    for i in range(n_customers):
        platform = "android" if rng.random() < 0.68 else "ios"
        device_os = choose(ANDROID_OS, ANDROID_OS_P) if platform == "android" else choose(IOS_OS)
        tier = choose(["casual", "regular", "power"], [0.5, 0.35, 0.15])
        first = START - timedelta(days=int(rng.integers(0, 300))) if rng.random() > 0.12 \
            else START + timedelta(days=int(rng.integers(0, DAYS)))
        customers.append({
            "external_customer_id": f"SYN-C{i + 1:05d}", "name": None, "email": None, "phone": None,
            "city": choose(CITIES, CITY_P), "customer_segment": tier, "platform": platform,
            "device_os": device_os, "first_order_at": iso(first),
            "_adopt": RELEASE_V23 + timedelta(hours=float(rng.exponential(30))),
            "_rate": {"casual": 0.05, "regular": 0.14, "power": 0.33}[tier],
            "_pay": choose(PAYMENTS, PAYMENTS_P),
            "_bank": choose(BANKS, BANKS_P), "_psp": choose(PSPS, PSPS_P),
            "_device": choose(ANDROID_DEVICES if platform == "android" else IOS_DEVICES),
        })

    def record_lost(oid, c, amt, ts, cause, base):
        """Debited with no order: decide whether and when the money comes back."""
        reversal = None
        if cause == "H1":
            if rng.random() < 0.2:
                reversal = ts + timedelta(hours=float(rng.uniform(2, 20)))
        elif rng.random() < 0.85:
            reversal = ts + timedelta(days=float(rng.uniform(1, 4)))
        if reversal:
            for typ, dt, st in (("reversal_initiated", timedelta(), "initiated"), ("reversal_completed", timedelta(minutes=30), "completed"),
                                ("payment_reversed", timedelta(minutes=30), "reversed")):
                events.append({**base, "order_id": oid, "amount": amt, "event_type": typ, "event_timestamp": iso(reversal + dt), "payment_status": st})
        lost[oid] = {"cause": cause, "amount": amt, "captured_at": iso(ts), "customer": c["external_customer_id"],
                     "reversal_completed_at": iso(reversal + timedelta(minutes=30)) if reversal else None}
        return reversal

    order_no = 0
    for day in range(DAYS):
        day_start = START + timedelta(days=day)
        # Decoy: seasonal/campaign traffic raises orders and feedback together, not the per-order rate.
        traffic = 1.45 if day_start >= CAMPAIGN_START else 1.0
        traffic *= 1.15 if day_start.weekday() >= 4 else 1.0
        for c in customers:
            if datetime.fromisoformat(c["first_order_at"].replace("Z", "+00:00")) > day_start + timedelta(days=1):
                continue
            for _ in range(int(rng.poisson(c["_rate"] * traffic))):
                ts = day_start + timedelta(minutes=float(rng.uniform(420, 1410)))
                if ts >= END:
                    continue
                order_no += 1
                oid = f"SYN-O{order_no:07d}"
                pay = c["_pay"] if rng.random() < 0.8 else choose(PAYMENTS, PAYMENTS_P)
                amt = round(float(rng.lognormal(5.85, 0.45)), 2)
                ver = app_version_at(ts, c["platform"], c["_adopt"])
                os_version = c["device_os"].split()[-1]
                base = {
                    "customer_ref": c["external_customer_id"], "platform": c["platform"], "device_os": c["device_os"],
                    "app_version": ver, "city": c["city"], "payment_method": pay, "bank": c["_bank"] if pay == "upi" else None,
                    "payment_gateway": choose(GATEWAYS, GATEWAYS_P) if pay != "cod" else None, "psp_app": c["_psp"] if pay == "upi" else None,
                    "os": c["platform"], "os_version": os_version, "device_model": c["_device"], "network_type": choose(NETWORKS, NETWORKS_P),
                }

                def ev(t, typ, **kw):
                    events.append({**base, "event_type": typ, "event_timestamp": iso(t), "order_id": oid, "amount": amt, **kw})

                exposed = ver == "2.3" and c["device_os"] == "Android 14" and pay == "upi"
                status = "delivered"
                if pay == "upi":
                    ev(ts - timedelta(seconds=20), "order_draft_created", payment_status="ok")
                    ev(ts, "payment_initiated", payment_status="ok")
                    ev(ts + timedelta(seconds=3), "collect_request_sent", payment_status="ok")
                    if rng.random() < ABANDON_P:
                        status = "payment_failed"
                        ev(ts + timedelta(seconds=60), "payment_failed", payment_status="abandoned", error_code="U16")
                    else:
                        ev(ts + timedelta(seconds=15), "customer_authorised", payment_status="ok")
                        outage = in_window(ts, BANK_OUTAGE[:2]) and base["bank"] == BANK_OUTAGE[2]
                        r = rng.random()
                        if outage and r < 0.2:
                            status = "payment_pending"
                            ev(ts + timedelta(seconds=20), "bank_debit_pending", payment_status="pending", error_code="BT")
                        elif r < (0.75 if outage else BASE_DEBIT_FAIL_P):
                            status = "payment_failed"
                            ev(ts + timedelta(seconds=20), "bank_debit_failed", payment_status="failed", error_code="U30")
                            ev(ts + timedelta(seconds=20), "payment_failed", payment_status="failed", error_code="U30")
                        if status != "delivered":
                            if outage and rng.random() < 0.12:
                                add_feedback(c, ts + timedelta(minutes=25), choose(Templates.payment_pending), oid, rating=2)
                        else:
                            ev(ts + timedelta(seconds=25), "bank_debit_success", payment_status="ok")
                            ev(ts + timedelta(seconds=25), "payment_captured", payment_status="captured")
                            gw_out = in_window(ts, GATEWAY_FAILURE[:2]) and base["payment_gateway"] == GATEWAY_FAILURE[2]
                            cause = None
                            if gw_out and rng.random() < 0.6:
                                cause = "H3"
                            else:
                                ev(ts + timedelta(seconds=27), "gateway_callback_received", payment_status="ok", http_status=200, latency_ms=int(rng.integers(150, 900)))
                                if exposed and rng.random() < AFFECTED_FAILURE_P:
                                    cause = "H1"
                                    ev(ts + timedelta(seconds=57), "client_confirm_call", payment_status="timeout", http_status=504, latency_ms=30000, error_code="CONFIRM_TIMEOUT")
                                else:
                                    ev(ts + timedelta(seconds=30), "client_confirm_call", payment_status="ok", http_status=200, latency_ms=int(rng.integers(80, 400)))
                                    if in_window(ts, ORDER_OUTAGE[:2]) and rng.random() < 0.45:
                                        cause = "H4"
                                        ev(ts + timedelta(seconds=31), "order_create_failed", payment_status="failed", http_status=503, error_code="ORDER_5XX")
                            if cause:
                                status = "no_order"
                                reversal = record_lost(oid, c, amt, ts + timedelta(seconds=25), cause, base)
                                if cause == "H1":
                                    truth_customers.add(c["external_customer_id"])
                                    (truth_reversed if reversal else truth_orders).append(oid)
                                if rng.random() < (0.42 if cause == "H1" else 0.2):
                                    delay = timedelta(hours=float(rng.uniform(0.2, 7)))
                                    text = choose(Templates.payment_incident).format(amt=int(amt), oid=oid)
                                    if ts + delay < END:
                                        add_feedback(c, ts + delay, text, oid, rating=1)
                elif pay != "cod":
                    ev(ts, "payment_initiated", payment_status="initiated")
                    if rng.random() < 0.025:
                        ev(ts + timedelta(seconds=20), "payment_failed", payment_status="failed")
                        status = "payment_failed"
                    else:
                        ev(ts + timedelta(seconds=25), "payment_captured", payment_status="captured")
                if status != "delivered":
                    orders.append({**base, "external_order_id": oid, "status": status, "amount": amt, "ordered_at": iso(ts)})
                    continue
                ev(ts + timedelta(seconds=40), "order_created", payment_status="captured" if pay != "cod" else None)
                raining = RAIN_START <= ts < RAIN_END and c["city"] in RAIN_CITIES
                late_p = 0.45 if raining else 0.06
                late = rng.random() < late_p
                if rng.random() < 0.012:
                    ev(ts + timedelta(minutes=3), "order_cancelled")
                    status = "cancelled"
                elif late:
                    ev(ts + timedelta(minutes=55), "delivery_delayed", metadata={"delay_minutes": int(rng.integers(25, 80))})
                orders.append({**base, "external_order_id": oid, "status": status, "amount": amt, "ordered_at": iso(ts)})

                r = rng.random()
                fts = ts + timedelta(hours=float(rng.uniform(0.7, 5)))
                if fts >= END:
                    continue
                price_p = 0.012 if ts >= PRICE_CHANGE else 0.004
                delivery_p = 0.2 if late else 0.004
                cum = [delivery_p, price_p, 0.004, 0.004, 0.004, 0.02]
                if r < cum[0]:
                    add_feedback(c, fts, choose(Templates.delivery), oid, rating=2)
                elif r < sum(cum[:2]):
                    add_feedback(c, fts, choose(Templates.pricing), None, rating=3)
                elif r < sum(cum[:3]):
                    add_feedback(c, fts, choose(Templates.food), oid, rating=2)
                elif r < sum(cum[:4]):
                    add_feedback(c, fts, choose(Templates.app), None, rating=3)
                elif r < sum(cum[:5]):
                    add_feedback(c, fts, choose(Templates.payment_background), oid, rating=3)
                elif r < sum(cum[:6]):
                    add_feedback(c, fts, choose(Templates.positive), oid, rating=5)

    # Customers who complain about a debit with no matching failure. Refund policy must not pay these.
    delivered = [o for o in orders if o["status"] == "delivered" and o["ordered_at"] >= iso(RELEASE_V23)]
    by_ref = {c["external_customer_id"]: c for c in customers}
    for idx in rng.choice(len(delivered), size=8, replace=False):
        o = delivered[int(idx)]
        ts = datetime.fromisoformat(o["ordered_at"].replace("Z", "+00:00")) + timedelta(hours=3)
        if ts < END:
            add_feedback(by_ref[o["customer_ref"]], ts, "Money deducted but I never got my order", o["external_order_id"], 1)
            claimers.append(o["external_order_id"])

    # Captures with no order record at all: reconcile must call these unknown, not guess.
    unknown = {}
    for i in range(6):
        c = by_ref[customers[int(rng.integers(0, len(customers)))]["external_customer_id"]]
        at = END - timedelta(days=int(rng.integers(1, 4)), hours=int(rng.integers(1, 20)))
        oid, amt = f"SYN-ORPHAN-{i + 1}", round(float(rng.lognormal(5.85, 0.45)), 2)
        events.append({"customer_ref": c["external_customer_id"], "order_id": oid, "amount": amt, "event_type": "payment_captured", "event_timestamp": iso(at),
                       "payment_status": "captured", "payment_method": "upi", "platform": c["platform"], "device_os": c["device_os"], "city": c["city"]})
        unknown[oid] = {"amount": amt, "captured_at": iso(at)}

    releases = [
        {"version": "2.1", "platform": "android", "release_timestamp": iso(START - timedelta(days=30)),
         "description": "Baseline release", "changes": ["Home feed refresh"]},
        {"version": "2.1", "platform": "ios", "release_timestamp": iso(START - timedelta(days=30)),
         "description": "Baseline release", "changes": ["Home feed refresh"]},
        {"version": "2.2", "platform": "android", "release_timestamp": iso(START + timedelta(days=20)),
         "description": "Offers carousel", "changes": ["Offers carousel", "Search ranking"]},
        {"version": "2.2", "platform": "ios", "release_timestamp": iso(START + timedelta(days=20)),
         "description": "Offers carousel", "changes": ["Offers carousel", "Search ranking"]},
        {"version": "2.3", "platform": "android", "release_timestamp": iso(RELEASE_V23),
         "description": "New UPI intent flow and payment confirmation screen",
         "changes": ["UPI intent callback rewrite", "Payment confirmation screen"]},
    ]
    context = [
        ("marketing_campaign", CAMPAIGN_START, {"name": "Festive Feast", "end": iso(END)}, None),
        ("menu_price_change", PRICE_CHANGE, {"avg_increase_pct": 8}, None),
    ] + [("weather_alert", RAIN_START, {"condition": "heavy_rain", "end": iso(RAIN_END)}, c) for c in RAIN_CITIES]
    for typ, ts, meta, city in context:
        events.append({"event_type": typ, "event_timestamp": iso(ts), "city": city, "metadata": meta})
    for r in releases:
        events.append({"event_type": "app_release_deployed", "event_timestamp": r["release_timestamp"],
                       "platform": r["platform"], "app_version": r["version"], "metadata": {"description": r["description"]}})

    for c in customers:
        c["app_version"] = app_version_at(END, c["platform"], c["_adopt"])
        for k in [k for k in c if k.startswith("_")]:
            del c[k]
    feedback.sort(key=lambda f: f["event_timestamp"])
    events.sort(key=lambda e: e["event_timestamp"])

    def window(w):
        return {"start": iso(w[0]), "end": iso(w[0] + w[1])}

    truth = {
        "label": "SYNTHETIC answer key for the simulation test. Agent tools and APIs must never read this file.",
        "seed": seed, "sim_end": iso(END), "reversal_tat_days": REVERSAL_TAT_DAYS,
        "incident": {
            "category": "payment", "hypothesis_key": "release_2.3_android",
            "release_version": "2.3", "release_timestamp": iso(RELEASE_V23),
            "segment": {"device_os": "Android 14", "app_version": "2.3", "payment_method": "upi"},
            "affected_customers": sorted(truth_customers),
            "refund_eligible_orders": sorted(truth_orders),
            "already_reversed_orders": sorted(truth_reversed),
            "false_claim_orders": sorted(claimers),
        },
        "planted_breaks": {
            "H1": {"hypothesis_key": "release_2.3_android", "stage": "client_confirm_call", "segment": {"os_version": "14", "app_version": "2.3", "payment_method": "upi"},
                   "window": {"start": iso(RELEASE_V23), "end": iso(END)}},
            "H2": {"hypothesis_key": "bank_outage", "stage": "bank_debit_success", "segment": {"bank": BANK_OUTAGE[2]}, "window": window(BANK_OUTAGE)},
            "H3": {"hypothesis_key": "gateway_callback_failure", "stage": "gateway_callback_received", "segment": {"payment_gateway": GATEWAY_FAILURE[2]}, "window": window(GATEWAY_FAILURE)},
            "H4": {"hypothesis_key": "order_service_outage", "stage": "order_created", "segment": {}, "window": window(ORDER_OUTAGE)},
        },
        "reconciliation": {"lost": lost, "unknown": unknown},
        "decoys": [
            {"name": "weather", "category": "delivery", "hypothesis_key": "weather_rain"},
            {"name": "menu_price", "category": "pricing", "hypothesis_key": "menu_price_change"},
            {"name": "seasonal_traffic", "category": None, "hypothesis_key": "seasonal_traffic"},
        ],
    }
    return {"customers": customers, "orders": orders, "events": events, "feedback": feedback,
            "releases": releases, "truth": truth,
            "meta": {"sim_now": iso(END), "seed": seed, "synthetic": True}}


def main() -> None:
    data = generate()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("customers", "orders", "events", "feedback", "releases"):
        with (OUT_DIR / f"{name}.jsonl").open("w", encoding="utf-8") as f:
            for row in data[name]:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
    (OUT_DIR / "meta.json").write_text(json.dumps(data["meta"]), encoding="utf-8")
    TRUTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    TRUTH_PATH.write_text(json.dumps(data["truth"], indent=2), encoding="utf-8")
    print({k: len(data[k]) for k in ("customers", "orders", "events", "feedback")},
          "lost by cause:", {c: sum(v["cause"] == c for v in data["truth"]["reconciliation"]["lost"].values()) for c in ("H1", "H3", "H4")})


if __name__ == "__main__":
    main()
