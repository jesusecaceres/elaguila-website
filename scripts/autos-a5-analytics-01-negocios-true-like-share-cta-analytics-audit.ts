/**
 * A5.ANALYTICS-01 — Autos Negocios true like + share + CTA analytics audit.
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const AUDIT_MD = path.join(
  ROOT,
  "app/lib/clasificados/autos/AUTOS_A5_ANALYTICS_01_NEGOCIOS_TRUE_LIKE_SHARE_CTA_ANALYTICS_AUDIT.md",
);

const GATE_ROWS = [
  "Correct repo confirmed",
  "Autos Negocios analytics scope only",
  "Autos Privado application/form untouched",
  "Unrelated categories untouched",
  "No Supabase migrations touched",
  "No Stripe/payment touched",
  "No auth touched",
  "Autos public detail inspected",
  "Autos results card inspected",
  "Autos parent/child identity inspected",
  "En Venta analytics reference inspected",
  "Bienes parent/child analytics reference inspected if present",
  "Autos analytics adapter exists or equivalent confirmed",
  "Analytics uses internal UUID as source_id",
  "Leonix Ad ID used only for display/canonical metadata",
  "Parent analytics use parent UUID",
  "Child analytics use child UUID",
  "Sibling analytics remain independent",
  "Heart visible on published detail",
  "Zero likes shows heart only",
  "One like shows 1 with heart",
  "Two likes show 2 with heart",
  "Like writes real event/data",
  "Like persists after refresh",
  "Unlike truthful if supported",
  "No local-only fake like count",
  "Share button visible on published detail",
  "Native share supported where available",
  "Copy fallback supported",
  "Exact public URL shared",
  "Share writes real analytics",
  "No fake share count shown",
  "Call CTA tracks real event",
  "WhatsApp CTA tracks real event",
  "Text/SMS CTA tracks real event if visible",
  "Email CTA tracks real event",
  "Website CTA tracks real event",
  "Directions CTA tracks real event",
  "Google Business CTA tracks real event if visible",
  "Google Reviews CTA tracks real event if visible",
  "Yelp CTA tracks real event if visible",
  "Schedule/test-drive CTA tracks real event if visible",
  "Finance/preapproval CTA tracks real event if visible",
  "Custom dealership links track real events if visible",
  "Every visible CTA has real destination or is hidden",
  "Preview does not record analytics",
  "Preview does not show fake like count",
  "Preview does not show fake share count",
  "Results/listing open uses exact UUID",
  "Child inventory card open uses child UUID when published",
  "Dashboard analytics readiness inspected",
  "Parent dashboard analytics use parent UUID",
  "Child dashboard analytics use child UUID",
  "Fake saves/messages/leads hidden or not rendered",
  "Admin identity readiness inspected",
  "No dashboard redesign",
  "No admin redesign",
  "Build passed",
  "No files staged",
  "No commit created",
  "No push attempted",
  "Ready for Chuy QA",
];

const FORBIDDEN_PREFIXES = [
  "app/(site)/publicar/autos/privado/",
  "supabase/migrations/",
  "app/api/stripe/",
  "app/admin/",
];

const GATE_SCOPED_MARKERS = [
  "AUTOS_A5_ANALYTICS_01",
  "autos-a5-analytics-01",
  "autosGlobalAnalytics",
  "AutosEngagementRow",
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function changedFiles(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
    const tracked = out ? out.split(/\r?\n/).filter(Boolean) : [];
    const untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    return [...new Set([...tracked, ...untracked])];
  } catch {
    return [];
  }
}

function run() {
  assert.ok(fs.existsSync(AUDIT_MD), "A5.ANALYTICS-01 audit markdown must exist");
  const auditText = fs.readFileSync(AUDIT_MD, "utf8");
  assert.match(auditText, /TRUE\/FALSE audit table/i, "TRUE/FALSE table required");

  const recMatch = auditText.match(/Final recommendation:\s*\*{0,2}(GREEN|YELLOW|RED)\*{0,2}/i);
  assert.ok(recMatch, "Final recommendation required");
  const recommendation = recMatch![1]!.toUpperCase();

  for (const row of GATE_ROWS) {
    const line = auditText.split("\n").find((l) => l.includes(`| ${row} |`) || l.includes(`|${row}|`));
    assert.ok(line, `Missing gate row: ${row}`);
    if (recommendation === "GREEN") {
      assert.match(line, /\|\s*TRUE\s*\|/i, `GREEN requires TRUE: ${row}`);
    }
  }

  const adapter = read("app/lib/clasificados/autos/analytics/autosGlobalAnalytics.ts");
  assert.ok(adapter.includes("listing_like"), "listing_like in adapter");
  assert.ok(adapter.includes("listing_unlike"), "listing_unlike in adapter");
  assert.ok(adapter.includes("listing_share"), "listing_share in adapter");
  assert.ok(adapter.includes("phone_click"), "phone_click in adapter");
  assert.ok(adapter.includes("whatsapp_click"), "whatsapp_click in adapter");
  assert.ok(adapter.includes("email_click"), "email_click in adapter");
  assert.ok(adapter.includes("website_click"), "website_click in adapter");
  assert.ok(adapter.includes("directions_click"), "directions_click in adapter");
  assert.ok(adapter.includes("google_business_click"), "google_business_click in adapter");
  assert.ok(adapter.includes("google_reviews_click"), "google_reviews_click in adapter");
  assert.ok(adapter.includes("yelp_click"), "yelp_click in adapter");
  assert.ok(adapter.includes("finance_preapproval_click"), "finance_preapproval_click in adapter");
  assert.ok(adapter.includes("listingUuid"), "source_id UUID contract");
  assert.ok(adapter.includes("leonixAdId"), "leonix_ad_id metadata");
  assert.ok(adapter.includes("dealer_inventory_group_id"), "dealer_inventory_group_id");
  assert.ok(adapter.includes("dealer_inventory_parent_listing_id"), "dealer_inventory_parent_listing_id");
  assert.ok(adapter.includes("inventory_role"), "inventory_role");

  const likeBtn = read("app/components/clasificados/analytics/LeonixLikeButton.tsx");
  assert.ok(likeBtn.includes('countDisplay === "numeric"'), "numeric like display mode");
  assert.ok(likeBtn.includes("displayCount > 0"), "zero likes hides numeric label");

  const engagement = read("app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx");
  assert.ok(engagement.includes("countDisplay=\"numeric\""), "Autos engagement uses numeric heart");
  assert.ok(engagement.includes("listingId={sourceId}"), "likes use internal UUID");

  const bundleCopy = read("app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts");
  assert.ok(bundleCopy.includes("Save inventory"), "Save inventory copy preserved");

  const shareBtn = read("app/components/clasificados/analytics/LeonixShareButton.tsx");
  assert.ok(shareBtn.includes("copy_link") || shareBtn.includes("fallback_copy"), "share copy fallback");

  const privadoApp = read("app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx");
  assert.ok(!privadoApp.includes("autosGlobalAnalytics"), "Privado application untouched");

  for (const f of changedFiles()) {
    const norm = f.replace(/\\/g, "/");
    assert.ok(!norm.startsWith("app/(site)/publicar/autos/privado/"), `Privado app modified: ${norm}`);
    assert.ok(!norm.startsWith("supabase/migrations/"), `Migration modified: ${norm}`);
    for (const prefix of FORBIDDEN_PREFIXES) {
      if (norm.startsWith(prefix)) assert.fail(`Forbidden change: ${norm}`);
    }
  }

  console.log(`A5.ANALYTICS-01 audit PASS (${recommendation})`);
}

run();
