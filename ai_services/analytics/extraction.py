"""Deterministic feedback extraction used for seeds, bulk imports and as the LLM fallback."""

from __future__ import annotations

import re

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(?<!\d)(?:\+?\d[\s-]?){10,13}(?!\d)")
ORDER_RE = re.compile(r"\b(?:SYN-O\d+|ORD[-_ ]?\d+)\b", re.I)

CATEGORY_RULES: list[tuple[str, re.Pattern]] = [
    ("payment", re.compile(r"deduct|debit|upi|payment|paid|charged|refund|kat gaya|wallet|\bcard\b", re.I)),
    ("delivery", re.compile(r"\blate\b|delay|rider|tracking|deliver(y|ed) (was|took)", re.I)),
    ("pricing", re.compile(r"price|expensive|\bfee\b|costly|hike", re.I)),
    ("food_quality", re.compile(r"\bcold\b|wrong item|missing|quality|leak|stale", re.I)),
    ("app_ux", re.compile(r"\bapp\b|search|logged me out|crash|slow to", re.I)),
]
PRAISE_RE = re.compile(r"great|loved|happy|smooth|thank|excellent", re.I)
LOSS_RE = re.compile(r"deduct|debit|charged|kat gaya|money gone|amount was", re.I)
NEGATED_LOSS_RE = re.compile(r"declined|failed", re.I)
URGENT_RE = re.compile(r"refund|deduct|debit|fraud|immediately|urgent", re.I)


def redact(text: str) -> str:
    """Remove direct identifiers before text can reach an external model."""
    return PHONE_RE.sub("[phone]", EMAIL_RE.sub("[email]", text or ""))


def extract(text: str, rating: int | None = None) -> dict:
    category = "other"
    for name, pattern in CATEGORY_RULES:
        if pattern.search(text):
            category = name
            break
    praise = bool(PRAISE_RE.search(text)) and (rating is None or rating >= 4)
    if praise:
        category = "praise"
    loss = bool(LOSS_RE.search(text)) and not NEGATED_LOSS_RE.search(text) and category == "payment"
    sentiment = "positive" if praise else "negative" if (rating is not None and rating <= 3) or loss else "neutral"
    order = ORDER_RE.search(text)
    return {
        "category": category,
        "sentiment": sentiment,
        "urgency": "high" if loss or URGENT_RE.search(text) and sentiment == "negative" else
                   "medium" if sentiment == "negative" else "low",
        "pain_point": redact(text)[:120],
        "component": {"payment": "payments", "delivery": "logistics", "pricing": "catalogue",
                      "food_quality": "restaurant", "app_ux": "mobile_app"}.get(category, "general"),
        "reference": order.group(0) if order else None,
        "financial_loss": loss,
        "actionable": sentiment == "negative",
        "language": "hi-en" if re.search(r"\b(nahi|bahut|gaya)\b", text, re.I) else "en",
        "summary": redact(text)[:160],
        "extractor": "rules",
    }
