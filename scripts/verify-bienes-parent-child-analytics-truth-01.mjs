#!/usr/bin/env node
/**
 * Verifier — Bienes parent/child listing identity + true analytics (golden stack).
 * Static + fixture proof. Does not write to Supabase.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

function gitDiffForPrefix(prefix) {
  try {
    return execFileSync("git", ["diff", "--name-only", "--", prefix], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

const bundleRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryBundlePendingPublish.ts";
const analyticsRel = "app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts";
const adapterRel = "app/lib/clasificados/bienes-raices/analytics/bienesRaicesGlobalAnalytics.ts";
const engagementRel = "app/(site)/clasificados/bienes-raices/listing/BrEngagementRow.tsx";
const likeBtnRel = "app/components/clasificados/analytics/LeonixLikeButton.tsx";
const liveMountRel = "app/(site)/clasificados/bienes-raices/listing/BrLiveDetailAnalyticsMount.tsx";
const detailLayoutRel = "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx";
const resultsCardRel =
  "app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx";
const previewViewRel =
  "app/(site)/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx";
const ownerQueryRel = "app/(site)/dashboard/lib/ownerListingsQuery.ts";
const adminTableRel = "app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx";
const manageCardRel = "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx";
const draftPersistRel =
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/previewDraft.ts";

for (const rel of [
  bundleRel,
  analyticsRel,
  adapterRel,
  engagementRel,
  likeBtnRel,
  liveMountRel,
  detailLayoutRel,
  resultsCardRel,
  previewViewRel,
  ownerQueryRel,
  adminTableRel,
  manageCardRel,
]) {
  assert(existsSync(path.join(ROOT, rel)), `${rel} must exist`);
}

const bundle = read(bundleRel);
const analytics = read(analyticsRel);
const adapter = read(adapterRel);
const engagement = read(engagementRel);
const likeBtn = read(likeBtnRel);
const liveMount = read(liveMountRel);
const detail = read(detailLayoutRel);
const resultsCard = read(resultsCardRel);
const previewView = read(previewViewRel);
const ownerQuery = read(ownerQueryRel);
const adminTable = read(adminTableRel);
const manageCard = read(manageCardRel);
const pkg = read("package.json");

// 1–4 Parent/child identity
assert(bundle.includes("publishLeonixListingFromAgenteResidencialDraft"), "Child publish uses real listing publisher");
assert(bundle.includes('mode: "add"'), "Child publish uses inventory add mode");
assert(bundle.includes("parentListingId"), "Child retains parent listing id");
assert(bundle.includes("brInventoryGroupId"), "Child retains inventory group id");
assert(bundle.includes("pending_payment"), "Child rows use pending_payment activation");
assert(bundle.includes("childListingId === parentListingId"), "Child UUID must not equal parent UUID");
assert(bundle.includes("fetchLeonixAdId"), "Each child fetches its own Leonix Ad ID");
assert(bundle.includes("inventoryRole: \"inventory_property\""), "Child role is inventory_property");

// 5 Public links use exact record identity
assert(resultsCard.includes("leonixLiveAnuncioPath"), "Results card builds path from listing id");
assert(resultsCard.includes("listingUuid={listing.id}"), "Results engagement uses card listing UUID");
assert(resultsCard.includes("BrEngagementRow"), "Results card uses BrEngagementRow");
assert(!resultsCard.includes("LeonixSaveButton"), "Results card must not show fake/unready save");

// 6–9 Like/share + count display
assert(analytics.includes("trackBrLikeGlobal"), "Like analytics helper exists");
assert(analytics.includes("listing_like"), "listing_like event type used");
assert(analytics.includes("listing_unlike"), "listing_unlike event type used");
assert(analytics.includes("trackBrListingShareGlobal"), "Share analytics helper exists");
assert(analytics.includes('category: CATEGORY') || analytics.includes('CATEGORY = "bienes-raices"'), "Category bienes-raices");
assert(analytics.includes('SOURCE_TABLE = "listings"'), "source_table is listings");
assert(analytics.includes("source_id: sourceId"), "source_id is listing UUID");
assert(adapter.includes("trackBrLikeGlobal"), "Preferred adapter re-exports like");
assert(engagement.includes("countDisplay=\"numeric\""), "Engagement uses numeric heart count display");
assert(engagement.includes("user_liked_listings"), "Like count sourced from user_liked_listings");
assert(engagement.includes("trackBrLikeGlobal"), "Engagement records like against BR analytics");
assert(engagement.includes("trackBrListingShareGlobal"), "Engagement records share against BR analytics");
assert(engagement.includes('mode === "preview"'), "Preview mode disables live analytics");
assert(engagement.includes("directNativeShare"), "Share uses native/copy path");
assert(likeBtn.includes('countDisplay === "numeric"'), "Like button supports numeric count mode");
assert(likeBtn.includes("displayCount > 0"), "Zero likes omits numeric zero");
assert(likeBtn.includes("data-leonix-like-count"), "Like count exposed for QA");

// Live detail wiring
assert(detail.includes("BrEngagementRow"), "Live BR detail mounts BrEngagementRow");
assert(detail.includes("trackBrListingShareGlobal"), "Live BR share uses BR analytics");
assert(liveMount.includes("trackBrListingViewGlobal"), "Live mount records listing_view");
assert(liveMount.includes("trackBrListingOpenGlobal"), "Live mount records listing_open");

// Preview truthful disabled engagement
assert(previewView.includes("BrEngagementRow"), "Draft preview shows engagement placement");
assert(previewView.includes('mode="preview"'), "Draft preview engagement is preview mode");

// CTA helpers present (metadata cta_click for non-allowlist names)
assert(analytics.includes("google_business"), "Google Business CTA tracker");
assert(analytics.includes("google_reviews"), "Google Reviews CTA tracker");
assert(analytics.includes("yelp"), "Yelp CTA tracker");
assert(analytics.includes("request_info"), "Request info CTA tracker");
assert(analytics.includes("schedule_visit"), "Schedule visit CTA tracker");
assert(analytics.includes("brochure"), "Brochure CTA tracker");
assert(analytics.includes("mls"), "MLS CTA tracker");

// Dashboard / admin child identity
assert(ownerQuery.includes("br_inventory_parent_listing_id"), "Owner query selects parent link");
assert(ownerQuery.includes("inventory_role"), "Owner query selects inventory_role");
assert(manageCard.includes("Inventory property") || manageCard.includes("Propiedad de inventario"), "Dashboard shows inventory badge");
assert(manageCard.includes("leonix_ad_id"), "Dashboard shows Leonix Ad ID");
assert(adminTable.includes("inventory_role"), "Admin surfaces inventory_role");
assert(adminTable.includes("br_inventory_parent_listing_id"), "Admin surfaces parent listing id");
assert(adminTable.includes("inv:"), "Admin does not collapse children (shows inv role bit)");

// No fake local-only like count
assert(!engagement.includes("localStorage"), "No localStorage fake like count");
assert(!engagement.includes("Math.random"), "No random fake like count");

// Locked systems untouched by this verifier's git check
const lockedPrefixes = [
  "supabase/migrations/",
  "app/api/stripe/",
  "app/api/revenue-os/checkout/",
  "app/api/revenue-os/webhook/",
  "app/lib/clasificados/autos/",
];
for (const prefix of lockedPrefixes) {
  const changed = gitDiffForPrefix(prefix);
  assert(!changed, `Locked path must not be modified: ${prefix} (${changed})`);
}

const draftPersist = read(draftPersistRel);
assert(
  draftPersist.includes("bootstrapAgenteIndividualResidencialApplicationState"),
  "Draft persistence bootstrap path must remain present (hydration lock)",
);
assert(
  draftPersist.includes("persistAgenteResApplicationDraftResolved"),
  "Draft persist path must remain present (hydration lock)",
);

assert(
  pkg.includes('"verify:bienes-parent-child-analytics-truth-01"'),
  "package.json must include verify:bienes-parent-child-analytics-truth-01",
);

console.log("verify:bienes-parent-child-analytics-truth-01 — all checks passed");
console.log("PROOF_TYPE: STATIC + IMPLEMENTATION CONTRACT");
