from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware

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
        raise HTTPException(status_code=400, detail="Data od musi być wcześniejsza niż data do")

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


    rates = [
        {"date": r["effectiveDate"], "rate": r["mid"]}
        for r in data.get("rates", [])
    ]

    if not rates:
        raise HTTPException(status_code=404, detail="Brak danych dla tego zakresu dat")

    return {
        "currency": req.currency,
        "rates": rates
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
