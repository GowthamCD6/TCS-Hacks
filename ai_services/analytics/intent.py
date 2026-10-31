"""M1 hybrid routing: the trained classifier handles confident text, and the rest falls back."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import joblib

MODEL_DIR = Path(__file__).resolve().parents[1] / "models" / "m1_intent"


@lru_cache(maxsize=1)
def load() -> dict | None:
    if not (MODEL_DIR / "model.joblib").exists():
        return None
    meta = json.loads((MODEL_DIR / "meta.json").read_text(encoding="utf-8"))
    from sentence_transformers import SentenceTransformer

    return {"clf": joblib.load(MODEL_DIR / "model.joblib"), "encoder": SentenceTransformer(meta["embedding_model"]), "meta": meta}


def classify(texts: list[str]) -> list[dict] | None:
    """Returns intent, coarse category and confidence per text, or None when no model is trained."""
    m = load()
    if m is None or not texts:
        return None
    prob = m["clf"].predict_proba(m["encoder"].encode(texts, normalize_embeddings=True, show_progress_bar=False, batch_size=128))
    meta = m["meta"]
    out = []
    for row in prob:
        label = str(m["clf"].classes_[row.argmax()])
        confidence = float(row.max())
        out.append({"intent": label, "category": meta["coarse_map"][label], "intent_confidence": round(confidence, 4), "confident": confidence >= meta["confidence_threshold"]})
    return out


def model_info() -> dict | None:
    return load()["meta"] if load() else None
