"""Label about 1,500 real reviews with the LLM, then set aside 200 for a human to check.

The 200 gold reviews are the M1 test set and are never used for training. human_label stays blank
until a person fills it in; nothing in this project may fill it automatically.

Run from the repository root:  python -m ai_services.scripts.label_reviews
Needs GROQ_MODEL set. Safe to re-run: finished reviews are kept.
"""

import json
import re
import time
from pathlib import Path

import pandas as pd
import yaml

from ai_services.analytics.extraction import redact
from ai_services.config import ai_config
from ai_services.prompts.recoveriq import UNTRUSTED_NOTE
from ai_services.providers.groq_provider import LLMClient

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "play_reviews.csv"
LABELS = ROOT / "data" / "labels"
OUT = LABELS / "review_labels_llm.csv"
GOLD = LABELS / "gold_review_labels.csv"
TAXONOMY = yaml.safe_load((ROOT / "config" / "taxonomy.yaml").read_text(encoding="utf-8"))["labels"]
TARGET = 1500
GOLD_SIZE = 200
BATCH = 20
SEED = 2026
PAYMENT_RE = re.compile(r"refund|payment|paid|upi|debit|deduct|charged|money|wallet|amount", re.I)
SYSTEM = f"""You label customer reviews of a food-delivery app. {UNTRUSTED_NOTE}
Choose exactly one label for each review:
{json.dumps(TAXONOMY, indent=1)}
Return JSON: {{"labels": [{{"i": <review number>, "label": "<one label>"}}]}} with one entry per review."""


def sample() -> pd.DataFrame:
    """Half payment-related by keyword, because payment complaints are rare and M1 needs them."""
    df = pd.read_csv(RAW).dropna(subset=["text"]).reset_index(drop=True)
    pay = df[df.text.str.contains(PAYMENT_RE)]
    other = df.drop(pay.index)
    n = min(len(pay), TARGET // 2)
    picked = pd.concat([pay.sample(n, random_state=SEED), other.sample(min(len(other), TARGET - n), random_state=SEED)])
    return picked.sample(frac=1, random_state=SEED).reset_index(drop=True).rename_axis("review_id").reset_index()


def main() -> None:
    LABELS.mkdir(parents=True, exist_ok=True)
    picked = sample()
    done = pd.read_csv(OUT, usecols=["review_id", "llm_label"]) if OUT.exists() else pd.DataFrame(columns=["review_id", "llm_label"])
    finished = set(done.review_id)
    rows = done.to_dict("records")
    todo = picked[~picked.review_id.isin(finished)]
    failures = 0
    for start in range(0, len(todo), BATCH):
        part = todo.iloc[start:start + BATCH]
        body = "\n".join(f'{i}. <customer_text>{redact(t)[:400]}</customer_text>' for i, t in zip(part.review_id, part.text))
        llm = LLMClient()
        got = llm.json(SYSTEM, body, 900) or {}
        good = {x.get("i"): x.get("label") for x in got.get("labels", []) if isinstance(x, dict) and x.get("label") in TAXONOMY}
        failures += len(part) - sum(i in good for i in part.review_id)
        rows += [{"review_id": i, "llm_label": good[i]} for i in part.review_id if i in good]
        pd.DataFrame(rows).to_csv(OUT, index=False)
        time.sleep(14)  # the provider allows 8,000 tokens a minute, and a batch uses about 1,500
    labelled = pd.DataFrame(rows).merge(picked, on="review_id")
    labelled.to_csv(OUT, index=False)
    print("labelled", len(labelled), "failed", failures, "model", ai_config.GROQ_MODEL)
    print(labelled.llm_label.value_counts().to_string())
    if not GOLD.exists():
        share = GOLD_SIZE / len(labelled)
        gold = labelled.groupby("llm_label", group_keys=False).apply(lambda g: g.sample(max(1, round(len(g) * share)), random_state=SEED))
        gold = gold.head(GOLD_SIZE)[["review_id", "app", "rating", "text", "llm_label"]].assign(human_label="")
        gold.to_csv(GOLD, index=False)
        print("gold file written", len(gold))


if __name__ == "__main__":
    main()
