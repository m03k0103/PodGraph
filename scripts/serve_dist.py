#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PodGraph ハードニング済み静的ファイル配信サーバー。
scripts/security-headers.json のセキュリティヘッダーを全レスポンスへ付与し、
Server ヘッダーのバージョン露出およびディレクトリ一覧表示を抑止する。
"""

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path

HEADERS_FILE = Path(__file__).resolve().parent / "security-headers.json"


def load_security_headers() -> dict[str, str]:
    """security-headers.json からレスポンスヘッダー辞書を読み込む。"""
    data = json.loads(HEADERS_FILE.read_text(encoding="utf-8"))
    return dict(data.get("headers", {}))


SECURITY_HEADERS = load_security_headers()


class HardenedStaticHandler(SimpleHTTPRequestHandler):
    """セキュリティヘッダー付与・Server隠蔽・ディレクトリ一覧抑止を備えた静的配信ハンドラ。"""

    error_message_format = (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        "<title>%(code)d %(message)s</title></head>"
        "<body><h1>%(code)d %(message)s</h1></body></html>\n"
    )

    def send_header(self, keyword: str, value: str) -> None:
        if keyword.lower() == "server":
            return
        super().send_header(keyword, value)

    def end_headers(self) -> None:
        for name, value in SECURITY_HEADERS.items():
            super().send_header(name, value)
        super().end_headers()

    def list_directory(self, path):  # type: ignore[override]
        self.send_error(404, "Not Found")
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description="Hardened static server for PodGraph dist/")
    parser.add_argument("--port", type=int, default=8010)
    parser.add_argument("--directory", default="dist")
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()

    directory = Path(args.directory).resolve()
    handler = partial(HardenedStaticHandler, directory=str(directory))
    server = ThreadingHTTPServer((args.bind, args.port), handler)
    print(f"Serving {directory} on http://{args.bind}:{args.port} with security headers")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
