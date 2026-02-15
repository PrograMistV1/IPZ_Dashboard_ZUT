from typing import LiteralString, cast

from email_validator import validate_email, EmailNotValidError
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy.orm import Session

from src.back.core.security import get_current_user
from src.db import get_db
from src.models.user import User

router = APIRouter(prefix="/users")


class CreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str
    isEnabled: bool = True

    @field_validator("username")
    @classmethod
    def username_validator(cls, v: str):
        if not v or not isinstance(v, str):
            raise PydanticCustomError("value_error", "Username must be provided.")
        v = v.strip()
        if len(v) < 3 or len(v) > 64:
            raise PydanticCustomError("value_error", "Username length must be 3-64.")

        import re

        if not re.fullmatch(r"[A-Za-z0-9_\-]+", v):
            raise PydanticCustomError("value_error", "Invalid username characters.")
        return v

    @field_validator("email")
    @classmethod
    def email_validator(cls, v):
        if not v:
            raise PydanticCustomError("value_error", "Email must be provided.")
        try:
            validate_email(v, check_deliverability=False)
        except EmailNotValidError as e:
            raise PydanticCustomError("value_error", cast(LiteralString, str(e)))
        return v

    @field_validator("password")
    @classmethod
    def password_validator(cls, v):
        if not v or not isinstance(v, str):
            raise PydanticCustomError("value_error", "Password must be provided.")
        if len(v) < 8:
            raise PydanticCustomError(
                "value_error", "Password must be at least 8 characters long."
            )
        return v

    @field_validator("role")
    @classmethod
    def role_validator(cls, v: str):
        if not v or not isinstance(v, str):
            raise PydanticCustomError("value_error", "Role must be provided.")
        if v not in ("ADMIN", "USER"):
            raise PydanticCustomError(
                "value_error", "Role must be either 'ADMIN' or 'USER'."
            )
        return v


@router.get("/")
def list_users(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    current = db.query(User).filter(User.id == user_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Current user not found")
    if current.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    users = db.query(User).all()

    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "isEnabled": bool(u.is_enabled),
        }
        for u in users
    ]


@router.post("/", status_code=201)
def create_user(
    req: CreateUserRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current = db.query(User).filter(User.id == user_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Current user not found")
    if current.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    existing = (
        db.query(User)
        .filter((User.username == req.username) | (User.email == req.email))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="User with given username or email already exists"
        )

    user = User(
        username=req.username,
        email=req.email,
        password=req.password,
        role=req.role,
        is_enabled=req.isEnabled,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "isEnabled": bool(user.is_enabled),
    }
