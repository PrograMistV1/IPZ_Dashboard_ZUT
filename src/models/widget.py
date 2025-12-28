from sqlalchemy import Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, validates, relationship
from datetime import datetime

from src.db import Base


class Widget(Base):
    __tablename__ = "widgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    dashboard_id: Mapped[int] = mapped_column(
        ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False
    )

    type: Mapped[str] = mapped_column(String(50), nullable=False)

    configuration: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    position: Mapped[int] = mapped_column(Integer, nullable=False)

    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    dashboard = relationship("Dashboard", backref="widgets")

    @validates("type")
    def validate_type(self, _, value):
        allowed = {"rates", "news", "history"}
        if value not in allowed:
            raise ValueError("Unsupported widget type")
        return value

    @validates("position")
    def validate_position(self, _, value):
        if value < 0:
            raise ValueError("Position must be >= 0")
        return value

    def __repr__(self):
        return (
            f"Widget(id={self.id}, type='{self.type}', "
            f"dashboard_id={self.dashboard_id})"
        )
