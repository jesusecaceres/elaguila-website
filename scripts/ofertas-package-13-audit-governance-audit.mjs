import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const governance = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_13_HISTORICAL_AUDIT_GOVERNANCE.md"), "utf8");
const foundation = readFileSync(path.join(repoRoot, "scripts/ofertas-locales-gate-1-foundation-audit.ts"), "utf8");
const analytics = readFileSync(path.join(repoRoot, "app/lib/ofertas-locales/ofertasLocalesAnalyticsEvents.ts"), "utf8");
const publicAnalytics = readFileSync(path.join(repoRoot, "app/lib/ofertas-locales/ofertasLocalesPublicAnalytics.ts"), "utf8");

const mustInclude = (label, text, needle) => {
  if (!text.includes(needle)) throw new Error(`${label} missing ${needle}`);
};

for (const marker of ["RELEASE-GATING", "PACKAGE COMPATIBILITY", "ARCHIVED NON-GATING"]) {
  mustInclude("governance classes", governance, marker);
}

for (const audit of [
  "scripts/ofertas-package-13-*.mjs",
  "scripts/ofertas-package-12-*.mjs",
  "scripts/ofertas-locales-gate-1-foundation-audit.ts",
  "scripts/ofertas-locales-ol7-ai-scan-action-candidate-review-audit.ts",
  "scripts/ofertas-locales-ol7e-production-scan-prep-runtime-diagnostic-audit.ts",
  "Stack 12, OL7, and OL7E remain gating",
]) {
  mustInclude("governance audit list", governance, audit);
}

for (const protectedContract of [
  "security",
  "identity",
  "payment",
  "entitlement",
  "term",
  "source-version",
  "privacy",
  "public-eligibility",
]) {
  mustInclude("no silent archival", governance, protectedContract);
}

mustInclude("foundation current analytics", foundation, "OFERTAS_LOCALES_CANONICAL_ANALYTICS_EVENTS");
mustInclude("foundation current analytics", foundation, "OFERTAS_LOCALES_ANALYTICS_NAMESPACE");
mustInclude("foundation consent", foundation, "leonixAnalyticsAllowed");
mustInclude("foundation identity", foundation, "source_id: identity.ofertaLocalId");
mustInclude("analytics catalog", analytics, "OFERTAS_LOCALES_CANONICAL_ANALYTICS_EVENTS");
mustInclude("analytics shared storage", analytics, "listing_analytics");
mustInclude("public analytics consent", publicAnalytics, "leonixAnalyticsAllowed");
mustInclude("public analytics parent identity", publicAnalytics, "source_id: identity.ofertaLocalId");
mustInclude("public analytics item identity", publicAnalytics, "productId: item.id");

if (analytics.includes("preview_impression") || publicAnalytics.includes("preview_impression")) {
  throw new Error("Preview impressions must not be recorded by Ofertas analytics.");
}

console.log("PASS: Package 13 historical audit governance is classified, current, and gating-safe.");
