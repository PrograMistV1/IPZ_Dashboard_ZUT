from datetime import datetime, date, timedelta

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from pydantic_core import PydanticCustomError
from sqlalchemy.orm import Session

from src.back.logger.logger import BackendLogger
from src.db import get_db
from src.models.currency_rate import CurrencyRate

VALID_CURRENCIES = {
    "THB",
    "USD",
    "AUD",
    "HKD",
    "CAD",
    "NZD",
    "SGD",
    "EUR",
    "HUF",
    "CHF",
    "GBP",
    "UAH",
    "JPY",
    "CZK",
    "DKK",
    "ISK",
    "NOK",
    "SEK",
    "RON",
    "BGN",
    "TRY",
    "ILS",
    "CLP",
    "PHP",
    "MXN",
    "ZAR",
    "BRL",
    "MYR",
    "IDR",
    "INR",
    "KRW",
    "CNY",
    "XDR",
}
router = APIRouter()
log = BackendLogger()


class RateRequest(BaseModel):
    currency: str
    date_from: str
    date_to: str

    @field_validator("currency")
    @classmethod
    def currency_validator(cls, v: str):
        if not v or not isinstance(v, str):
            raise PydanticCustomError("value_error", "Currency must be provided.")
        v = v.upper().strip()
        if v not in VALID_CURRENCIES:
            raise PydanticCustomError("value_error", "Unsupported currency.")
        return v

    @field_validator("date_from", "date_to")
    @classmethod
    def date_format_validator(cls, v: str):
        if not v or not isinstance(v, str):
            raise PydanticCustomError("value_error", "Date must be provided.")
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise PydanticCustomError(
                "value_error", "Invalid date format, expected YYYY-MM-DD."
            )
        return v


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
        for rate_entry in rates:
            rate_date = datetime.strptime(
                rate_entry["effectiveDate"], "%Y-%m-%d"
            ).date()
            rate = rate_entry["mid"]

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


def backfill_missing_dates(db: Session, currency: str, start: date, end: date):
    # Ensure every calendar date in [start, end] has a CurrencyRate entry.
    # For missing dates, copy the most recent previous available rate.
    try:
        existing = (
            db.query(CurrencyRate)
            .filter(
                CurrencyRate.currency == currency,
                CurrencyRate.date >= start,
                CurrencyRate.date <= end,
            )
            .order_by(CurrencyRate.date)
            .all()
        )

        existing_map = {r.date: r for r in existing}

        # find last known rate before start
        prev_obj = (
            db.query(CurrencyRate)
            .filter(CurrencyRate.currency == currency, CurrencyRate.date < start)
            .order_by(CurrencyRate.date.desc())
            .first()
        )
        prev_rate = prev_obj.rate if prev_obj else None

        # find first known rate on or after start (used to fill earlier missing days)
        first_known_date = None
        first_known_rate = None
        for k in sorted(existing_map.keys()):
            if k >= start:
                first_known_date = k
                first_known_rate = existing_map[k].rate
                break

        to_insert = []
        d = start
        while d <= end:
            if d in existing_map:
                prev_rate = existing_map[d].rate
            else:
                if prev_rate is not None:
                    to_insert.append((d, prev_rate))
                else:
                    # no previous rate available; if we have a first known rate
                    # within the requested range, use it to fill earlier missing days
                    if first_known_date and d < first_known_date:
                        to_insert.append((d, first_known_rate))
            d = d + timedelta(days=1)

        for dt, rate in to_insert:
            obj = CurrencyRate(currency=currency, date=dt, source="NBP", rate=rate)
            db.add(obj)

        if to_insert:
            db.commit()

        return [
            {"date": r.date, "rate": r.rate}
            for r in (
                db.query(CurrencyRate)
                .filter(
                    CurrencyRate.currency == currency,
                    CurrencyRate.date >= start,
                    CurrencyRate.date <= end,
                )
                .order_by(CurrencyRate.date)
                .all()
            )
        ]
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Database error during backfill: {exc}"
        ) from exc


@router.post("/rates")
def get_rates(req: RateRequest, db: Session = Depends(get_db)):
    log.info("rates_endpoint", "Received request for rates")

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
        # save returned (working day) rates
        _ = save_rates_to_db(db, req.currency, rates)
        # backfill missing calendar days (weekends/holidays) using previous working day's values
        final_results = backfill_missing_dates(db, req.currency, start, end)
        return {"source": "nbp_api", "currency": req.currency, "rates": final_results}
    except Exception as exc:
        log.error("rates_endpoint", f"Unexpected error: {exc}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}") from exc
