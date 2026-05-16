# PDF extraction (Tier-1 brochures)

## Layout

- `index.js` — Node bridge (`spawnSync`) into Python
- `python/extract_brochure.py` — deterministic harvest (text + simple tables)
- `python/requirements.txt` — pdfplumber + pymupdf

## Install

```bash
cd zyvev-backend
# If you see SSL verify errors behind a corporate proxy, use trusted hosts (does not disable TLS globally):
py -3 -m pip install --upgrade pip setuptools wheel --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.io
py -3 -m pip install -r services/pdf-extraction/python/requirements.txt --trusted-host pypi.org --trusted-host files.pythonhosted.org --trusted-host pypi.io
```

**Windows:** the Node bridge defaults to **`py -3`** when `PDF_EXTRACT_PYTHON` is unset. Override with full path to `python.exe` if needed.

**Python version:** 3.10+ recommended; 3.8 works with current wheels but triggers cryptography deprecation warnings.

## Run (direct)

```bash
python services/pdf-extraction/python/extract_brochure.py ^
  --input C:\path\brochure.pdf ^
  --output C:\path\raw.json ^
  --source-id tata-nexon-ev-empowered-lr-oem-slot ^
  --variant-slug tata-nexon-ev-empowered-lr
```

Prefer the Node wrapper:

```bash
npm run acq:extract-pdf -- --source-id … --pdf C:\path\brochure.pdf
```

Output is **never** Tier-1 ready — curator maps authoritative cells into `flatSpecs` for `npm run acq:review enqueue-file`.
