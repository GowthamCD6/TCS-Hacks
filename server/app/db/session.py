import os
import pymysql
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger("recoveriq.db")

def get_ssl_config() -> Optional[Dict[str, Any]]:
    if not settings.DB_SSL:
        return None
    ca_filename = settings.DB_SSL_CA or "isrgrootx1.pem"
    # Resolve SSL CA file path
    possible_paths = [
        os.path.abspath(ca_filename),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ca_filename)),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ca_filename)),
    ]
    ca_path = None
    for p in possible_paths:
        if os.path.exists(p):
            ca_path = p
            break

    if ca_path:
        logger.info(f"Using SSL CA cert: {ca_path}")
        return {"ca": ca_path}
    logger.warning("SSL CA cert not found in expected paths, using default ssl")
    return {}


def get_db_connection():
    ssl_opts = get_ssl_config()
    conn = pymysql.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME,
        ssl=ssl_opts,
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
    )
    return conn


def fetch_all(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()


def fetch_one(sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()
    finally:
        conn.close()
