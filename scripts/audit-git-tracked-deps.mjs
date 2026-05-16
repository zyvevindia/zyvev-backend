#!/usr/bin/env node
/**
 * Find relative require() targets that exist on disk but are not git-tracked.
 * Render deploys only committed files — these are production blockers.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const tracked = new Set(
  execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, "/"))
);

function isTracked(rel) {
  const n = rel.replace(/\\/g, "/");
  if (tracked.has(n)) return true;
  if (tracked.has(`${n}.js`)) return true;
  if (tracked.has(`${n}/index.js`)) return true;
  return false;
}

function resolveRequire(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.json`,
    path.join(base, "index.js"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const missingOnDisk = [];
const untrackedRefs = [];

for (const rel of tracked) {
  if (!rel.endsWith(".js") && !rel.endsWith(".mjs")) continue;
  const abs = path.join(ROOT, rel);
  let src;
  try {
    src = fs.readFileSync(abs, "utf8");
  } catch {
    continue;
  }
  let m;
  while ((m = requireRe.exec(src))) {
    const spec = m[1];
    const resolved = resolveRequire(abs, spec);
    if (!resolved) {
      if (spec.startsWith(".")) {
        missingOnDisk.push({ from: rel, spec });
      }
      continue;
    }
    const relTarget = path.relative(ROOT, resolved).replace(/\\/g, "/");
    if (!isTracked(relTarget)) {
      untrackedRefs.push({ from: rel, spec, target: relTarget });
    }
  }
}

const uniqueUntracked = [...new Map(untrackedRefs.map((u) => [u.target, u])).values()];

console.log(
  JSON.stringify(
    {
      trackedFiles: tracked.size,
      missingOnDiskCount: missingOnDisk.length,
      missingOnDisk,
      untrackedTargetCount: uniqueUntracked.length,
      untrackedTargets: uniqueUntracked.map((u) => u.target).sort(),
      untrackedRefs: untrackedRefs.slice(0, 50),
    },
    null,
    2
  )
);

process.exit(missingOnDisk.length > 0 ? 1 : 0);
