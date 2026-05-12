/**
 * Ensures Servicios public DB read contract matches migrated `servicios_public_listings`
 * (incl. `leonix_ad_id`, `id` for engagement + footnote).
 * Run: npx tsx scripts/servicios-public-listing-schema-smoke.ts
 */
import assert from "node:assert/strict";
import {
  compareServiciosPublicDiscoveryNewestFirst,
  serviciosPublicListingDiscoverySortMs,
  SERVICIOS_PUBLIC_LISTING_SELECT,
  serviciosEngagementListingKey,
  serviciosPublicFooterLeonixAdId,
} from "../app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";

function main() {
  assert.ok(SERVICIOS_PUBLIC_LISTING_SELECT.includes("leonix_ad_id"), "public select must include leonix_ad_id");
  assert.ok(SERVICIOS_PUBLIC_LISTING_SELECT.includes("id"), "public select must include id");
  assert.ok(!SERVICIOS_PUBLIC_LISTING_SELECT.includes("created_at"), "public select must not reference created_at");
  assert.ok(!SERVICIOS_PUBLIC_LISTING_SELECT.includes("republish_sort_at"), "public select must not reference republish_sort_at");

  assert.equal(
    serviciosEngagementListingKey({ leonix_ad_id: "SERV-2026-000001", id: "uuid-here", slug: "acme" }),
    "SERV-2026-000001",
  );
  assert.equal(serviciosEngagementListingKey({ leonix_ad_id: "", id: "row-uuid", slug: "acme" }), "row-uuid");
  assert.equal(serviciosEngagementListingKey({ slug: "acme" }), "acme");

  assert.equal(serviciosPublicFooterLeonixAdId("SERV-2026-000001"), "SERV-2026-000001");
  assert.equal(serviciosPublicFooterLeonixAdId("550e8400-e29b-41d4-a716-446655440000"), null);
  assert.equal(serviciosPublicFooterLeonixAdId(null), null);

  const a = { slug: "a", published_at: "2020-01-01T00:00:00.000Z", updated_at: "2024-01-01T00:00:00.000Z" };
  const b = { slug: "b", published_at: "2024-01-01T00:00:00.000Z", updated_at: "2020-01-01T00:00:00.000Z" };
  assert.ok(serviciosPublicListingDiscoverySortMs(b) > serviciosPublicListingDiscoverySortMs(a), "sort prefers newer coalesce timestamp");

  const newerRep = {
    slug: "c",
    published_at: "2010-01-01T00:00:00.000Z",
    updated_at: "2011-01-01T00:00:00.000Z",
    republished_at: "2025-01-01T00:00:00.000Z",
  };
  assert.ok(
    serviciosPublicListingDiscoverySortMs(newerRep) > serviciosPublicListingDiscoverySortMs(b),
    "republished_at wins when present",
  );

  assert.ok(compareServiciosPublicDiscoveryNewestFirst(a, b) > 0, "b should sort before a when b coalesce timestamp is newer");

  console.log("servicios-public-listing-schema-smoke: OK");
}

main();
