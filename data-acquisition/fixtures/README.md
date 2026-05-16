# Acquisition fixtures

## `punch-pipeline-fixture.pdf`

**Not an OEM document.** One-page PDF generated with PyMuPDF for **pipeline validation only** (text extraction, raw JSON shape, Node `extract-oem-pdf` bridge).

Replace the registry `localAssetPath` for `tata-punch-ev-empowered-lr-oem-slot` with a **licensed Tata brochure** before any production intelligence claim.

## Regenerate (optional)

```bash
cd zyvev-backend
py -3 -c "import fitz, pathlib; pathlib.Path('data-acquisition/fixtures').mkdir(parents=True, exist_ok=True); d=fitz.open(); p=d.new_page(); p.insert_text((72,72),'Fixture line 1'); d.save('data-acquisition/fixtures/punch-pipeline-fixture.pdf'); d.close()"
```
