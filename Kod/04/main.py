from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import requests
import os
from dotenv import load_dotenv

app = FastAPI()

load_dotenv()

API_KEY = os.getenv("NEWSAPI_KEY")

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

    data = response.json()
    articles = data.get("articles", [])

    html = """
    <html>
        <head>
            <meta charset="UTF-8">
            <title>Top Sports Headlines (USA)</title>
        </head>
        <body>
            <h2>Top 3 Sports Headlines (USA)</h2>
            <table border="1" cellpadding="8" cellspacing="0">
                <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Source</th>
                    <th>Link</th>
                </tr>
    """

    for i, a in enumerate(articles, 1):
        html += f"""
            <tr>
                <td>{i}</td>
                <td>{a['title']}</td>
                <td>{a['source']['name']}</td>
                <td><a href="{a['url']}" target="_blank">Read</a></td>
            </tr>
        """

    html += """
            </table>
        </body>
    </html>
    """

    return HTMLResponse(content=html)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
