from sqlalchemy import String, Integer
from sqlalchemy.orm import validates, Mapped, mapped_column

from src.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(50), nullable=True)
    last_name: Mapped[str] = mapped_column(String(50), nullable=True)

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
        return value

    @validates("email")
    def validate_email(self, _, value):
        if not value or not isinstance(value, str):
            raise ValueError("Email must be a non-empty string.")
        if "@" not in value:
            raise ValueError("Invalid email format.")
        return value

    def __repr__(self):
        return (
            f"User("
            f"id={self.id}, "
            f"username='{self.username}', "
            f"email='{self.email}', "
            f"first_name='{self.first_name}', "
            f"last_name='{self.last_name}'"
            f")"
        )
