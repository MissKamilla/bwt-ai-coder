from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

STATIC_DIR = Path(__file__).parent / "static"


@app.get("/api/hello")
def api_hello() -> dict[str, str]:
    return {"message": "hello"}


if STATIC_DIR.is_dir():
    # Mount the entire static export directory. html=True makes StaticFiles
    # serve index.html for directory requests and fall back to 404.html for
    # missing paths, which is exactly what a NextJS static export expects.
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
