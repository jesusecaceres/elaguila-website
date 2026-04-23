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
import { filterRestaurantesBlueprintRows, sortRestaurantesBlueprintRows } from "../app/(site)/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
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

  const state = { ...defaultRestaurantesDiscoveryState("es"), q: "Leonix E2E", city: "San Francisco", neighborhoodQuery: "Mission" };
  const filtered = filterRestaurantesBlueprintRows([shell], state);
  assert.ok(filtered.some((r) => r.id === shell.id), "q + city + nbh filters should keep row");

  const sorted = sortRestaurantesBlueprintRows([shell], "newest");
  assert.equal(sorted[0]?.id, shell.id);
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

  const { data: inserted, error: insErr } = await supabase
    .from("restaurantes_public_listings")
    .insert({ ...row, published_at: now, updated_at: now })
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
