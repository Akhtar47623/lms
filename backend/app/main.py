from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.services.seed import seed_data


def create_app() -> FastAPI:
    app = FastAPI(title="LMS API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    upload_path = Path(settings.upload_dir)
    upload_path.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")

    @app.on_event("startup")
    def startup() -> None:
        Base.metadata.create_all(bind=engine)
        seed_data()

    app.include_router(api_router)
    return app


app = create_app()
