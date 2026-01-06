from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.back.logger.logger import BackendLogger
from src.back.routes.auth import router as auth_router
from src.back.routes.dashboard import router as dashboard_router
from src.back.routes.rates import router as rates_router
from src.db import init_db

load_dotenv()

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

if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
