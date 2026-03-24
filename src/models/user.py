from sqlalchemy import String, Integer, Boolean, DateTime
from datetime import datetime
from sqlalchemy.orm import validates, Mapped, mapped_column

from src.back.core.password import hash_password, verify_password
from src.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="USER")
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    failed_logins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @validates("username")
    def validate_username(self, _, value):
        if not value or not isinstance(value, str):
            raise ValueError("Username must be a non-empty string.")
        return value

    @validates("password")
    def validate_password(self, _, value):
        if not value or not isinstance(value, str):
            raise ValueError("Password must be a non-empty string.")
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return hash_password(value)

    @validates("email")
    def validate_email(self, _, value):
        if not value or not isinstance(value, str):
            raise ValueError("Email must be a non-empty string.")
        if "@" not in value or "." not in value:
            raise ValueError("Invalid email format")
        return value

    @validates("role")
    def validate_role(self, _, value):
        if not value or not isinstance(value, str):
            raise ValueError("Role must be a non-empty string.")
        if value not in ("ADMIN", "USER"):
            raise ValueError("Role must be either 'ADMIN' or 'USER'.")
        return value

    def check_password(self, plain_password: str) -> bool:
        return verify_password(plain_password, self.password)

    def __repr__(self):
        return (
            f"User(id={self.id}, username='{self.username}', email='{self.email}', "
            f"role='{self.role}', is_enabled={self.is_enabled})"
        )
