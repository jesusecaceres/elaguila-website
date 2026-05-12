/**
 * Servicios engagement: net like aggregation, listing keys, owner dashboard key source.
 * Run: npx tsx scripts/servicios-engagement-smoke.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  serviciosEngagementListingKey,
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
  serviciosNetLikeCountMapFromAnalyticsRows,
} from "../app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";

function main() {
  assert.equal(serviciosEngagementListingKey({ slug: "x", leonix_ad_id: "SERV-2026-000001", id: "row-uuid" }), "SERV-2026-000001");
  assert.equal(serviciosEngagementListingKey({ slug: "slug-only", leonix_ad_id: null, id: undefined }), "slug-only");
  assert.equal(serviciosEngagementListingKey({ slug: "s", leonix_ad_id: "  ", id: "abc-123" }), "abc-123");

  const m0 = serviciosNetLikeCountMapFromAnalyticsRows(
    [
      { listing_id: "SERV-2026-000001", event_type: "listing_like" },
      { listing_id: "SERV-2026-000001", event_type: "listing_like" },
      { listing_id: "SERV-2026-000001", event_type: "listing_unlike" },
      { listing_id: "SERV-2026-000001", event_type: "listing_unlike" },
      { listing_id: "SERV-2026-000001", event_type: "listing_unlike" },
    ],
    ["SERV-2026-000001"],
  );
  assert.equal(m0.get("SERV-2026-000001"), 0, "net likes floor at 0");

  const m1 = serviciosNetLikeCountMapFromAnalyticsRows(
    [
      { listing_id: "SERV-2026-000002", event_type: "listing_like" },
      { listing_id: "SERV-2026-000002", event_type: "listing_like" },
      { listing_id: "SERV-2026-000002", event_type: "listing_unlike" },
    ],
    ["SERV-2026-000002"],
  );
  assert.equal(m1.get("SERV-2026-000002"), 1);

  const rowMulti = { slug: "my-slug", leonix_ad_id: "SERV-2026-000099", id: "row-uuid-1" };
  assert.deepEqual(new Set(serviciosLikeCountAliasKeys(rowMulti)), new Set(["SERV-2026-000099", "row-uuid-1", "my-slug"]));
  const mapSplit = new Map<string, number>([
    ["SERV-2026-000099", 0],
    ["row-uuid-1", 2],
    ["my-slug", 0],
  ]);
  assert.equal(serviciosNetLikeCountForPublicRow(rowMulti, mapSplit), 2);

  const ownerKeysSrc = readFileSync(join(__dirname, "../app/lib/ownerEngagementListingKeys.ts"), "utf8");
  assert.ok(ownerKeysSrc.includes("servicios_public_listings"));
  assert.ok(ownerKeysSrc.includes("leonix_ad_id"));
  assert.ok(ownerKeysSrc.includes('"id, slug, leonix_ad_id"'), "dashboard key collection selects Servicios ids + leonix_ad_id");

  const browserSrc = readFileSync(join(__dirname, "../app/lib/supabase/browser.ts"), "utf8");
  assert.ok(browserSrc.includes("getBrowserAuthUserForEngagement"), "browser: shared engagement auth helper");
  assert.ok(browserSrc.includes("getSession"), "browser: session-first auth for engagement");

  const likeBtn = readFileSync(join(__dirname, "../app/components/clasificados/analytics/LeonixLikeButton.tsx"), "utf8");
  assert.ok(likeBtn.includes("getBrowserAuthUserForEngagement"), "like: uses shared engagement auth");
  assert.ok(!likeBtn.includes("Intenta iniciar sesión"), "like: no misleading sign-in copy on DB failure");
  assert.ok(likeBtn.includes("engagementWriteFailedMsg"), "like: write-failure vs auth messaging split");
  assert.ok(likeBtn.includes("userToggledRef"), "like: guard hydration overwrite after toggle");
  assert.ok(likeBtn.includes("setIsLiked(nextState)"), "like: optimistic UI");
  assert.ok(!likeBtn.includes("setIsLiked(initialLiked)"), "like: no initialLiked sync effect (Strict Mode reset bug)");
  assert.ok(likeBtn.includes("FaHeart"), "like: solid heart when active");
  assert.ok(likeBtn.includes("data-leonix-like-error"), "like: error marker for QA");

  const saveBtn = readFileSync(join(__dirname, "../app/components/clasificados/analytics/LeonixSaveButton.tsx"), "utf8");
  assert.ok(saveBtn.includes("getBrowserAuthUserForEngagement"), "save: uses shared engagement auth");
  assert.ok(saveBtn.includes("engagementNeedAuthMsg"), "save: explicit need-auth copy before login redirect");
  assert.ok(saveBtn.includes("engagementWriteFailedMsg"), "save: DB failure copy distinct from auth");
  assert.ok(!saveBtn.includes("setIsSaved(initialSaved)"), "save: do not reset from initialSaved effect");
  assert.ok(saveBtn.includes("data-leonix-save-error"), "save: error marker for QA");
  assert.ok(saveBtn.includes("savedDashboard"), "save: dashboard confirmation copy");
  assert.ok(saveBtn.includes("data-leonix-save-dashboard-hint"), "save: hint marker for QA");
  assert.ok(saveBtn.includes("FaBookmark"), "save: solid bookmark when active");

  const profileView = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosProfileView.tsx"), "utf8");
  assert.ok(profileView.includes("data-servicios-results-cta"), "profile: results CTA marker");
  assert.ok(profileView.includes("Ver resultados de Servicios"));

  const resultCard = readFileSync(
    join(__dirname, "../app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx"),
    "utf8",
  );
  assert.ok(resultCard.includes("data-servicios-like-badge"), "card: like badge marker");
  assert.ok(resultCard.includes("public_like_net_count"));

  console.log("servicios-engagement-smoke: OK");
}

main();
