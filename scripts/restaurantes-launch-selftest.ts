/**
 * Restaurantes launch proof: discovery filters + optional Supabase insert/list/delete (service role).
 * Run: npx tsx scripts/restaurantes-launch-selftest.ts
 *      npx tsx scripts/restaurantes-launch-selftest.ts -- --logic-only   (skip Supabase round-trip)
 *
 * Requires for DB phase: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (loads `.env.local` when present so local `npx tsx` picks up the same vars as `next dev`.)
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnvLocal(): void {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split(/\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const eq = s.indexOf("=");
    if (eq <= 0) continue;
    const k = s.slice(0, eq).trim();
    let v = s.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
loadDotEnvLocal();

import { mergeRestauranteDraft } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { satisfiesRestauranteMinimumValidPreview, satisfiesRestauranteServiceModes } from "../app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestauranteDaySchedule } from "../app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel";
import { draftToRestaurantePublicListingInsert } from "../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import { filterRestaurantesBlueprintRows, foldRestaurantesDiscoverySearchText, sortRestaurantesBlueprintRows } from "../app/(site)/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
import {
  aggregateRestauranteLikeAnalyticsEvents,
  applyRestauranteLikeCountsToBlueprintRows,
  normalizeRestaurantesListingAnalyticsKey,
  normalizedRestauranteListingAnalyticsTargets,
  restaurantesEngagementListingKey,
} from "../app/(site)/clasificados/restaurantes/lib/restaurantesListingEngagement";
import { mapRestaurantesPublicListingDbRowToShellInventoryRow } from "../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import type { RestaurantesPublicListingDbRow } from "../app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { defaultRestaurantesDiscoveryState } from "../app/(site)/clasificados/restaurantes/lib/restaurantesDiscoveryContract";

function openDay(): RestauranteDaySchedule {
  return {
    closed: false,
    openTime: "09:00",
    closeTime: "17:00",
  };
}

function buildSelftestDraft(slugSuffix: string) {
  const hero =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=70";
  return mergeRestauranteDraft({
    draftListingId: `e2e-selftest-${slugSuffix}`,
    businessName: `Leonix E2E Rest ${slugSuffix}`,
    businessType: "sit_down",
    primaryCuisine: "mexican",
    shortSummary: "Selftest listing for launch verification.",
    cityCanonical: "San Francisco",
    zipCode: "94103",
    neighborhood: "Mission",
    serviceModes: ["dine_in"],
    languagesSpoken: ["es", "en"],
    restaurantAmenities: {
      payments: ["cash", "credit_cards"],
      atmosphere: ["casual"],
      accessibility: ["wheelchair_accessible"],
      amenities: ["wifi"],
      foodOptions: ["vegan_options"],
    },
    websiteUrl: "https://example.com",
    whatsAppNumber: "14155550199",
    menuUrl: "https://example.com/menu",
    instagramUrl: "https://instagram.com/example",
    heroImage: hero,
    phoneNumber: "+14155550199",
    monday: openDay(),
    tuesday: openDay(),
    wednesday: openDay(),
    thursday: openDay(),
    friday: openDay(),
    saturday: openDay(),
    sunday: openDay(),
  });
}

function mainLogicOnly() {
  const draft = buildSelftestDraft("logic");
  assert.ok(satisfiesRestauranteServiceModes(draft.serviceModes));
  assert.ok(satisfiesRestauranteMinimumValidPreview(draft));

  const slug = `leonix-e2e-rest-logic-${Date.now()}`;
  const insert = draftToRestaurantePublicListingInsert(draft, slug, {
    ownerUserId: null,
    promoted: false,
    packageTier: "free",
  });
  assert.equal(insert.promoted, false);
  assert.equal(insert.package_tier, "free");

  const fakeRow: RestaurantesPublicListingDbRow = {
    id: "00000000-0000-4000-8000-000000000001",
    slug,
    leonix_ad_id: "REST-2099-000099",
    owner_user_id: null,
    draft_listing_id: draft.draftListingId,
    status: "published",
    package_tier: "free",
    leonix_verified: false,
    promoted: false,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_name: String(insert.business_name),
    city_canonical: "San Francisco",
    zip_code: "94103",
    neighborhood: "Mission",
    primary_cuisine: "mexican",
    secondary_cuisine: null,
    business_type: "sit_down",
    price_level: "$$",
    service_modes: draft.serviceModes,
    moving_vendor: false,
    home_based_business: true,
    food_truck: false,
    pop_up: false,
    highlights: [],
    summary_short: "Selftest",
    hero_image_url: String(insert.hero_image_url),
    external_rating_value: 4.2,
    external_review_count: 10,
    listing_json: draft,
  };

  const shell = mapRestaurantesPublicListingDbRowToShellInventoryRow(fakeRow);
  assert.ok(shell.name.includes("Leonix E2E"));

  const state = {
    ...defaultRestaurantesDiscoveryState("es"),
    q: "Leonix E2E",
    city: "San Francisco",
    neighborhoodQuery: "Mission",
    pay: ["cash"],
    acc: ["wheelchair_accessible"],
    amen: ["wifi"],
    food: ["vegan_options"],
    spoken: ["es"],
    menuOnly: true,
    socialOnly: true,
    websiteOnly: true,
    whatsappOnly: true,
  };
  const filtered = filterRestaurantesBlueprintRows([shell], state);
  assert.ok(filtered.some((r) => r.id === shell.id), "q + city + nbh filters should keep row");

  const sorted = sortRestaurantesBlueprintRows([shell], "newest");
  assert.equal(sorted[0]?.id, shell.id);

  const defaultFiltered = filterRestaurantesBlueprintRows([shell], defaultRestaurantesDiscoveryState("es"));
  assert.equal(defaultFiltered.length, 1, "default discovery state must not hide rows without URL filters");

  assert.equal(foldRestaurantesDiscoverySearchText("San José"), foldRestaurantesDiscoverySearchText("San Jose"));
  const shellChuy = {
    ...shell,
    id: "00000000-0000-4000-8000-000000000002",
    name: "Chuy's Tacos",
    slug: "chuys-tacos",
    leonixAdId: "REST-2026-000001",
  };
  assert.ok(
    filterRestaurantesBlueprintRows([shellChuy], { ...defaultRestaurantesDiscoveryState("es"), q: "Chuys" }).length === 1,
    "q should match business name across apostrophe normalization",
  );
  assert.ok(
    filterRestaurantesBlueprintRows([shellChuy], { ...defaultRestaurantesDiscoveryState("es"), q: "REST-2026-000001" }).length === 1,
    "q should match leonix ad id",
  );

  const sparseRow: RestaurantesPublicListingDbRow = {
    ...fakeRow,
    id: "00000000-0000-4000-8000-000000000003",
    slug: "sparse-shell-map",
    listing_json: {},
    business_name: "Sparse Taqueria",
    city_canonical: "San Jose",
    primary_cuisine: "",
    secondary_cuisine: null,
    summary_short: null,
    hero_image_url: null,
    service_modes: [],
    highlights: [],
  };
  const sparseShell = mapRestaurantesPublicListingDbRowToShellInventoryRow(sparseRow);
  assert.equal(sparseShell.name, "Sparse Taqueria");
  assert.ok(filterRestaurantesBlueprintRows([sparseShell], defaultRestaurantesDiscoveryState("es")).length === 1);

  assert.equal(restaurantesEngagementListingKey({ id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", leonix_ad_id: "REST-2026-000001" }), "REST-2026-000001");
  assert.equal(restaurantesEngagementListingKey({ id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", leonix_ad_id: null }), "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

  assert.equal(normalizeRestaurantesListingAnalyticsKey("rest-2099-000099"), "REST-2099-000099");
  assert.equal(
    normalizeRestaurantesListingAnalyticsKey("550E8400-E29B-41D4-A716-446655440000"),
    "550e8400-e29b-41d4-a716-446655440000",
  );

  const likeEvents = [
    { listing_id: "rest-2099-000099", event_type: "listing_like" },
    { listing_id: "REST-2099-000099", event_type: "listing_like" },
    { listing_id: "REST-2099-000099", event_type: "listing_unlike" },
  ];
  const targets = normalizedRestauranteListingAnalyticsTargets([{ id: fakeRow.id, leonix_ad_id: "REST-2099-000099" }]);
  const netMap = aggregateRestauranteLikeAnalyticsEvents(likeEvents, targets);
  assert.equal(netMap.get("REST-2099-000099"), 1);
  const withLikes = applyRestauranteLikeCountsToBlueprintRows([shell], netMap);
  assert.equal(withLikes[0]?.likesCount, 1);
  const noLikes = applyRestauranteLikeCountsToBlueprintRows([shell], new Map());
  assert.equal(noLikes[0]?.likesCount, undefined);
}

async function mainDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for DB phase");
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const suffix = `${Date.now()}`;
  const draft = buildSelftestDraft(suffix);
  const slug = `leonix-e2e-rest-${suffix}`;
  const row = draftToRestaurantePublicListingInsert(draft, slug, {
    ownerUserId: null,
    promoted: false,
    packageTier: "standard",
  });
  const now = new Date().toISOString();
  const { allocateNextRestauranteLeonixAdId } = await import(
    "../app/(site)/clasificados/restaurantes/lib/restaurantesLeonixAdId"
  );
  const leonix_ad_id = await allocateNextRestauranteLeonixAdId(supabase);

  const { data: inserted, error: insErr } = await supabase
    .from("restaurantes_public_listings")
    .insert({ ...row, leonix_ad_id, published_at: now, updated_at: now })
    .select("id")
    .single();
  if (insErr || !inserted?.id) throw new Error(`insert_failed: ${insErr?.message ?? "no id"}`);

  const { data: readBack, error: readErr } = await supabase
    .from("restaurantes_public_listings")
    .select("id, slug, package_tier, updated_at, listing_json")
    .eq("id", inserted.id)
    .maybeSingle();
  if (readErr || !readBack) throw new Error(`read_failed: ${readErr?.message ?? "null"}`);
  assert.equal(readBack.slug, slug);
  assert.equal(readBack.package_tier, "standard");

  const { error: upErr } = await supabase
    .from("restaurantes_public_listings")
    .update({ updated_at: new Date().toISOString(), summary_short: "Updated selftest" })
    .eq("id", inserted.id);
  if (upErr) throw new Error(`update_failed: ${upErr.message}`);

  const { error: delErr } = await supabase.from("restaurantes_public_listings").delete().eq("id", inserted.id);
  if (delErr) throw new Error(`delete_failed: ${delErr.message}`);
}

function wantsLogicOnly(): boolean {
  const argv = process.argv.slice(2);
  return argv.includes("--logic-only") || argv.includes("--logicOnly");
}

async function main() {
  mainLogicOnly();
  if (wantsLogicOnly()) {
    console.log("restaurantes-launch-selftest: OK (logic only; DB phase skipped — run without --logic-only for Supabase round-trip)");
    return;
  }
  await mainDb();
  console.log("restaurantes-launch-selftest: OK (logic + Supabase round-trip)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
