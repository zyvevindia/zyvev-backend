#!/usr/bin/env node
/**
 * Scan tracked JS files for resolvable require() paths.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const tracked = execSync('git ls-files "*.js" "*.mjs"', {
  cwd: ROOT,
  encoding: "utf8",
  shell: true,
})
  .trim()
  .split(/\r?\n/)
  .filter((f) => f && !f.includes("node_modules"));

const RE = /require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
const missing = [];
const checked = new Set();

function resolveReq(fromFile, reqPath) {
  const base = path.dirname(path.join(ROOT, fromFile));
  let candidate = path.resolve(base, reqPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    for (const ext of [".js", ".json", "/index.js"]) {
      const p =
        ext === "/index.js"
          ? path.join(candidate, "index.js")
          : candidate + ext;
      if (fs.existsSync(p)) return { ok: true, resolved: p };
    }
  }
  for (const ext of ["", ".js", ".json", path.sep + "index.js"]) {
    const p = candidate + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return { ok: true, resolved: p };
    }
  }
  return { ok: false, resolved: candidate };
}

for (const file of tracked) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, "utf8");
  let m;
  while ((m = RE.exec(text)) !== null) {
    const key = `${file}::${m[1]}`;
    if (checked.has(key)) continue;
    checked.add(key);
    const r = resolveReq(file, m[1]);
    if (!r.ok) {
      missing.push({ file, require: m[1], expected: path.relative(ROOT, r.resolved) });
    }
  }
}

console.log(JSON.stringify({ trackedFiles: tracked.length, missingCount: missing.length, missing }, null, 2));
process.exit(missing.length > 0 ? 1 : 0);
