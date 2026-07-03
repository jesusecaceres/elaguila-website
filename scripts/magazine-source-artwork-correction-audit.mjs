#!/usr/bin/env node
/**
 * Zero-cost magazine source-artwork correction audit.
 * Never OCRs the full PDF. Never calls providers. Never modifies files.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative } from "node:path";

const ROOT = process.cwd();
const SOURCE_PDF = resolve(ROOT, "public/magazine/2026/june/leonix_media_june.pdf");
const COVER_PNG = resolve(ROOT, "public/magazine/2026/june/cover.png");
const CORRECTION_MANIFEST = resolve(ROOT, "docs/magazine-source-artwork-correction.md");
const PREFLIGHT_DOC = resolve(ROOT, "docs/magazine-pdf-deepl-compatibility-preflight.md");

const KNOWN_BAD_PATTERNS = [
  { id: "SUITE_202", regex: /Suite\s*202/i, label: "Suite 202 (Leonix should be Suite 201)" },
  { id: "COLEMAN_275", regex: /275\s+Coleman/i, label: "275 Coleman (should be 871 Coleman Avenue)" },
  { id: "PHONE_350_5100", regex: /408[\s.-]*350[\s.-]*5100/, label: "(408) 350-5100 (non-canonical Leonix phone)" },
  { id: "PHONE_313_0380", regex: /408[\s.-]*313[\s.-]*0380/, label: "(408) 313-0380 (non-canonical Leonix phone)" },
  { id: "PHONE_363_6332", regex: /408[\s.-]*363[\s.-]*6332/, label: "(408) 363-6332 (non-canonical Leonix phone)" },
  { id: "MAYO_MAY_2025", regex: /MAYO\s*\/\s*MAY\s*2025|May\s+2025/i, label: "MAYO / MAY 2025 cover label (June 2026 context)" },
];

const CANONICAL_GOOD = [
  { id: "SUITE_201", regex: /Suite\s*201/i, label: "Suite 201" },
  { id: "COLEMAN_871", regex: /871\s+Coleman/i, label: "871 Coleman" },
  { id: "PHONE_360_6500", regex: /408[\s.-]*360[\s.-]*6500/, label: "(408) 360-6500" },
  { id: "EMAIL", regex: /info@leonixmedia\.com/i, label: "info@leonixmedia.com" },
];

const SCAN_DIRS = [
  "app/lib/magazine",
  "app/(site)/magazine",
  "docs",
  "scripts/magazine",
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".md", ".mjs", ".json"]);

function walkFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walkFiles(full, out);
    } else if (SCAN_EXTENSIONS.has(name.slice(name.lastIndexOf(".")))) {
      out.push(full);
    }
  }
  return out;
}

function scanTextFiles() {
  const hits = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walkFiles(resolve(ROOT, dir))) {
      const rel = relative(ROOT, file).replace(/\\/g, "/");
      if (rel.includes("magazine-source-artwork-correction.md")) continue;
      if (rel.includes("magazine-pdf-deepl-compatibility-preflight.md")) continue;
      const text = readFileSync(file, "utf8");
      for (const pattern of [...KNOWN_BAD_PATTERNS, ...CANONICAL_GOOD]) {
        if (pattern.regex.test(text)) {
          hits.push({ file: rel, pattern: pattern.id, label: pattern.label });
        }
      }
    }
  }
  return hits;
}

async function pdfFacts() {
  if (!existsSync(SOURCE_PDF)) {
    return { exists: false, pageCount: null, sizeBytes: null, shaPrefix: null };
  }
  const buf = readFileSync(SOURCE_PDF);
  let pageCount = null;
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    pageCount = doc.getPageCount();
  } catch {
    /* optional */
  }
  return {
    exists: true,
    pageCount,
    sizeBytes: buf.length,
    sizeMB: (buf.length / (1024 * 1024)).toFixed(2),
  };
}

const pdf = await pdfFacts();
const repoHits = scanTextFiles();
const badInRepo = repoHits.filter((h) => KNOWN_BAD_PATTERNS.some((p) => p.id === h.pattern));
const manifestExists = existsSync(CORRECTION_MANIFEST);
const preflightExists = existsSync(PREFLIGHT_DOC);

const blockers = [];
if (!pdf.exists) blockers.push("SOURCE_PDF_MISSING");
if (!manifestExists) blockers.push("CORRECTION_MANIFEST_MISSING");
blockers.push("PDF_ARTWORK_NOT_VERIFIED_WITHOUT_MANUAL_QA_OR_OCR");

let decision = "HOLD_FOR_CANVA_SOURCE_UPDATE";
if (!pdf.exists) decision = "SOURCE_PDF_MISSING";
else if (badInRepo.length > 0) decision = "REPO_TEXT_HAS_KNOWN_BAD_VALUES";

console.log("# MAGAZINE-SOURCE-ARTWORK-CORRECTION-AUDIT");
console.log("");
console.log("## Summary");
console.log(`decision=${decision}`);
console.log(`sourcePdfCorrectedInRepo=unknown-requires-manual-visual-QA`);
console.log(`flattenedPdfTextVerification=not-automated-no-full-OCR`);
console.log("");
console.log("## Source files");
console.log(`PDF exists: ${pdf.exists}`);
console.log(`PDF path: public/magazine/2026/june/leonix_media_june.pdf`);
console.log(`PDF page count: ${pdf.pageCount ?? "n/a"}`);
console.log(`PDF size: ${pdf.sizeBytes ?? "n/a"} bytes (${pdf.sizeMB ?? "n/a"} MB)`);
console.log(`cover.png exists: ${existsSync(COVER_PNG)}`);
console.log(`correction manifest exists: ${manifestExists}`);
console.log(`compatibility preflight doc exists: ${preflightExists}`);
console.log("");
console.log("## Repo text scan (excludes correction/preflight docs)");
console.log(`bad pattern hits in repo text: ${badInRepo.length}`);
for (const hit of badInRepo.slice(0, 20)) {
  console.log(`- ${hit.file}: ${hit.label}`);
}
if (badInRepo.length === 0) {
  console.log("- none (expected while PDF artwork still wrong but not stored as repo text)");
}
console.log("");
console.log("## Important");
console.log(
  "Flattened PDF Leonix contact errors (Suite 202, wrong phones) cannot be verified or fixed by this script.",
);
console.log("Apply corrections in Canva, re-export PDF, then run MAGAZINE-SOURCE-PDF-REPLACEMENT-QA1.");
console.log("");
console.log(`result=${decision === "HOLD_FOR_CANVA_SOURCE_UPDATE" ? "HOLD" : "CHECK"}`);

process.exit(decision === "HOLD_FOR_CANVA_SOURCE_UPDATE" ? 2 : 1);
