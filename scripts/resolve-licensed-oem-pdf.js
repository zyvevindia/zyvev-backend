#!/usr/bin/env node
/**
 * Resolve licensed OEM PDF path for ingestion.
 * Priority: --pdf arg > ACQ_OEM_PDF_PATH > data-acquisition/incoming/<defaultName>
 */
const fs = require("fs");
const path = require("path");

const INCOMING = path.join(
  __dirname,
  "../data-acquisition/incoming"
);

function resolveLicensedOemPdf(options = {}) {
  const defaultName =
    options.defaultName || "tata-punch-ev-empowered-lr-brochure.pdf";

  if (options.pdfPath) {
    const p = path.resolve(options.pdfPath);
    if (!fs.existsSync(p)) {
      return { found: false, path: p, reason: "cli_path_missing" };
    }
    return { found: true, path: p, reason: "cli" };
  }

  if (process.env.ACQ_OEM_PDF_PATH) {
    const p = path.resolve(process.env.ACQ_OEM_PDF_PATH);
    if (!fs.existsSync(p)) {
      return { found: false, path: p, reason: "env_path_missing" };
    }
    return { found: true, path: p, reason: "ACQ_OEM_PDF_PATH" };
  }

  const incoming = path.join(INCOMING, defaultName);
  if (fs.existsSync(incoming)) {
    return { found: true, path: incoming, reason: "incoming_default" };
  }

  return {
    found: false,
    path: incoming,
    reason: "incoming_missing",
    hint: `Place licensed PDF at ${incoming} or set ACQ_OEM_PDF_PATH`,
  };
}

if (require.main === module) {
  const pdfIdx = process.argv.indexOf("--pdf");
  const pdfPath = pdfIdx >= 0 ? process.argv[pdfIdx + 1] : null;
  const r = resolveLicensedOemPdf({ pdfPath });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.found ? 0 : 2);
}

module.exports = { resolveLicensedOemPdf, INCOMING };
