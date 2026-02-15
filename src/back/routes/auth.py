from typing import LiteralString, cast

from email_validator import validate_email, EmailNotValidError
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy.orm import Session

from src.back.core.security import create_access_token, get_current_user
from src.db import get_db
from src.models.dashboard import Dashboard
from src.models.login_history import LoginHistory
from src.models.user import User

router = APIRouter(prefix="/auth")


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

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


class LoginRequest(BaseModel):
    username: str
    password: str

    @field_validator("username", "password")
    @classmethod
    def not_empty(cls, v: str):
        if not v or not isinstance(v, str) or not v.strip():
            raise PydanticCustomError(
                "value_error", "Field must be a non-empty string."
            )
        return v


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = (
        db.query(User)
        .filter((User.username == req.username) | (User.email == req.email))
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        username=req.username,
        email=req.email,
        password=req.password,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    dashboard = Dashboard(user_id=user.id, name="My dashboard")
    db.add(dashboard)
    db.commit()

    return {"message": "User registered successfully", "dashboard_id": dashboard.id}


# noinspection PyTypeChecker
@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()

    if not user or not user.check_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Block login if account is disabled
    if not getattr(user, "is_enabled", True):
        raise HTTPException(status_code=401, detail="Account disabled")

    token = create_access_token(user.id)

    db.add(
        LoginHistory(
            user_id=user.id,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent"),
        )
    )
    db.commit()

    return {
        "access_token": token,
        "user_id": user.id,
        "username": user.username,
        "role": getattr(user, "role", "USER"),
        "isEnabled": bool(getattr(user, "is_enabled", True)),
    }


@router.post("/logout")
def logout():
    return {"message": "Logged out"}


@router.get("/login-history")
def get_login_history(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history = (
        db.query(LoginHistory)
        .filter(LoginHistory.user_id == user_id)
        .order_by(LoginHistory.login_time.desc())
        .all()
    )

    return [
        {
            "login_time": h.login_time.isoformat(),
            "ip_address": h.ip_address,
            "user_agent": h.user_agent,
        }
        for h in history
    ]


@router.get("/me")
def get_my_account(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": user_id,
        "username": user.username,
        "role": getattr(user, "role", "USER"),
        "isEnabled": bool(getattr(user, "is_enabled", True)),
    }
