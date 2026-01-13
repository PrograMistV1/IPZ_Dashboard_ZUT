import requests

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError

from src.back.logger.logger import BackendLogger
from src.back.core.config import NEWSAPI_KEY

router = APIRouter()
log = BackendLogger()

VALID_CATEGORIES = {
    "general",
    "business",
    "technology",
    "sports",
    "health",
    "science",
    "entertainment",
}


class NewsRequest(BaseModel):
    category: str

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str):
        if not v or not isinstance(v, str):
            raise PydanticCustomError("value_error", "Category must be provided")

        v = v.lower().strip()

        if v not in VALID_CATEGORIES:
            raise PydanticCustomError("value_error", "Unsupported news category")

        return v


@router.post("/news")
def get_news(req: NewsRequest):
    log.info("news_endpoint", f"Fetching news for category: {req.category}")

    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "apiKey": NEWSAPI_KEY,
        "category": req.category,
        "country": "us",
        "pageSize": 10,
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504,
            detail="Timeout connecting to NewsAPI",
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise HTTPException(
            status_code=503,
            detail=f"NewsAPI error: {exc}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail="Invalid JSON from NewsAPI",
        ) from exc

    articles = data.get("articles", [])

    return {
        "category": req.category,
        "articles": [
            {
                "title": a.get("title"),
                "description": a.get("description"),
                "source": a.get("source", {}).get("name"),
                "published_at": a.get("publishedAt"),
                "url": a.get("url"),
            }
            for a in articles
        ],
    }
