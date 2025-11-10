from fastapi import FastAPI
import requests

app = FastAPI()

API_KEY ="5bb8cd2506744ccfb290d7c47df6e235"

@app.get("/")
def get_sports_news():
    url = "https://newsapi.org/v2/top-headlines"
    params = {
        "country": "us",
        "category": "sports",
        "language": "en",
        "pageSize": 3,
        "apiKey": API_KEY
    }

    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        articles = data.get("articles", [])
        return [
            {
                "title": article["title"],
                "source": article["source"]["name"],
                "url": article["url"]
            }
            for article in articles
        ]
    else:
        return {"error": response.text}
