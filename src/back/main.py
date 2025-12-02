from datetime import datetime, date
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.models.CurrencyRate import CurrencyRate
from src.db import get_db, init_db

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


@app.post("/rates")
def get_rates(req: RateRequest, db: Session = Depends(get_db)):
    if req.currency not in VALID_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported currency")

    try:
        start = datetime.strptime(req.date_from, "%Y-%m-%d").date()
        end = datetime.strptime(req.date_to, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")

    today = date.today()
    if start > today or end > today:
        raise HTTPException(status_code=400, detail="Dates cannot be in the future")

    if start > end:
        raise HTTPException(
            status_code=400, detail="Start date must be earlier than end date"
        )

    total_days = (end - start).days + 1

    db_results = (
        db.query(CurrencyRate)
        .filter(
            CurrencyRate.currency == req.currency,
            CurrencyRate.date >= start,
            CurrencyRate.date <= end,
        )
        .all()
    )

    if len(db_results) == total_days:
        return {
            "source": "database",
            "currency": req.currency,
            "rates": [{"date": r.date, "rate": r.rate} for r in db_results],
        }

    url = f"https://api.nbp.pl/api/exchangerates/rates/A/{req.currency}/{start}/{end}/?format=json"
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

    final_results = []

    try:
        for r in rates:
            rate_date = r["effectiveDate"]
            rate = r["mid"]

            existing = (
                db.query(CurrencyRate)
                .filter(
                    CurrencyRate.currency == req.currency,
                    CurrencyRate.date == rate_date,
                )
                .first()
            )

            if not existing:
                obj = CurrencyRate(
                    currency=req.currency, date=rate_date, source="NBP", rate=rate
                )
                db.add(obj)

            final_results.append({"date": rate_date, "rate": rate})

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {"source": "nbp_api", "currency": req.currency, "rates": final_results}


if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
