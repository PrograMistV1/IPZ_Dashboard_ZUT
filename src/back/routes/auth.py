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
from src.models.weather_config import WeatherConfig
from src.models.economy_config import EconomyConfig
from src.models.config import Config
from datetime import datetime, timedelta

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

    try:
        weather_cfg = WeatherConfig(
            user_id=user.id, name="weather-dashboard", configuration={}
        )
        economy_cfg = EconomyConfig(
            user_id=user.id,
            name="economy-dashboard",
            configuration={"topSelected": ["USD", "EUR", "GBP", "CHF", "JPY", "UAH"]},
        )
        db.add(weather_cfg)
        db.add(economy_cfg)
        db.commit()
    except Exception:
        db.rollback()

    return {"message": "User registered successfully", "dashboard_id": dashboard.id}


@router.post("/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()

    try:
        cfg_max = db.query(Config).filter(Config.name == "login.max_fail").first()
        max_fail = int(cfg_max.value) if cfg_max and cfg_max.value is not None else 5
    except Exception:
        max_fail = 5

    try:
        cfg_ban = db.query(Config).filter(Config.name == "login.ban_minutes").first()
        ban_minutes = (
            int(cfg_ban.value) if cfg_ban and cfg_ban.value is not None else 30
        )
    except Exception:
        ban_minutes = 30

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not getattr(user, "is_enabled", True):
        try:
            db.add(
                LoginHistory(
                    user_id=user.id,
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent"),
                    success=False,
                )
            )
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(status_code=401, detail="Account disabled")

    if getattr(user, "locked_until", None) and user.locked_until > datetime.utcnow():
        try:
            db.add(
                LoginHistory(
                    user_id=user.id,
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent"),
                    success=False,
                )
            )
            db.commit()
        except Exception:
            db.rollback()

        locked_iso = user.locked_until.replace(microsecond=0).isoformat() + "Z"
        raise HTTPException(
            status_code=401,
            detail={
                "message": "Account locked until",
                "locked_until": locked_iso,
            },
        )

    if not user.check_password(req.password):
        try:
            try:
                cfg_window = (
                    db.query(Config)
                    .filter(Config.name == "login.fail_window_minutes")
                    .first()
                )
                window_minutes = (
                    int(cfg_window.value)
                    if cfg_window and cfg_window.value is not None
                    else 60
                )
            except Exception:
                window_minutes = 60

            window_start = datetime.utcnow() - timedelta(minutes=window_minutes)

            prev_fail_count = (
                db.query(LoginHistory)
                .filter(
                    LoginHistory.user_id == user.id,
                    LoginHistory.success.is_(False),
                    LoginHistory.login_time >= window_start,
                )
                .count()
            )

            attempts = prev_fail_count + 1

            db.add(
                LoginHistory(
                    user_id=user.id,
                    ip_address=request.client.host,
                    user_agent=request.headers.get("user-agent"),
                    success=False,
                )
            )

            if attempts >= max_fail:
                user.locked_until = datetime.utcnow() + timedelta(minutes=ban_minutes)
                db.add(user)
                db.commit()
                locked_iso = user.locked_until.replace(microsecond=0).isoformat() + "Z"
                raise HTTPException(
                    status_code=401,
                    detail={
                        "message": f"Too many failed attempts. Account locked for {ban_minutes} minutes",
                        "locked_until": locked_iso,
                    },
                )
            else:
                db.add(user)
                db.commit()
        except HTTPException:
            raise
        except Exception:
            db.rollback()
        raise HTTPException(status_code=401, detail="Invalid username or password")

    try:
        if getattr(user, "locked_until", None):
            user.locked_until = None
            db.add(user)
            db.commit()
    except Exception:
        db.rollback()

    token = create_access_token(user.id)

    try:
        db.add(
            LoginHistory(
                user_id=user.id,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
                success=True,
            )
        )
        db.commit()
    except Exception:
        db.rollback()

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
            "success": bool(getattr(h, "success", False)),
        }
        for h in history
    ]


@router.get("/login-history/all")
def get_all_login_history(
    dateFrom: str | None = None,
    dateTo: str | None = None,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current = db.query(User).filter(User.id == user_id).first()
    if not current:
        raise HTTPException(status_code=404, detail="Current user not found")
    if current.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    q = db.query(LoginHistory)

    def _parse_iso_opt(s: str | None):
        if not s:
            return None
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        from datetime import datetime

        return datetime.fromisoformat(s)

    if dateFrom:
        try:
            dt_from = _parse_iso_opt(dateFrom)
            q = q.filter(LoginHistory.login_time >= dt_from)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid dateFrom format")

    if dateTo:
        try:
            dt_to = _parse_iso_opt(dateTo)
            q = q.filter(LoginHistory.login_time <= dt_to)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid dateTo format")

    entries = q.order_by(LoginHistory.login_time.desc()).all()

    return [
        {
            "id": e.id,
            "user_id": e.user_id,
            "login_time": e.login_time.isoformat(),
            "ip_address": e.ip_address,
            "user_agent": e.user_agent,
            "success": bool(getattr(e, "success", False)),
        }
        for e in entries
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
