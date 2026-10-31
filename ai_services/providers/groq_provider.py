"""Budgeted JSON LLM client over Groq's OpenAI-compatible API. Every failure returns None, never a guess."""

from __future__ import annotations

import hashlib
import json
import logging
import time

from ai_services.config import ai_config

log = logging.getLogger(__name__)
_cache: dict[str, dict] = {}
# Reasoning models spend tokens before answering, and a truncated reply fails JSON validation.
MIN_COMPLETION_TOKENS = 800


class LLMClient:
    def __init__(self):
        self.enabled = ai_config.LLM_PROVIDER.lower() == "groq" and bool(ai_config.GROQ_API_KEY) and bool(ai_config.GROQ_MODEL)
        self.failed = False
        self.tokens = 0
        self._client = None

    def _sdk(self):
        if self._client is None:
            from openai import OpenAI
            self._client = OpenAI(api_key=ai_config.GROQ_API_KEY, base_url=ai_config.LLM_BASE_URL,
                                  timeout=ai_config.LLM_TIMEOUT_SECONDS, max_retries=0)
        return self._client

    def json(self, system: str, user: str, max_tokens: int = 600) -> dict | None:
        if not self.enabled:
            return None
        key = hashlib.sha256(f"{ai_config.GROQ_MODEL}\n{system}\n{user}".encode()).hexdigest()
        if key in _cache:
            return _cache[key]
        for attempt in range(ai_config.LLM_MAX_RETRIES + 1):
            started = time.perf_counter()
            try:
                res = self._sdk().chat.completions.create(
                    model=ai_config.GROQ_MODEL, temperature=0, max_tokens=max(max_tokens, MIN_COMPLETION_TOKENS),
                    response_format={"type": "json_object"},
                    messages=[{"role": "system", "content": system}, {"role": "user", "content": user}])
                parsed = json.loads(res.choices[0].message.content)
                if not isinstance(parsed, dict):
                    raise ValueError("response is not an object")
                used = res.usage.total_tokens if res.usage else 0
                self.tokens += used
                log.info("llm ok tokens=%s latency_ms=%d", used, (time.perf_counter() - started) * 1000)
                _cache[key] = parsed
                return parsed
            except Exception as exc:
                log.warning("llm attempt %d failed: %s", attempt + 1, type(exc).__name__)
                status = getattr(exc, "status_code", None)
                if status and status < 500 and status != 429:
                    break  # a bad request fails the same way on every retry
                if attempt < ai_config.LLM_MAX_RETRIES:
                    time.sleep(2 ** attempt)
        self.failed = True
        return None
