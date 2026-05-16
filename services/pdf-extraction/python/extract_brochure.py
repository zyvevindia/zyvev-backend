#!/usr/bin/env python3
"""
Governed brochure PDF extraction — deterministic text/table harvest.
Optional deps (install via requirements.txt inside this folder):

  pdfplumber, pymupdf (fitz)

No network access. No hallucination layer — emits raw snippets + heuristic table rows.
Human review required before merging into Tier-1.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path


def _pdfplumber_extract(path: Path) -> dict:
    try:
        import pdfplumber
    except ImportError:
        return {}

    rows = []
    pages_text = []
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            t = page.extract_text() or ""
            pages_text.append({"pageNum": i + 1, "text": t})
            tbls = page.extract_tables() or []
            for tbl in tbls:
                rows.append({"pageNum": i + 1, "cells": tbl})
    return {"engine": "pdfplumber", "pages": pages_text, "tables": rows}


def _pymupdf_extract(path: Path) -> dict:
    try:
        import fitz  # pymupdf
    except ImportError:
        return {}

    doc = fitz.open(path)
    pages_text = []
    for i in range(len(doc)):
        page = doc.load_page(i)
        pages_text.append({"pageNum": i + 1, "text": page.get_text() or ""})
    doc.close()
    return {"engine": "pymupdf", "pages": pages_text, "tables": []}


def run_auto(path: Path) -> tuple[dict, str]:
    plum = _pdfplumber_extract(path)
    if plum.get("tables") or plum.get("pages"):
        return plum, "TABLE_EXTRACTION" if plum.get("tables") else "TEXT_EXTRACTION"

    fz = _pymupdf_extract(path)
    if fz.get("pages"):
        return fz, "TEXT_EXTRACTION"

    return {}, "EXTRACTION_UNAVAILABLE"


def main() -> int:
    p = argparse.ArgumentParser(description="EVSavari brochure PDF extractor")
    p.add_argument("--input", required=True, help="Absolute path to brochure PDF")
    p.add_argument("--output", required=True, help="Output JSON path")
    p.add_argument("--source-id", required=True)
    p.add_argument("--variant-slug", required=True)
    p.add_argument(
        "--method",
        choices=["AUTO", "PDFPLUMBER", "PYMUPDF"],
        default="AUTO",
    )
    args = p.parse_args()
    inp = Path(args.input)
    outp = Path(args.output)

    if not inp.is_file():
        print(f"INPUT_NOT_FOUND: {inp}", file=sys.stderr)
        return 2

    if args.method == "PDFPLUMBER":
        data = _pdfplumber_extract(inp)
        extraction = data
        extraction_method = (
            "TABLE_EXTRACTION" if data.get("tables") else "TEXT_EXTRACTION"
        )
    elif args.method == "PYMUPDF":
        extraction = _pymupdf_extract(inp)
        extraction_method = "TEXT_EXTRACTION"
    else:
        extraction, extraction_method = run_auto(inp)

    if not extraction.get("pages") and not extraction.get("tables"):
        print(
            json.dumps({"error": "no_pdflib_installed_or_empty_pdf"}, indent=2)
        )
        print(
            "Install: pip install -r pdf-extraction/python/requirements.txt",
            file=sys.stderr,
        )
        return 3

    out = {
        "extractedAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "sourceId": args.source_id,
        "tier1VariantSlug": args.variant_slug,
        "confidenceLevel": "LOW",
        "extractionMethod": extraction_method,
        "artifactType": "BROCHURE_RAW",
        "_governance": {
            "reviewRequired": True,
            "doNotPublish": True,
            "camelotSuggested": False,
            "notes": (
                "Heuristic extraction — map tables to KNOWN_FLAT_MAP in Node "
                "normalization separately; omit unknown fields."
            ),
        },
        "payload": extraction,
    }

    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(json.dumps(out, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
