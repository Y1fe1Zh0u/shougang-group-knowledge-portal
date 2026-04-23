#!/usr/bin/env python3
from __future__ import annotations

import argparse
import http.server
import os
import posixpath
import socketserver
from pathlib import Path
from urllib.parse import unquote, urlparse


class SpaRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory: str, **kwargs):
        self._spa_directory = directory
        super().__init__(*args, directory=directory, **kwargs)

    def translate_path(self, path: str) -> str:
        path = urlparse(path).path
        path = posixpath.normpath(unquote(path))
        words = [word for word in path.split("/") if word]
        translated = self._spa_directory
        for word in words:
            _, word = os.path.splitdrive(word)
            _, word = os.path.split(word)
            if word in (os.curdir, os.pardir):
                continue
            translated = os.path.join(translated, word)
        return translated

    def do_GET(self) -> None:
        target = Path(self.translate_path(self.path))
        if target.is_dir():
            index_file = target / "index.html"
            if index_file.exists():
                self.path = f"{self.path.rstrip('/')}/index.html"
                return super().do_GET()
        if target.exists():
            return super().do_GET()

        self.path = "/index.html"
        return super().do_GET()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve a SPA directory with index.html fallback.")
    parser.add_argument("--port", type=int, default=3001)
    parser.add_argument("--dir", default="dist")
    args = parser.parse_args()

    handler = lambda *handler_args, **handler_kwargs: SpaRequestHandler(  # noqa: E731
        *handler_args,
        directory=args.dir,
        **handler_kwargs,
    )

    class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    with ThreadingServer(("0.0.0.0", args.port), handler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
