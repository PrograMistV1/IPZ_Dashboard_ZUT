from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware

from src.models.base import Base
from src.models.database import engine
from src.models.database import SessionLocal
from src.models.kursy_model import Kursy

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
def get_rates(req: RateRequest):
    if req.currency not in VALID_CURRENCIES:
        raise HTTPException(status_code=400, detail="Nieobsługiwana waluta")

    try:
        start = datetime.strptime(req.date_from, "%Y-%m-%d").date()
        end = datetime.strptime(req.date_to, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Niepoprawny format daty")

    if start > end:
        raise HTTPException(
            status_code=400, detail="Data od musi być wcześniejsza niż data do"
        )

    db = SessionLocal()

    total_days = (end - start).days + 1

    try:
        db_results = (
            db.query(Kursy)
            .filter(
                Kursy.currency == req.currency, Kursy.date >= start, Kursy.date <= end
            )
            .all()
        )
    except Exception as e:
        db.close()
        raise HTTPException(status_code=500, detail=f"Błąd bazy danych: {e}")

    if len(db_results) == total_days:
        db.close()
        return {
            "source": "database",
            "currency": req.currency,
            "rates": [{"date": r.date, "rate": r.rate} for r in db_results],
        }

    url = f"https://api.nbp.pl/api/exchangerates/rates/A/{req.currency}/{start}/{end}/?format=json"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout połączenia z API NBP")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Błąd komunikacji z API NBP: {e}")

    try:
        data = response.json()
    except ValueError:
        raise HTTPException(status_code=500, detail="Niepoprawny JSON z API NBP")

    rates = data.get("rates", [])

    if not rates:
        raise HTTPException(status_code=404, detail="Brak danych dla tego zakresu dat")

    final_results = []

    try:
        for r in rates:
            date = r["effectiveDate"]
            rate = r["mid"]

            existing = (
                db.query(Kursy)
                .filter(Kursy.currency == req.currency, Kursy.date == date)
                .first()
            )

            if not existing:
                obj = Kursy(currency=req.currency, date=date, source="NBP", rate=rate)
                db.add(obj)

            final_results.append({"date": date, "rate": rate})

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Błąd zapisu do bazy: {e}")

    finally:
        db.close()

    return {"source": "nbp_api", "currency": req.currency, "rates": final_results}


if __name__ == "__main__":
    import uvicorn

    Base.metadata.create_all(bind=engine)
    uvicorn.run(app, host="127.0.0.1", port=8000)
