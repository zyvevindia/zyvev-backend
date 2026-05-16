const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function findPythonCommand() {
  const env = process.env.PDF_EXTRACT_PYTHON;
  if (env && env.trim()) {
    return { executable: env.trim(), prefixArgs: [] };
  }
  if (process.platform === "win32") {
    return { executable: "py", prefixArgs: ["-3"] };
  }
  return { executable: "python3", prefixArgs: [] };
}

const SCRIPT = path.join(__dirname, "python", "extract_brochure.py");

/**
 * Runs governed PDF brochure extraction → structured JSON artifact.
 * Requires optional Python deps: pdfplumber, pymupdf (see requirements.txt).
 */
function extractPdfToJson(pdfAbsolutePath, outJsonAbsolutePath, options = {}) {
  if (!fs.existsSync(SCRIPT)) {
    throw new Error(`extract script missing: ${SCRIPT}`);
  }
  if (!fs.existsSync(pdfAbsolutePath)) {
    throw new Error(`PDF not found: ${pdfAbsolutePath}`);
  }

  fs.mkdirSync(path.dirname(outJsonAbsolutePath), { recursive: true });

  const { executable, prefixArgs } = findPythonCommand();
  const args = [
    ...prefixArgs,
    SCRIPT,
    "--input",
    pdfAbsolutePath,
    "--output",
    outJsonAbsolutePath,
    "--source-id",
    options.sourceId || "unknown-source",
    "--variant-slug",
    options.tier1VariantSlug || "unknown-variant",
    "--method",
    options.method || "AUTO",
  ];

  const proc = spawnSync(executable, args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  const logLines = proc.stdout?.trim() ? [proc.stdout] : [];
  if (proc.stderr?.trim()) logLines.push(proc.stderr);

  return {
    ok: proc.status === 0 && fs.existsSync(outJsonAbsolutePath),
    exitCode: proc.status,
    log: logLines.join("\n"),
    outputPath: outJsonAbsolutePath,
  };
}

module.exports = {
  extractPdfToJson,
};
