"""Train M1, the payment-complaint intent classifier, on real text only: BANKING77 and Play reviews.

The human-checked gold reviews are never used for training. Until human_label is filled in, the report
says the real test score is not available and gives clearly labelled proxy numbers instead.

Run from the repository root:  python -m ai_services.scripts.train_m1
"""

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import yaml
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.svm import LinearSVC

from ai_services.analytics.extraction import extract, redact
from ai_services.config import ai_config

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "banking77"
LABELS = ROOT / "data" / "labels"
MODEL_DIR = ROOT / "models" / "m1_intent"
REPORT = ROOT / "eval" / "m1_report.json"
TAX = yaml.safe_load((ROOT / "config" / "taxonomy.yaml").read_text(encoding="utf-8"))
CLASSES = list(TAX["labels"])
PAYMENT = CLASSES[:5]
COARSE = {**{c: "payment" for c in PAYMENT}, "delivery_delay": "delivery", "price_complaint": "pricing", "food_quality": "food_quality",
          "app_bug_other": "app_ux", "praise_or_neutral": "praise"}
THRESHOLD = 0.55
SEED = 2026


def banking(split: str) -> pd.DataFrame:
    df = pd.read_csv(RAW / f"{split}.csv")
    names = json.loads((RAW / "labels.json").read_text(encoding="utf-8"))
    df["intent"] = df.label.map(lambda i: names[i])
    df["y"] = df.intent.map(TAX["banking77_map"])
    return df.dropna(subset=["y"])[["text", "y"]].assign(source="banking77")


def scores(y, pred) -> dict:
    labels = sorted(set(y) | set(pred))
    per = f1_score(y, pred, labels=labels, average=None, zero_division=0)
    return {"macro_f1": round(float(f1_score(y, pred, labels=labels, average="macro", zero_division=0)), 4),
            "per_class_f1": {c: round(float(v), 4) for c, v in zip(labels, per)}, "n": len(y)}


def main() -> None:
    gold = pd.read_csv(LABELS / "gold_review_labels.csv", keep_default_na=False)
    reviews = pd.read_csv(LABELS / "review_labels_llm.csv")
    reviews = reviews[~reviews.review_id.isin(gold.review_id)]
    train_rev, dev = train_test_split(reviews, test_size=0.15, random_state=SEED)
    train = pd.concat([banking("train"), train_rev.rename(columns={"llm_label": "y"})[["text", "y"]].assign(source="play_reviews")], ignore_index=True)
    train["text"] = train.text.astype(str).map(redact)
    digest = hashlib.sha256("\n".join(train.text + "|" + train.y).encode()).hexdigest()

    encoder = SentenceTransformer(ai_config.EMBEDDING_MODEL)
    embed = lambda texts: encoder.encode(list(texts), normalize_embeddings=True, show_progress_bar=False, batch_size=128)  # noqa: E731
    clf = LogisticRegression(max_iter=2000, class_weight="balanced", C=8.0)
    clf.fit(embed(train.text), train.y)
    base = make_pipeline(TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True), LinearSVC(class_weight="balanced"))
    base.fit(train.text, train.y)

    def predict(texts):
        prob = clf.predict_proba(embed(texts))
        return clf.classes_[prob.argmax(1)], prob.max(1)

    report = {
        "model": "frozen MiniLM embeddings + class-weighted LogisticRegression", "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_data": {"banking77_rows": int((train.source == "banking77").sum()), "play_review_rows": int((train.source == "play_reviews").sum()),
                          "synthetic_rows": 0, "sha256": digest, "class_counts": train.y.value_counts().to_dict()},
        "confidence_threshold": THRESHOLD, "food_app_labels_source": "LLM annotation of real reviews",
    }
    human = gold[gold.human_label.astype(str).str.strip() != ""]
    if len(human) == len(gold) and len(gold):
        y = human.human_label.tolist()
        pred, conf = predict(human.text)
        report["human_checked_test"] = {
            "status": "measured", "m1": scores(y, pred), "baseline_tfidf_svc": scores(y, base.predict(human.text)),
            "llm_annotator_vs_human": scores(y, human.llm_label),
            "rule_extractor_coarse_accuracy": round(float(np.mean([extract(t)["category"] == COARSE[l] for t, l in zip(human.text, y)])), 4),
            "m1_coarse_accuracy": round(float(np.mean([COARSE[p] == COARSE[l] for p, l in zip(pred, y)])), 4),
            "routing_share_to_llm": round(float((conf < THRESHOLD).mean()), 4),
            "labels": CLASSES, "confusion_matrix": confusion_matrix(y, pred, labels=CLASSES).tolist(),
        }
    else:
        report["human_checked_test"] = {"status": "not_available", "reason": f"{len(human)} of {len(gold)} gold reviews have a human_label. Fill data/labels/gold_review_labels.csv and re-run."}

    # Proxy only: these labels come from the LLM, so this measures agreement with it, not real accuracy.
    pred, conf = predict(dev.text)
    report["proxy_llm_labelled_holdout"] = {
        "warning": "Agreement with LLM labels, not human-checked accuracy. Do not quote as M1 performance.",
        "m1": scores(dev.llm_label.tolist(), pred), "baseline_tfidf_svc": scores(dev.llm_label.tolist(), base.predict(dev.text)),
        "rule_extractor_coarse_agreement": round(float(np.mean([extract(t)["category"] == COARSE[l] for t, l in zip(dev.text, dev.llm_label)])), 4),
        "m1_coarse_agreement": round(float(np.mean([COARSE[p] == COARSE[l] for p, l in zip(pred, dev.llm_label)])), 4),
        "routing_share_to_llm": round(float((conf < THRESHOLD).mean()), 4),
    }
    test = banking("test")
    report["banking77_test_payment_labels"] = scores(test.y.tolist(), predict(test.text)[0])

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_DIR / "model.joblib")
    meta = {"name": "m1_intent", "version": datetime.now(timezone.utc).strftime("%Y%m%d%H%M"), "embedding_model": ai_config.EMBEDDING_MODEL, "classes": CLASSES,
            "coarse_map": COARSE, "confidence_threshold": THRESHOLD, "training_data_sha256": digest, "training_rows": len(train), "synthetic_rows": 0}
    (MODEL_DIR / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("human_checked_test", "proxy_llm_labelled_holdout")}, indent=1)[:1500])


if __name__ == "__main__":
    main()
