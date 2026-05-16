# Licensed OEM brochure drop zone

Place **licensed** Tata (or other OEM) brochure PDFs here:

| Expected filename (Punch LR) | Registry `sourceId` |
|------------------------------|---------------------|
| `tata-punch-ev-empowered-lr-brochure.pdf` | `tata-punch-ev-empowered-lr-oem-licensed` |

Or set environment variable before extract:

```bash
set ACQ_OEM_PDF_PATH=C:\path\to\your-licensed-brochure.pdf
```

Then:

```bash
npm run acq:extract-pdf -- --source-id tata-punch-ev-empowered-lr-oem-licensed
```

**Do not commit licensed PDFs to git.** Add local ignore if needed.

Regression fixture (non-OEM): `../fixtures/punch-pipeline-fixture.pdf` via `tata-punch-ev-empowered-lr-oem-slot`.
