import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class AIConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Model Defaults
    DEFAULT_MODEL_PROVIDER: str = "gemini"
    DEFAULT_MODEL_NAME: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "text-embedding-004"

    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma"


ai_config = AIConfig()

