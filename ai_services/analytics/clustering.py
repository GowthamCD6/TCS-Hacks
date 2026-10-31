"""Group complaints semantically. Membership and counts come from code; labels may come from an LLM."""

from __future__ import annotations

import logging
from collections import Counter

import numpy as np
from sklearn.cluster import HDBSCAN, AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer

from ai_services.analytics.extraction import redact
from ai_services.config import ai_config

log = logging.getLogger(__name__)
_model = None
_model_failed = False


def embed(texts: list[str]) -> tuple[np.ndarray, str]:
    global _model, _model_failed
    if not _model_failed:
        try:
            if _model is None:
                from sentence_transformers import SentenceTransformer
                _model = SentenceTransformer(ai_config.EMBEDDING_MODEL)
            return np.asarray(_model.encode(texts, normalize_embeddings=True, show_progress_bar=False)), "sentence-transformers"
        except Exception as exc:  # model missing offline: fall back rather than fail the investigation
            log.warning("embedding model unavailable, using TF-IDF: %s", type(exc).__name__)
            _model_failed = True
    return TfidfVectorizer(ngram_range=(1, 2), min_df=1).fit_transform(texts).toarray(), "tfidf"


def _labels(vectors: np.ndarray) -> tuple[np.ndarray, str]:
    n = len(vectors)
    if n >= 10:
        labels = HDBSCAN(min_cluster_size=max(4, n // 25), metric="cosine", copy=True).fit_predict(vectors)
        if len(set(labels) - {-1}) >= 1 and (labels == -1).mean() < 0.6:
            return labels, "hdbscan"
    if n < 2:
        return np.zeros(n, dtype=int), "single"
    labels = AgglomerativeClustering(n_clusters=None, metric="cosine", linkage="average",
                                     distance_threshold=0.6).fit_predict(vectors)
    return labels, "agglomerative"


def _template_label(texts: list[str]) -> str:
    stop = set("the a an and but my i is was to of in for on no not it this that me app order after by at".split())
    words = Counter(w for t in texts for w in redact(t).lower().split() if w.isalpha() and w not in stop)
    top = [w for w, _ in words.most_common(4)]
    return "Complaints about " + ", ".join(top) if top else "Mixed complaints"


def cluster(rows: list[dict]) -> dict:
    """rows: dicts with id, text, event_timestamp (optional customer_id, category)."""
    if not rows:
        return {"method": "none", "embedding": "none", "clusters": [], "noise_count": 0}
    vectors, backend = embed([redact(r["text"]) for r in rows])
    labels, method = _labels(vectors)
    clusters = []
    for lab in sorted(set(labels) - {-1}):
        idx = np.where(labels == lab)[0]
        members = [rows[i] for i in idx]
        centroid = vectors[idx].mean(axis=0)
        sims = vectors[idx] @ centroid / (np.linalg.norm(vectors[idx], axis=1) * np.linalg.norm(centroid) + 1e-9)
        rep = members[int(np.argmax(sims))]
        times = sorted(str(m["event_timestamp"]) for m in members)
        loss = sum(1 for m in members if m.get("financial_loss"))
        clusters.append({
            "cluster_id": f"c{int(lab)}", "label": _template_label([m["text"] for m in members]),
            "representative_issue": redact(rep["text"]), "representative_feedback_id": int(rep["id"]),
            "feedback_ids": [int(m["id"]) for m in members], "size": len(members),
            "time_window": {"first_seen": times[0], "last_seen": times[-1]},
            "severity_indicators": {"share_of_complaints": round(len(members) / len(rows), 3), "financial_loss_mentions": loss},
            "confidence": round(float(np.mean(sims)), 3),
        })
    clusters.sort(key=lambda c: -c["size"])
    return {"method": method, "embedding": backend, "clusters": clusters, "noise_count": int((labels == -1).sum())}
