import asyncio
import json
from http.cookies import SimpleCookie
from urllib.parse import urlencode

import httpx


class TestClient:
    __test__ = False

    def __init__(self, app) -> None:
        self.app = app
        self.cookies = httpx.Cookies()

    def get(self, url: str, **kwargs) -> httpx.Response:
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs) -> httpx.Response:
        return self.request("POST", url, **kwargs)

    def patch(self, url: str, **kwargs) -> httpx.Response:
        return self.request("PATCH", url, **kwargs)

    def request(self, method: str, url: str, **kwargs) -> httpx.Response:
        follow_redirects = kwargs.pop("follow_redirects", True)
        response = asyncio.run(self._request_once(method, url, kwargs))
        redirects = 0
        while (
            follow_redirects
            and response.status_code in {301, 302, 303, 307, 308}
            and "location" in response.headers
            and redirects < 10
        ):
            redirects += 1
            next_method = "GET" if response.status_code == 303 else method
            response = asyncio.run(self._request_once(next_method, response.headers["location"], {}))
        return response

    async def _request_once(self, method: str, url: str, kwargs: dict) -> httpx.Response:
        body = b""
        headers: list[tuple[bytes, bytes]] = []
        if "json" in kwargs:
            body = json.dumps(kwargs["json"]).encode("utf-8")
            headers.append((b"content-type", b"application/json"))
        elif "data" in kwargs:
            body = urlencode(kwargs["data"]).encode("utf-8")
            headers.append((b"content-type", b"application/x-www-form-urlencoded"))

        if body:
            headers.append((b"content-length", str(len(body)).encode("ascii")))
        cookie_header = self._cookie_header()
        if cookie_header:
            headers.append((b"cookie", cookie_header.encode("latin1")))

        path, _, query = url.partition("?")
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method.upper(),
            "scheme": "http",
            "path": path,
            "raw_path": path.encode("ascii"),
            "query_string": query.encode("ascii"),
            "headers": headers,
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
            "root_path": "",
        }

        sent_body = False
        status_code = 500
        response_headers: list[tuple[bytes, bytes]] = []
        chunks: list[bytes] = []

        async def receive() -> dict:
            nonlocal sent_body
            if not sent_body:
                sent_body = True
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.disconnect"}

        async def send(message: dict) -> None:
            nonlocal status_code, response_headers
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_headers = message.get("headers", [])
            elif message["type"] == "http.response.body":
                chunks.append(message.get("body", b""))

        await self.app(scope, receive, send)
        response = httpx.Response(
            status_code,
            headers=[(k.decode("latin1"), v.decode("latin1")) for k, v in response_headers],
            content=b"".join(chunks),
            request=httpx.Request(method, f"http://testserver{url}"),
        )
        self._store_response_cookies(response)
        return response

    def _cookie_header(self) -> str:
        return "; ".join(f"{name}={value}" for name, value in self.cookies.items())

    def _store_response_cookies(self, response: httpx.Response) -> None:
        for header in response.headers.get_list("set-cookie"):
            parsed = SimpleCookie()
            parsed.load(header)
            for name, morsel in parsed.items():
                if morsel["max-age"] == "0":
                    self.cookies.delete(name)
                else:
                    self.cookies.set(name, morsel.value)
