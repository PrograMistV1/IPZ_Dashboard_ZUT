import requests
import datetime as dt
import hashlib

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError

from src.back.logger.logger import BackendLogger
from src.back.core.config import NEWSAPI_KEY, NEWS_CACHE_TTL_MINUTES

from src.models.news_article import NewsArticle

from fastapi import Depends
from sqlalchemy.orm import Session

from src.db import get_db

router = APIRouter(prefix="/api")
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
def get_news(req: NewsRequest, db: Session = Depends(get_db)):
    log.info("news_endpoint", f"Fetching news for category: {req.category}")
    now = dt.datetime.utcnow()
    ttl = dt.timedelta(minutes=int(NEWS_CACHE_TTL_MINUTES))

    latest_newsapi = (
        db.query(NewsArticle)
        .filter(
            NewsArticle.category == req.category,
            NewsArticle.source_api == "NewsAPI",
        )
        .order_by(NewsArticle.cached_at.desc())
        .first()
    )

    if latest_newsapi and (now - latest_newsapi.cached_at) < ttl:
        cached_articles = (
            db.query(NewsArticle)
            .filter(NewsArticle.category == req.category)
            .order_by(NewsArticle.published_at.desc())
            .all()
        )
        log.info("news_endpoint", "Returning cached news from database (fresh)")
        return {
            "source": "database",
            "category": req.category,
            "articles": [
                {
                    "title": a.title,
                    "description": None,
                    "source": a.source,
                    "published_at": a.published_at,
                    "url": a.url,
                }
                for a in cached_articles
            ],
        }

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
    try:
        db.query(NewsArticle).filter(
            NewsArticle.category == req.category,
            NewsArticle.source_api == "NewsAPI",
        ).delete(synchronize_session=False)
    except Exception:
        log.info("news_endpoint", "Failed to delete old NewsAPI articles before insert")

    rows_to_insert = []
    for a in articles:
        if not a.get("url"):
            continue

        published = None
        raw_published = a.get("publishedAt")
        if raw_published:
            try:
                rp = raw_published
                if rp.endswith("Z"):
                    rp = rp[:-1] + "+00:00"
                published = dt.datetime.fromisoformat(rp)
            except Exception:
                try:
                    published = dt.datetime.strptime(
                        raw_published[:19], "%Y-%m-%dT%H:%M:%S"
                    )
                except Exception:
                    published = dt.datetime.utcnow()

        raw_title = a.get("title") or a.get("description") or "Untitled"
        title_text = (raw_title or "").strip()
        if len(title_text) < 5:
            title_text = title_text + " "
            while len(title_text) < 5:
                title_text += "."

        try:
            url_hash = hashlib.sha256(a["url"].encode("utf-8")).hexdigest()
        except Exception:
            url_hash = None

        row = {
            "title": title_text,
            "url": a["url"],
            "url_hash": url_hash,
            "source": a.get("source", {}).get("name", "unknown"),
            "category": req.category,
            "published_at": published or dt.datetime.utcnow(),
            "cached_at": now,
            "source_api": "NewsAPI",
        }

        rows_to_insert.append(row)

    if rows_to_insert:
        try:
            from sqlalchemy import text

            sql = """
            INSERT INTO news_articles
              (title, url, url_hash, source, category, published_at, cached_at, source_api)
            VALUES
              (:title, :url, :url_hash, :source, :category, :published_at, :cached_at, :source_api)
            ON DUPLICATE KEY UPDATE
              cached_at = VALUES(cached_at),
              title = VALUES(title),
              published_at = VALUES(published_at)
            """

            for row in rows_to_insert:
                db.execute(text(sql), row)
            db.commit()
        except Exception as exc:
            db.rollback()
            log.error(
                "news_endpoint", f"DB commit failed after inserting articles: {exc}"
            )
            raise HTTPException(
                status_code=500, detail="Database error while saving news"
            ) from exc

    db.commit()

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
