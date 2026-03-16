from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.db import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    dashboard_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=True
    )

    widget_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    action: Mapped[str] = mapped_column(String(50), nullable=False)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    def __repr__(self):
        return (
            f"AuditLog(id={self.id}, user_id={self.user_id}, dashboard_id={self.dashboard_id}, "
            f"widget_id={self.widget_id}, action='{self.action}', timestamp={self.timestamp})"
        )
