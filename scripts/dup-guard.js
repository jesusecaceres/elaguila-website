#!/usr/bin/env node
/**
 * LEONIX DUP GUARD — prevents duplicate route folder explosions that break Next.js typecheck.
 * Runs automatically via npm "prebuild".
 *
 * Fails the build if any forbidden duplicate patterns are found under app/clasificados.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const root = path.join(repoRoot, "app", "clasificados");

if (!fs.existsSync(root)) {
  process.exit(0);
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function walkDirs(start) {
  const out = [];
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); }
    catch { continue; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(cur, e.name);
      out.push(full);
      stack.push(full);
    }
  }
  return out;
}

const dirs = walkDirs(root);

// Normalize to a consistent separator for regex matching
const norm = (p) => p.split(path.sep).join("\\"); // windows-style for easy matching

const bad = new Set();

// A) Direct duplicate engine folder: app\clasificados\clasificados\
for (const d of dirs) {
  const n = norm(d);
  if (n.includes("\\app\\clasificados\\clasificados\\")) bad.add(d);
}

// B) Any repeated folder name like X\X for key folders
const repeatNames = ["restaurantes", "publicar", "components", "anuncio", "autos", "rentas", "empleos", "en-venta", "servicios", "clases", "comunidad"];
const repeatRe = new RegExp(`\\\\(${repeatNames.map(s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|")})\\\\\\1(\\\\|$)`, "i");

for (const d of dirs) {
  const n = norm(d);
  if (repeatRe.test(n)) bad.add(d);
}

if (bad.size > 0) {
  const list = Array.from(bad).sort();
  console.error("\n❌ LEONIX DUP GUARD: Duplicate folder patterns detected under app/clasificados.\n");
  for (const p of list) console.error(" - " + path.relative(repoRoot, p));
  console.error("\nFix: delete/merge duplicates so only canonical routes remain. Build aborted.\n");
  process.exit(1);
}

process.exit(0);
