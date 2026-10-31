"""Numeric grounding: every number and date in LLM output must exist in the input JSON."""

from __future__ import annotations

import json
import re
from datetime import date, datetime
from pathlib import Path

LOG = Path(__file__).resolve().parents[1] / "eval" / "llm_grounding_log.jsonl"
MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec"
MONTH_NUM = {m: i + 1 for i, m in enumerate(MONTHS.split("|"))}
ISO_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z?)?")
DMY_RE = re.compile(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+({MONTHS})[a-z]*\.?,?\s+(\d{{4}})\b", re.I)
MDY_RE = re.compile(rf"\b({MONTHS})[a-z]*\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(\d{{4}})\b", re.I)
NUM_RE = re.compile(r"(?<![\w.])\d+(?:\.\d+)?")
# Small words of structure, such as "5 tests" or "top 3", are not treated as facts about the incident.
TRIVIAL = {"0", "1"}


def _strings(value) -> list:
    if isinstance(value, dict):
        return [x for k, v in value.items() for x in _strings(k) + _strings(v)]
    if isinstance(value, (list, tuple)):
        return [x for v in value for x in _strings(v)]
    return [value]


def _dates(text: str) -> tuple[set, str]:
    found = set()

    def take(y, m, d):
        try:
            found.add(date(int(y), int(m), int(d)))
        except ValueError:
            pass
        return " "

    text = ISO_RE.sub(lambda g: take(g[1], g[2], g[3]), text)
    text = DMY_RE.sub(lambda g: take(g[3], MONTH_NUM[g[2].lower()[:3]], g[1]), text)
    text = MDY_RE.sub(lambda g: take(g[3], MONTH_NUM[g[1].lower()[:3]], g[2]), text)
    return found, text


def _inventory(payload) -> tuple[set, list]:
    dates, numbers = set(), []
    for item in _strings(payload):
        if isinstance(item, bool) or item is None:
            continue
        if isinstance(item, (int, float)):
            numbers.append(float(item))
        elif isinstance(item, (datetime, date)):
            dates.add(item.date() if isinstance(item, datetime) else item)
        else:
            found, rest = _dates(str(item))
            dates |= found
            numbers += [float(n) for n in NUM_RE.findall(rest.replace(",", ""))]
    return dates, numbers


def _backed(shown: str, numbers: list) -> bool:
    decimals = len(shown.split(".")[1]) if "." in shown else 0
    value = float(shown)
    tolerance = 0.5 * 10 ** -decimals + 1e-9
    # Rates may be shown as percentages, so 0.319 in the input backs 31.9 in the text.
    return any(abs(value - n) <= tolerance or abs(value - n * 100) <= tolerance for n in numbers)


def check(output, inputs) -> dict:
    """Returns passed plus each number or date that has no source in the inputs."""
    known_dates, known_numbers = _inventory(inputs)
    bad = []
    for item in _strings(output):
        if isinstance(item, bool) or item is None:
            continue
        found, rest = _dates(str(item))
        bad += [d.isoformat() for d in found - known_dates]
        for shown in NUM_RE.findall(re.sub(r"(?<=\d),(?=\d)", "", rest)):
            if shown not in TRIVIAL and not _backed(shown, known_numbers):
                bad.append(shown)
    return {"passed": not bad, "unbacked": sorted(set(bad))}


def log(job: str, model: str, passed: bool, attempt: int, unbacked: list) -> None:
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"at": datetime.now().isoformat(timespec="seconds"), "job": job, "model": model, "passed": passed, "attempt": attempt, "unbacked": unbacked}) + "\n")


def pass_rate(job: str | None = None) -> dict:
    if not LOG.exists():
        return {"attempts": 0, "pass_rate": None}
    rows = [json.loads(line) for line in LOG.read_text(encoding="utf-8").splitlines() if line.strip()]
    rows = [r for r in rows if job is None or r["job"] == job]
    return {"attempts": len(rows), "pass_rate": round(sum(r["passed"] for r in rows) / len(rows), 4) if rows else None}
