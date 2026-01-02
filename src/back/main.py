import os

import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from src.back.logger.logger import BackendLogger
from src.db import get_db, init_db
from src.models.currency_rate import CurrencyRate
from src.models.user import User
from src.models.dashboard import Dashboard
from src.models.widget import Widget

from src.models.login_history import LoginHistory
from src.models.audit_log import AuditLog
from fastapi import Request

from jose import jwt, JWTError
from datetime import datetime, timedelta, date
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
security = HTTPBearer()

log = BackendLogger()

log.info("main", "Starting backend and initializing logger")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_CURRENCIES = {"USD", "EUR", "GBP", "CHF", "JPY"}


class RateRequest(BaseModel):
    currency: str
    date_from: str
    date_to: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


def create_access_token(user_id: int):
    payload = {
        "user_id": user_id,
        "exp": datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Nieprawidłowa sesja")

        return user_id

    except JWTError:
        raise HTTPException(status_code=401, detail="Nieprawidłowa sesja")


def validate_dates(date_from: str, date_to: str) -> tuple[date, date]:
    try:
        start = datetime.strptime(date_from, "%Y-%m-%d").date()
        end = datetime.strptime(date_to, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format") from exc

    today = date.today()
    if start > today or end > today:
        raise HTTPException(status_code=400, detail="Dates cannot be in the future")

    if start > end:
        raise HTTPException(
            status_code=400, detail="Start date must be earlier than end date"
        )

    return start, end


def get_rates_from_db(db: Session, currency: str, start: date, end: date):
    return (
        db.query(CurrencyRate)
        .filter(
            CurrencyRate.currency == currency,
            CurrencyRate.date >= start,
            CurrencyRate.date <= end,
        )
        .all()
    )


def fetch_rates_from_nbp(currency: str, start: date, end: date):
    url = f"https://api.nbp.pl/api/exchangerates/rates/A/{currency}/{start}/{end}/?format=json"
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.Timeout as exc:
        raise HTTPException(
            status_code=504, detail="Timeout connecting to NBP API"
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise HTTPException(status_code=503, detail=f"NBP API error: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=500, detail="Invalid JSON from NBP API"
        ) from exc

    rates = data.get("rates", [])
    if not rates:
        raise HTTPException(status_code=404, detail="No data for this date range")

    return rates


def save_rates_to_db(db: Session, currency: str, rates: list[dict]):
    results = []
    try:
        for r in rates:
            rate_date = r["effectiveDate"]
            rate = r["mid"]

            existing = (
                db.query(CurrencyRate)
                .filter(
                    CurrencyRate.currency == currency, CurrencyRate.date == rate_date
                )
                .first()
            )

            if not existing:
                obj = CurrencyRate(
                    currency=currency, date=rate_date, source="NBP", rate=rate
                )
                db.add(obj)

            results.append({"date": rate_date, "rate": rate})

        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc

    return results


@app.post("/rates")
def get_rates(req: RateRequest, db: Session = Depends(get_db)):
    log.info("rates_endpoint", "Received request for rates")

    if req.currency not in VALID_CURRENCIES:
        log.debug("rates_endpoint", f"Invalid currency: {req.currency}")
        raise HTTPException(status_code=400, detail="Unsupported currency")

    start, end = validate_dates(req.date_from, req.date_to)
    log.debug("rates_endpoint", f"Validated dates: {start} - {end}")

    db_results = get_rates_from_db(db, req.currency, start, end)
    log.info("rates_endpoint", f"Fetched {len(db_results)} records from DB")

    if len(db_results) == (end - start).days + 1:
        return {
            "source": "database",
            "currency": req.currency,
            "rates": [{"date": r.date, "rate": r.rate} for r in db_results],
        }

    try:
        rates = fetch_rates_from_nbp(req.currency, start, end)
        final_results = save_rates_to_db(db, req.currency, rates)
        return {"source": "nbp_api", "currency": req.currency, "rates": final_results}
    except Exception as exc:
        log.error("rates_endpoint", f"Unexpected error: {exc}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc


@app.post("/auth/register")
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


@app.post("/auth/login")
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()

    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

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
    }


@app.post("/auth/logout")
def logout():
    return {"message": "Logged out"}


@app.get("/auth/login-history")
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


@app.get("/auth/me")
def get_my_account(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"login": user.username}


class WidgetCreateRequest(BaseModel):
    type: str
    configuration: dict | None = None
    position: int | None = None
    enabled: bool | None = True


def get_widgets_for_dashboard(db: Session, dashboard_id: int):
    return (
        db.query(Widget)
        .filter(Widget.dashboard_id == dashboard_id)
        .order_by(Widget.position)
        .all()
    )


def serialize_widgets(widgets: list[Widget]):
    return [
        {
            "id": w.id,
            "type": w.type,
            "configuration": w.configuration,
            "enabled": w.enabled,
            "position": w.position,
        }
        for w in widgets
    ]


@app.get("/api/dashboards")
def list_dashboards(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboards = db.query(Dashboard).filter(Dashboard.user_id == user_id).all()

    result = []
    for d in dashboards:
        widgets = get_widgets_for_dashboard(db, d.id)
        result.append(
            {
                "id": d.id,
                "name": d.name,
                "slotsCount": d.slots_count,
                "created_at": d.created_at.isoformat(),
                "updated_at": d.updated_at.isoformat(),
                "widgets": serialize_widgets(widgets),
            }
        )

    return result


@app.get("/api/dashboards/{dashboard_id}")
def get_dashboard(
    dashboard_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    widgets = get_widgets_for_dashboard(db, dashboard_id)

    return {
        "id": dashboard.id,
        "name": dashboard.name,
        "slotsCount": dashboard.slots_count,
        "created_at": dashboard.created_at.isoformat(),
        "updated_at": dashboard.updated_at.isoformat(),
        "widgets": serialize_widgets(widgets),
    }


class DashboardUpdateRequest(BaseModel):
    slotsCount: int | None = None


@app.patch("/api/dashboards/{dashboard_id}")
def update_dashboard(
    dashboard_id: int,
    req: DashboardUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()

    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if req.slotsCount is not None:
        dashboard.slots_count = req.slotsCount

    db.commit()
    db.refresh(dashboard)

    return {
        "id": dashboard.id,
        "slotsCount": dashboard.slots_count,
    }


@app.post("/api/dashboards/{dashboard_id}/widgets", status_code=201)
def create_widget(
    dashboard_id: int,
    req: WidgetCreateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    type_map = {
        "kursy": "rates",
        "rates": "rates",
        "currency": "rates",
        "news": "news",
        "historia": "history",
        "history": "history",
        "historia_operacji": "history",
        "historia-operacji": "history",
    }

    widget_type = type_map.get(req.type.lower()) if isinstance(req.type, str) else None

    if not widget_type:
        raise HTTPException(status_code=400, detail="Unsupported widget type")

    config = req.configuration or {}
    if not isinstance(config, dict):
        raise HTTPException(status_code=400, detail="Invalid configuration format")

    if widget_type == "rates":
        currency = config.get("currency")
        if currency and currency not in VALID_CURRENCIES:
            raise HTTPException(status_code=400, detail="Unsupported currency")

    if widget_type == "news":
        category = config.get("category")
        if not category:
            raise HTTPException(
                status_code=400, detail="'category' is required for news widget"
            )

    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if req.position is None:
        max_pos = (
            db.query(Widget.position)
            .filter(Widget.dashboard_id == dashboard_id)
            .order_by(Widget.position.desc())
            .limit(1)
            .first()
        )
        next_pos = (max_pos[0] + 1) if max_pos else 1
    else:
        if req.position < 0:
            raise HTTPException(status_code=400, detail="Position must be >= 0")
        next_pos = req.position

    enabled = bool(req.enabled) if req.enabled is not None else True

    # If client requested a specific position and that position is already occupied,
    # shift existing widgets at or after next_pos to the right to avoid collisions.
    if req.position is not None:
        occupied = (
            db.query(Widget)
            .filter(Widget.dashboard_id == dashboard_id, Widget.position == next_pos)
            .first()
        )
        if occupied:
            widgets_to_shift = (
                db.query(Widget)
                .filter(
                    Widget.dashboard_id == dashboard_id, Widget.position >= next_pos
                )
                .order_by(Widget.position.desc())
                .all()
            )
            for w in widgets_to_shift:
                w.position = w.position + 1
            db.commit()

    widget = Widget(
        dashboard_id=dashboard_id,
        type=widget_type,
        configuration=config,
        position=next_pos,
        enabled=enabled,
    )

    try:
        db.add(widget)
        db.commit()
        db.refresh(widget)

        audit = AuditLog(
            user_id=user_id,
            dashboard_id=dashboard_id,
            widget_id=widget.id,
            action="create",
        )
        db.add(audit)
        db.commit()

        log.info(
            "create_widget",
            f"User {user_id} created widget {widget.id} on dashboard {dashboard_id}",
        )

        return {
            "id": widget.id,
            "type": widget.type,
            "configuration": widget.configuration,
            "enabled": widget.enabled,
            "position": widget.position,
        }
    except Exception as exc:
        db.rollback()
        log.error("create_widget", f"Error creating widget: {exc}")
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc


@app.delete("/api/dashboards/{dashboard_id}/widgets/{widget_id}")
def delete_widget(
    dashboard_id: int,
    widget_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    widget = (
        db.query(Widget)
        .filter(Widget.id == widget_id, Widget.dashboard_id == dashboard_id)
        .first()
    )
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    # Delete widget and leave its slot empty. We do not shift other widgets —
    # this preserves empty slots so UI can show an empty slot after deletion.
    db.delete(widget)

    audit = AuditLog(
        user_id=user_id,
        dashboard_id=dashboard_id,
        widget_id=widget_id,
        action="delete",
    )
    db.add(audit)

    db.commit()

    return {"status": "ok"}


class WidgetUpdateRequest(BaseModel):
    configuration: dict | None = None


@app.patch("/api/widgets/{widget_id}")
def update_widget(
    widget_id: int,
    req: WidgetUpdateRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    widget = db.query(Widget).filter(Widget.id == widget_id).first()
    if not widget:
        raise HTTPException(404, "Widget not found")

    dashboard = db.query(Dashboard).filter(Dashboard.id == widget.dashboard_id).first()
    if not dashboard:
        raise HTTPException(404, "Dashboard not found")

    if dashboard.user_id != user_id:
        raise HTTPException(403, "Forbidden")

    if req.configuration is not None:
        widget.configuration = req.configuration

    db.commit()
    db.refresh(widget)

    return {
        "id": widget.id,
        "configuration": widget.configuration,
    }


if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
