from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self._skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        text = " ".join(data.split())
        if len(text) >= 35:
            self.parts.append(text)


def fetch_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; EXELCatalogPreview/1.0)",
        },
    )
    with urlopen(request, timeout=20) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def extract_review_like_text(html: str, source_url: str) -> list[dict[str, str]]:
    parser = TextExtractor()
    parser.feed(html)

    keywords = re.compile(
        r"(excelente|recomiendo|resultado|piel|producto|textura|hidrat|serum|crema|limpieza|despacho|asesoria)",
        re.IGNORECASE,
    )

    seen: set[str] = set()
    reviews: list[dict[str, str]] = []

    for text in parser.parts:
        if not keywords.search(text):
            continue
        clean = text[:420]
        key = clean.lower()
        if key in seen:
            continue
        seen.add(key)
        reviews.append(
            {
                "text": clean,
                "author": "Por validar",
                "date": "Por validar",
                "source": "web",
                "source_url": source_url,
            }
        )
        if len(reviews) == 12:
            break

    return reviews


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrae textos tipo comentario desde una URL publica.")
    parser.add_argument("url", help="URL publica desde donde extraer comentarios o menciones.")
    parser.add_argument(
        "--out",
        default="data/social-proof.json",
        help="Archivo JSON de salida.",
    )
    args = parser.parse_args()

    html = fetch_html(args.url)
    reviews = extract_review_like_text(html, args.url)

    payload = {
        "status": "scraped_requires_review",
        "source_url": args.url,
        "required_fields": ["text", "author", "date", "source", "source_url"],
        "reviews": reviews,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"reviews={len(reviews)} out={out_path}")


if __name__ == "__main__":
    main()
