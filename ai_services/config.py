from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent


class AIConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Model Defaults
    DEFAULT_MODEL_PROVIDER: str = "gemini"
    DEFAULT_MODEL_NAME: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma"

    # RecoverIQ service
    AI_SERVICE_TOKEN: str = ""
    AI_DB_URL: str = ""  # read-only user, e.g. mysql://user:pass@host:port/db
    AI_DB_SSL_CA: str = ""
    # none | groq. "none" runs the whole golden path with rules and templates.
    LLM_PROVIDER: str = "none"
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = ""  # check against the current Groq model catalogue
    LLM_TIMEOUT_SECONDS: float = 20
    LLM_MAX_RETRIES: int = 2
    AGENT_MAX_STEPS: int = 12
    AGENT_MAX_SECONDS: float = 90
    # Gateways can auto-reverse for up to a day, so refunding sooner risks paying twice.
    REFUND_GRACE_MINUTES: int = 1440
    UPI_REVERSAL_TAT_DAYS: int = 5  # RBI TAT circular, 20 Sep 2019


ai_config = AIConfig()
