from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import requests
from datetime import date, timedelta

app = FastAPI()

CURRENCIES = ["USD", "EUR", "GBP", "CHF", "JPY"]

@app.get("/", response_class=HTMLResponse)
def get_currency_table():
    end_date = date.today()
    start_date = end_date - timedelta(days=14)

    html = """
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Kursy walut NBP</title>
        </head>
        <body>
            <h2>Kursy walut NBP – ostatnie 10 dni</h2>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>Data</th>
    """

    for curr in CURRENCIES:
        html += f"<th>{curr}</th>"
    html += "</tr>"
    rates_by_date = {}

    for code in CURRENCIES:
        url = f"https://api.nbp.pl/api/exchangerates/rates/A/{code}/{start_date}/{end_date}/?format=json"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            for r in data["rates"]:
                day = r["effectiveDate"]
                rate = r["mid"]
                if day not in rates_by_date:
                    rates_by_date[day] = {}
                rates_by_date[day][code] = rate

    for day in sorted(rates_by_date.keys(), reverse=True)[:10]:
        html += f"<tr><td>{day}</td>"
        for curr in CURRENCIES:
            value = rates_by_date[day].get(curr, "-")
            html += f"<td>{value}</td>"
        html += "</tr>"

    html += """
            </table>
        </body>
    </html>
    """

    return HTMLResponse(content=html)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
