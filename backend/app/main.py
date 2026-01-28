from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.routers import auth, cars, households, renewals, settings

load_dotenv()
settings_obj = Settings.from_env()

app = FastAPI(title="CAR TRACK API", version="1.2-phase2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_obj.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(households.router)
app.include_router(cars.router)
app.include_router(renewals.router)
app.include_router(settings.router)
