from datetime import datetime, date
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.models.CurrencyRate import CurrencyRate
from src.db import get_db, init_db

from src.back.logger.logger import BackendLogger

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


def validate_dates(date_from: str, date_to: str) -> tuple[date, date]:
    try:
        start = datetime.strptime(date_from, "%Y-%m-%d").date()
        end = datetime.strptime(date_to, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

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
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout connecting to NBP API")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"NBP API error: {e}")
    except ValueError:
        raise HTTPException(status_code=500, detail="Invalid JSON from NBP API")

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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

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

    except Exception as e:
        log.error("rates_endpoint", f"Unexpected error: {e}")
        raise


if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
