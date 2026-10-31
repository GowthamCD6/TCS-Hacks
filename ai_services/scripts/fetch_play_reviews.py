"""Fetch real public Google Play reviews of Indian food-delivery apps into data/raw/play_reviews.csv.

Stores only review text, rating, date and app version. User names are never kept, and any email or
phone number inside the text is redacted.

Run from the repository root:  python -m ai_services.scripts.fetch_play_reviews
"""

from pathlib import Path

import pandas as pd
from google_play_scraper import Sort, reviews

from ai_services.analytics.extraction import redact

OUT = Path(__file__).resolve().parents[1] / "data" / "raw" / "play_reviews.csv"
APPS = {"swiggy": "in.swiggy.android", "zomato": "com.application.zomato"}
COUNT = 8000
LOW_STAR_COUNT = 4000


def main() -> None:
    rows = []
    for name, app_id in APPS.items():
        batches = [{"count": COUNT}] + [{"count": LOW_STAR_COUNT, "filter_score_with": s} for s in (1, 2)]
        for kwargs in batches:
            found, _ = reviews(app_id, lang="en", country="in", sort=Sort.NEWEST, **kwargs)
            for r in found:
                rows.append({"app": name, "text": redact(r["content"] or ""), "rating": r["score"], "date": r["at"].isoformat(), "app_version": r.get("reviewCreatedVersion")})
            print(name, kwargs, len(found))
    df = pd.DataFrame(rows).drop_duplicates(["app", "text", "date"])
    df = df[df.text.str.split().str.len() >= 4]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT, index=False)
    print("saved", len(df), "reviews", df.date.min(), "to", df.date.max())


if __name__ == "__main__":
    main()
