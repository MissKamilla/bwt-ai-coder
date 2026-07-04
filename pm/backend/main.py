from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

INDEX_HTML = """<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>PM App</title></head>
  <body><h1>hello world</h1><p>Backend running. See <code>/api/hello</code>.</p></body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return INDEX_HTML


@app.get("/api/hello")
def api_hello() -> dict[str, str]:
    return {"message": "hello"}
