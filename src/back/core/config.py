import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

DATABASE_USER = os.getenv("DATABASE_USER")
if not DATABASE_USER:
    raise RuntimeError("DATABASE_USER is not set")

DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD")

DATABASE_HOST = os.getenv("DATABASE_HOST")
if not DATABASE_HOST:
    raise RuntimeError("DATABASE_HOST is not set")

DATABASE_PORT = int(os.getenv("DATABASE_PORT", 3306))

DATABASE_NAME = os.getenv("DATABASE_NAME")
if not DATABASE_NAME:
    raise RuntimeError("DATABASE_NAME is not set")

DATABASE_URL = f"mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
if not NEWSAPI_KEY:
    raise RuntimeError("NEWSAPI_KEY is not set")

# TTL (minutes) for news cache. When cached articles are older than this,
# the service will re-fetch from the upstream NewsAPI.
NEWS_CACHE_TTL_MINUTES = int(os.getenv("NEWS_CACHE_TTL_MINUTES", 10))
