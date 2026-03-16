from datetime import datetime

from sqlalchemy import Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from src.db import Base


class LoginHistory(Base):
    __tablename__ = "login_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    login_time: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return (
            f"LoginHistory(id={self.id}, user_id={self.user_id}, "
            f"login_time={self.login_time}, ip_address={self.ip_address})"
        )
