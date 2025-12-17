import os

import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.back.logger.logger import BackendLogger
from src.db import get_db, init_db
from src.models.currency_rate import CurrencyRate
from src.models.user import User

from src.models.login_history import LoginHistory
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
    email: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


def create_access_token(user_id: int):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
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

    return {"message": "User registered successfully"}


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


if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
