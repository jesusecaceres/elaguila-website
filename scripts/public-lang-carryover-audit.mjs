#!/usr/bin/env node
/**
 * LANG-CARRYOVER-FINAL1 — lightweight public link leak detector.
 * Run: node scripts/public-lang-carryover-audit.mjs
 */
import { execSync } from "node:child_process";

const PATTERNS = [
  { id: "contacto", re: String.raw`href="/contacto"`, note: "Hardcoded /contacto without lang" },
  { id: "media-kit", re: String.raw`href="/media-kit"`, note: "Hardcoded /media-kit without lang" },
  { id: "newsletter", re: String.raw`href="/newsletter"`, note: "Hardcoded /newsletter without lang" },
  { id: "tienda-contacto", re: String.raw`href="/tienda/contacto"`, note: "Hardcoded tienda contact" },
  { id: "qr-translator", re: String.raw`href="/qr/translator"`, note: "Hardcoded QR translator" },
  { id: "magazine-read", re: String.raw`href="/magazine/2026/june/read"`, note: "Hardcoded magazine read" },
  { id: "coming-soon", re: String.raw`href="/coming-soon-v2"`, note: "Hardcoded coming soon" },
  { id: "direct-google-cta", re: String.raw`buildGoogleTranslateWebsitesModeUrl\(`, note: "Direct Google URL builder in component (should use translateSiteHref for visible CTAs)" },
  { id: "translate-proxy", re: String.raw`leonixmedia-com\.translate\.goog`, note: "Google proxy domain in public code" },
];

const GLOB = "app/(site) app/components app/translate-site app/lib/leonix app/lib/magazine";

function rg(pattern) {
  try {
    return execSync(`rg -n "${pattern}" ${GLOB} --glob "*.tsx" --glob "*.ts"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

console.log("# Public language carryover audit\n");

let failures = 0;

for (const { id, re, note } of PATTERNS) {
  const hits = rg(re);
  if (!hits) {
    console.log(`✓ ${id}: no matches`);
    continue;
  }
  if (id === "direct-google-cta" && !hits.includes("app/lib/googleTranslateWebsite.ts") && !hits.includes("app/translate-site/page.tsx")) {
    failures += 1;
    console.log(`✗ ${id}: ${note}\n${hits}\n`);
    continue;
  }
  if (id === "direct-google-cta") {
    const filtered = hits
      .split("\n")
      .filter(
        (line) =>
          !line.includes("googleTranslateWebsite.ts") && !line.includes("translate-site/page.tsx"),
      )
      .join("\n");
    if (filtered) {
      failures += 1;
      console.log(`✗ ${id}: ${note}\n${filtered}\n`);
    } else {
      console.log(`✓ ${id}: only allowed helper usages`);
    }
    continue;
  }
  failures += 1;
  console.log(`✗ ${id}: ${note}\n${hits}\n`);
}

console.log("\n## Matrix routes (manual browser QA)\n");
const matrix = [
  "/coming-soon-v2?lang=es|pt|ja|pa",
  "/qr/translator?lang=es|pt|ja|pa",
  "/magazine/2026/june/read?lang=es|pt|ja|pa&source=print",
  "/media-kit?lang=es|pt|ja|pa",
  "/contacto?lang=pt&sourcePage=media-kit&sourceCta=media_kit_ad_info&inquiryType=advertising",
  "/newsletter?lang=ja&source=coming-soon-v2&sourceCta=join_launch",
  "/tienda/contacto?lang=pa&service=cotizacion-general&sourcePage=coming-soon-v2&sourceCta=promo_quote",
  "/translate-site?lang=es&sourcePage=coming-soon-v2&sourceCta=test",
  "/translate-site?lang=pt&returnTo=https://evil.com",
];
for (const route of matrix) console.log(`- ${route}`);

process.exit(failures > 0 ? 1 : 0);
