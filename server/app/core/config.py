from typing import List, Optional
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "RecoverIQ API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 5000

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "*",
    ]

    # Database Configuration (MySQL / TiDB)
    DB_HOST: str = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
    DB_PORT: int = 4000
    DB_USER: str = "2PGbBeQD3e1dkCr.root"
    DB_PASSWORD: str = "gDjDSPbXnP7ADcsh"
    DB_NAME: str = "tcsmainday"
    DB_SSL: bool = True
    DB_SSL_CA: str = "isrgrootx1.pem"

    # AI Service URL
    AI_SERVICE_URL: str = "http://localhost:8000"


settings = Settings()
