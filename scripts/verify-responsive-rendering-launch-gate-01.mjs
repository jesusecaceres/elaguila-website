import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const docPath = path.join(root, "docs", "responsive-rendering-launch-gate-01.md");
const packagePath = path.join(root, "package.json");
const screenshotDir = path.join(root, "qa-final-screenshots", "responsive-rendering-launch-gate-01");

const requiredSections = [
  "Executive Summary",
  "Dirty Tree Snapshot",
  "Routes Checked",
  "Viewports Checked",
  "Responsive Rendering Findings",
  "Image/Logo Rendering Findings",
  "Card Reflow Findings",
  "CTA Rendering Findings",
  "Search/Filter Rendering Findings",
  "Mobile/PWA Readiness Notes",
  "Screenshots Generated",
  "Future Global Responsive JSON Registry Plan",
  "Build Result",
  "Final Recommendation",
];

const errors = [];

function fail(message) {
  errors.push(message);
}

if (!fs.existsSync(docPath)) {
  fail("Missing docs/responsive-rendering-launch-gate-01.md");
} else {
  const doc = fs.readFileSync(docPath, "utf8");
  for (const section of requiredSections) {
    if (!doc.includes(section)) {
      fail(`Doc missing required section: ${section}`);
    }
  }

  const screenshotsExist =
    fs.existsSync(screenshotDir) &&
    fs.readdirSync(screenshotDir).some((entry) => entry.toLowerCase().endsWith(".png"));
  const screenshotsDocumentedAsUnavailable = /screenshots could not be generated|screenshot failure/i.test(doc);

  if (!screenshotsExist && !screenshotsDocumentedAsUnavailable) {
    fail("Screenshot folder is missing/empty and the doc does not explain why screenshots could not be generated.");
  }
}

if (!fs.existsSync(packagePath)) {
  fail("Missing package.json");
} else {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const script = pkg.scripts?.["verify:responsive-rendering-launch-gate-01"];
  if (script !== "node scripts/verify-responsive-rendering-launch-gate-01.mjs") {
    fail("package.json is missing verify:responsive-rendering-launch-gate-01 script.");
  }
}

const status = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" });
const addedFiles = status
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => line.startsWith("??") || line.startsWith("A "))
  .map((line) => line.replace(/^(?:\?\?|A)\s+/, "").replace(/\\/g, "/"));

for (const file of addedFiles) {
  if (/migrations?\//i.test(file) || /supabase\/migrations/i.test(file)) {
    fail(`Migration file added by this gate or present as added/untracked: ${file}`);
  }
  if (/(^|\/)(stripe|payment|payments)(\/|\.|$)/i.test(file)) {
    fail(`Stripe/payment file added by this gate or present as added/untracked: ${file}`);
  }
  if (/(^|\/)\.env(?:\.|$)/i.test(file) || /\.env(?:\.|$)/i.test(file)) {
    fail(`Environment file added by this gate or present as added/untracked: ${file}`);
  }
}

if (errors.length > 0) {
  console.error("Responsive rendering launch gate verifier failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Responsive rendering launch gate verifier passed.");
