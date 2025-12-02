from fastapi import FastAPI, HTTPException
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
        "apiKey": API_KEY,
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="NewsAPI timeout")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Connection error to NewsAPI")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=response.status_code, detail=f"HTTP error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

    try:
        data = response.json()
    except ValueError:
        raise HTTPException(status_code=500, detail="Invalid JSON from NewsAPI")

    articles = data.get("articles", [])

    html_parts = [
        """
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
    ]

    for i, a in enumerate(articles, 1):
        html_parts.append(f"""
            <tr>
                <td>{i}</td>
                <td>{a.get("title", "-")}</td>
                <td>{a.get("source", {}).get("name", "-")}</td>
                <td><a href="{a.get("url", "#")}" target="_blank">Read</a></td>
            </tr>
        """)

    html_parts.append("""
                </table>
            </body>
        </html>
    """)

    final_html = "".join(html_parts)

    return HTMLResponse(content=final_html)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
