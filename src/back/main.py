import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from src.back.logger.logger import BackendLogger
from src.back.routes.auth import router as auth_router
from src.back.routes.dashboard import router as dashboard_router
from src.back.routes.economy import router as economy_router
from src.back.routes.logs import router as logs_router
from src.back.routes.news import router as news_router
from src.back.routes.rates import router as rates_router
from src.back.routes.users import router as users_router
from src.back.routes.weather import router as weather_router
from src.back.routes.weather_config import router as weather_config_router
from src.back.routes.weather_read import router as weather_read_router
from src.db import init_db

log = BackendLogger()

log.info("main", "Starting backend and initializing logger")

# FastAPI automatically generates an OpenAPI schema and serves Swagger UI
# under /docs and ReDoc under /redoc.  We customise the metadata here so that
# developers hitting the backend directly know how to interact with it.
app = FastAPI(
    title="IPZ Dashboard Backend API",
    version="1.0.0",
    description=(
        "Backend services for the IPZ Dashboard project. "
        "Use the Swagger UI at /docs to authenticate and call HTTP methods "
        "without any frontend."
    ),
    # you can customise the docs path if desired, e.g. docs_url="/swagger"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# routers are grouped by functional area so that the Swagger UI presents
# them in logical sections.
app.include_router(auth_router, tags=["Authentication"])
app.include_router(dashboard_router, tags=["Dashboard"])
app.include_router(rates_router, tags=["Rates"])
app.include_router(news_router, tags=["News"])
app.include_router(economy_router, tags=["Economy"])
app.include_router(weather_router, tags=["Weather"])
app.include_router(weather_read_router, tags=["Weather"])
app.include_router(weather_config_router, tags=["Weather"])
app.include_router(users_router, tags=["Users"])
app.include_router(logs_router, tags=["Logs"])


static_dir = "src/front/build"
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn

    init_db()
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
