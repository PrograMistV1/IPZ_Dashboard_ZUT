import datetime

import hashlib

from sqlalchemy import String, DateTime, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, validates

from src.db import Base


class NewsArticle(Base):
    __tablename__ = "news_articles"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    url_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    published_at: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    cached_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.datetime.utcnow
    )
    source_api: Mapped[str] = mapped_column(String(50), nullable=False)

    __table_args__ = (PrimaryKeyConstraint("url_hash", "source_api"),)

    @validates("url")
    def validate_url(self, _, value):
        if not value or not value.startswith("http"):
            raise ValueError("Invalid article URL.")
        try:
            self.url_hash = hashlib.sha256(value.encode("utf-8")).hexdigest()
        except Exception:
            self.url_hash = "".ljust(64, "0")
        return value

    @validates("title")
    def validate_title(self, _, value):
        if not value or len(value) < 5:
            raise ValueError("Title is too short.")
        return value

    def __repr__(self):
        return (
            f"NewsArticle("
            f"title='{self.title[:30]}...', "
            f"source='{self.source}', "
            f"category='{self.category}', "
            f"published_at={self.published_at}, "
            f"source_api='{self.source_api}'"
            f")"
        )
