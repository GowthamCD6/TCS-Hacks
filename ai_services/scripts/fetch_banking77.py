"""Download BANKING77 (CC BY 4.0) into data/raw/banking77/. Skips cleanly if train.csv and test.csv already exist.

Run from the repository root:  python -m ai_services.scripts.fetch_banking77
"""

from pathlib import Path

import pandas as pd

OUT = Path(__file__).resolve().parents[1] / "data" / "raw" / "banking77"
BASE = "https://huggingface.co/datasets/PolyAI/banking77/resolve/refs%2Fconvert%2Fparquet/default"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if (OUT / "train.csv").exists() and (OUT / "test.csv").exists():
        print("already present")
        return
    from datasets import load_dataset

    data = load_dataset("parquet", data_files={"train": f"{BASE}/train/0000.parquet", "test": f"{BASE}/test/0000.parquet"})
    for split in ("train", "test"):
        df = pd.DataFrame(data[split])
        df.to_csv(OUT / f"{split}.csv", index=False)
        print(split, len(df), list(df.columns))


if __name__ == "__main__":
    main()
