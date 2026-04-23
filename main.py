from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api import user
from app.db.database import engine, Base
from app.models.user import User  # noqa: F401 — ensures table is registered
import os

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UserHub API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")


@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(frontend_dir, "index.html"))