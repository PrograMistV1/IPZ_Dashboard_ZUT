from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.db import Base


class Config(Base):
    __tablename__ = "config"

    name: Mapped[str] = mapped_column(String(128), primary_key=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self):
        return f"Config(name={self.name}, value={self.value})"
