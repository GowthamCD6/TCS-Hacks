"""Download the embedding model once so the demo works offline.

Run from the repository root:  python -m ai_services.scripts.prefetch_models
"""

from sentence_transformers import SentenceTransformer

from ai_services.config import ai_config

if __name__ == "__main__":
    SentenceTransformer(ai_config.EMBEDDING_MODEL)
    print(f"Cached {ai_config.EMBEDDING_MODEL}")
