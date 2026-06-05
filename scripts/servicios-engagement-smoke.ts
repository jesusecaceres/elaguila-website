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

  const analyticsSrc = readFileSync(join(__dirname, "../app/lib/clasificadosAnalytics.ts"), "utf8");
  assert.ok(analyticsSrc.includes("ListingAnalyticsInsertResult"), "analytics: insert result type for engagement");
  assert.ok(
    analyticsSrc.includes('const { error } = await supabase.from("listing_analytics").insert(payload)'),
    "analytics: checks insert error",
  );

  const diagSrc = readFileSync(join(__dirname, "../app/lib/leonixEngagementClientDiagnostics.ts"), "utf8");
  assert.ok(diagSrc.includes("formatEngagementWriteErrorForDev"), "diagnostics: dev-only write error formatting");

  const listingsServer = readFileSync(
    join(__dirname, "../app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts"),
    "utf8",
  );
  assert.ok(listingsServer.includes("fetchServiciosUserLikedCountsByKeys"), "servicios: user_liked row counts for cards");
  assert.ok(
    listingsServer.includes("return fetchServiciosUserLikedCountsByKeys(listingKeys)"),
    "servicios: public like counts use user_liked_listings only",
  );
  assert.ok(listingsServer.includes("fetchServiciosUserSavedCountsByKeys"), "servicios: saved_listings row counts (admin)");
  assert.ok(listingsServer.includes('.from("saved_listings")'), "servicios: aggregate saves from saved_listings");

  const slugPage = readFileSync(join(__dirname, "../app/(site)/clasificados/servicios/[slug]/page.tsx"), "utf8");
  assert.ok(slugPage.includes("fetchServiciosNetLikeCountsByEngagementKeys"), "slug page: SSR like count fetch");
  assert.ok(slugPage.includes("publicLikeCount"), "slug page: passes count to profile view");

  const grants = readFileSync(join(__dirname, "../supabase/migrations/20260508160000_engagement_liked_saved_grants.sql"), "utf8");
  assert.ok(
    grants.includes("user_liked_listings") && grants.includes("user_saved_listings") && grants.includes("authenticated"),
    "sql: grants for engagement tables",
  );

  const ownerKeysSrc = readFileSync(join(__dirname, "../app/lib/ownerEngagementListingKeys.ts"), "utf8");
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
  assert.ok(likeBtn.includes("logEngagementWriteFailure"), "like: dev structured write-failure log");

  const saveBtn = readFileSync(join(__dirname, "../app/components/clasificados/analytics/LeonixSaveButton.tsx"), "utf8");
  assert.ok(saveBtn.includes("getBrowserAuthUserForEngagement"), "save: uses shared engagement auth");
  assert.ok(saveBtn.includes("engagementNeedAuthMsg"), "save: explicit need-auth copy before login redirect");
  assert.ok(saveBtn.includes("engagementWriteFailedMsg"), "save: DB failure copy distinct from auth");
  assert.ok(!saveBtn.includes("setIsSaved(initialSaved)"), "save: do not reset from initialSaved effect");
  assert.ok(saveBtn.includes("logEngagementWriteFailure"), "save: dev structured write-failure log");
  assert.ok(saveBtn.includes("savedDashboard"), "save: dashboard confirmation copy");
  assert.ok(saveBtn.includes("data-leonix-save-dashboard-hint"), "save: hint marker for QA");
  assert.ok(saveBtn.includes("FaBookmark"), "save: solid bookmark when active");
  assert.ok(saveBtn.includes("upsertSavedListingForUser"), "save: runtime upsert helper");
  assert.ok(saveBtn.includes("readSavedListingForUser"), "save: runtime read helper");

  const heroSrc = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosHero.tsx"), "utf8");
  assert.ok(heroSrc.includes("data-servicios-hero-like-cue"), "hero: like social-proof marker");
  assert.ok(heroSrc.includes("♡ Me gusta") && heroSrc.includes("♡ Like"), "hero: zero-state copy ES/EN");

  const guardados = readFileSync(join(__dirname, "../app/(site)/dashboard/guardados/page.tsx"), "utf8");
  assert.ok(guardados.includes("listSavedListingIdsForUser"), "guardados: reads saved listings via runtime helper");

  const saveRuntime = readFileSync(join(__dirname, "../app/lib/savedListingsRuntime.ts"), "utf8");
  assert.ok(saveRuntime.includes("saved_listings") && saveRuntime.includes("user_saved_listings"), "save runtime: canonical + legacy fallback");

  const ownerEngagementApi = readFileSync(join(__dirname, "../app/api/dashboard/owner-engagement/route.ts"), "utf8");
  assert.ok(ownerEngagementApi.includes("fetchOwnerEngagementRollupsServer"), "dashboard API: server engagement rollups");

  const likeCluster = readFileSync(
    join(__dirname, "../app/(site)/servicios/components/ServiciosLikeEngagementCluster.tsx"),
    "utf8",
  );
  assert.ok(likeCluster.includes("data-servicios-like-cluster"), "profile: connected like + count cluster");

  const adminServicios = readFileSync(
    join(__dirname, "../app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx"),
    "utf8",
  );
  assert.ok(adminServicios.includes("fetchServiciosUserSavedCountsByKeys"), "admin: save counts from saved_listings");
  assert.ok(adminServicios.includes("serviciosAdminEngagementByRowId"), "admin: per-row engagement rollup");

  const profileView = readFileSync(join(__dirname, "../app/(site)/servicios/components/ServiciosProfileView.tsx"), "utf8");
  assert.ok(profileView.includes("data-servicios-results-cta"), "profile: results CTA marker");
  assert.ok(profileView.includes("Ver resultados de Servicios"));
  assert.ok(profileView.includes("publicLikeCount"), "profile: forwards SSR like count to hero");

  const resultCard = readFileSync(
    join(__dirname, "../app/(site)/clasificados/servicios/components/ServiciosHorizontalResultCard.tsx"),
    "utf8",
  );
  assert.ok(resultCard.includes("data-servicios-like-badge"), "card: like badge marker");
  assert.ok(resultCard.includes("public_like_net_count"));
  assert.ok(resultCard.includes("♡ Me gusta") && resultCard.includes("♡ Like"), "card: zero-state copy ES/EN");

  const proResultCard = readFileSync(
    join(__dirname, "../app/(site)/clasificados/servicios/ServiciosProfessionalResultCard.tsx"),
    "utf8",
  );
  assert.ok(proResultCard.includes("data-servicios-like-badge"), "professional card: like badge");
  assert.ok(proResultCard.includes("public_like_net_count"), "professional card: persisted like count");

  const dashServicios = readFileSync(join(__dirname, "../app/(site)/dashboard/servicios/page.tsx"), "utf8");
  assert.ok(dashServicios.includes("ServiciosListingMetricsPills"), "dashboard servicios: per-ad metrics pills");
  assert.ok(dashServicios.includes("fetchOwnerEngagementDashboard"), "dashboard servicios: owner engagement API");

  console.log("servicios-engagement-smoke: OK");
}

main();
