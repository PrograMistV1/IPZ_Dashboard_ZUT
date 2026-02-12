import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from src.back.logger.logger import BackendLogger
from src.back.routes.auth import router as auth_router
from src.back.routes.dashboard import router as dashboard_router
from src.back.routes.economy import router as economy_router
from src.back.routes.news import router as news_router
from src.back.routes.rates import router as rates_router
from src.back.routes.weather import router as weather_router
from src.back.routes.weather_read import router as weather_read_router
from src.db import init_db

log = BackendLogger()

log.info("main", "Starting backend and initializing logger")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(rates_router)
app.include_router(news_router)
app.include_router(economy_router)
app.include_router(weather_router)
app.include_router(weather_read_router)


static_dir = "src/front/build"
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
