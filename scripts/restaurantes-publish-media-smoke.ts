/**
 * Publish media path: merge coercion, transport vs draft gates, sanitizer, API-style validation.
 * Run: npx tsx scripts/restaurantes-publish-media-smoke.ts
 *
 * Answers (see assertions + comments):
 * 1–2. Browser draft uses string[] gallery + string hero (objects coerced in mergeRestauranteDraft).
 * 3–6. Kinds/lengths: see classify helpers + tests below.
 * 7–8. buildRestaurantePublishPayload strips data:/blob:; API validates merged sanitized body (transport-only images).
 * 9. Preview/card uses shell from draft strings; validator uses same merged draft shape, not shell.
 */
import assert from "node:assert/strict";
import { mergeRestauranteDraft, coerceRestauranteImageRefToString } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { buildRestaurantePublishPayload } from "../app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload";
import { buildRestaurantePublish422MediaAudit } from "../app/(site)/clasificados/restaurantes/application/restaurantePublishMediaAudit";
import {
  hasRestauranteMinimumPublishImage,
  satisfiesRestauranteMinimumValidPreview,
  type RestauranteDaySchedule,
} from "../app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel";

function openDay(): RestauranteDaySchedule {
  return { closed: false, openTime: "09:00", closeTime: "17:00" };
}

const weekOpen = {
  monday: openDay(),
  tuesday: openDay(),
  wednesday: openDay(),
  thursday: openDay(),
  friday: openDay(),
  saturday: openDay(),
  sunday: openDay(),
} as const;

const u = "https://example.com/image.jpg";
const tinyData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function baseComplete(overrides: Record<string, unknown> = {}) {
  return mergeRestauranteDraft({
    businessName: "Media Smoke Taqueria",
    businessType: "food_truck",
    primaryCuisine: "mexican",
    shortSummary: "Publish media smoke.",
    cityCanonical: "San Jose",
    phoneNumber: "+14085550100",
    ...weekOpen,
    ...overrides,
  });
}

function main() {
  // 1–2. Hero HTTPS, no gallery: transport readiness + API gate OK; survives sanitizer
  const t1 = baseComplete({ heroImage: u, galleryImages: [] });
  assert.equal(hasRestauranteMinimumPublishImage(t1, "transport"), true);
  const p1 = buildRestaurantePublishPayload(t1, undefined, "free", "es");
  const r1 = mergeRestauranteDraft(p1);
  assert.equal(hasRestauranteMinimumPublishImage(r1, "transport"), true);
  assert.ok(satisfiesRestauranteMinimumValidPreview(t1));

  // 2b. No hero, gallery HTTPS string
  const t2 = baseComplete({ heroImage: "", galleryImages: [u] });
  assert.equal(hasRestauranteMinimumPublishImage(t2, "transport"), true);
  const p2 = buildRestaurantePublishPayload(t2, undefined, "free", "es");
  assert.equal(hasRestauranteMinimumPublishImage(mergeRestauranteDraft(p2), "transport"), true);

  // 3. Object-shaped gallery entries (realistic JSON) → merge coerces to strings → transport OK
  const rawObj = {
    ...baseComplete({ heroImage: "", galleryImages: [] }),
    galleryImages: [{ url: u }],
  };
  const t3 = mergeRestauranteDraft(rawObj);
  const t3g = t3.galleryImages;
  assert.ok(t3g && t3g.length > 0);
  assert.equal(t3g[0], u);
  assert.equal(hasRestauranteMinimumPublishImage(t3, "transport"), true);
  for (const key of ["src", "image"] as const) {
    const m = mergeRestauranteDraft({
      ...baseComplete({ heroImage: "", galleryImages: [] }),
      galleryImages: [{ [key]: u }],
    });
    const mg = m.galleryImages;
    assert.ok(mg && mg.length > 0);
    assert.equal(mg[0], u);
  }

  assert.equal(coerceRestauranteImageRefToString({ publicUrl: u }), u);

  // 4. Long HTTPS URLs
  const mid = `https://example.com/${"x".repeat(1200)}`;
  assert.ok(mid.length > 1024 && mid.length < 2048);
  const t4a = baseComplete({ heroImage: mid });
  assert.equal(hasRestauranteMinimumPublishImage(t4a, "transport"), true);
  const t4b = baseComplete({ heroImage: `${u}${"y".repeat(2200)}` });
  assert.equal(hasRestauranteMinimumPublishImage(t4b, "transport"), false, ">2048 https must not count as publishable");

  // 5. data: stripped from payload → transport false after round-trip
  const t5 = baseComplete({ heroImage: tinyData });
  assert.equal(hasRestauranteMinimumPublishImage(t5, "draft"), true);
  assert.equal(hasRestauranteMinimumPublishImage(t5, "transport"), false);
  const p5 = buildRestaurantePublishPayload(t5, undefined, "free", "es");
  assert.ok(!p5.heroImage || p5.heroImage === undefined);
  assert.equal(hasRestauranteMinimumPublishImage(mergeRestauranteDraft(p5), "transport"), false);

  // 6. Empty draft: image missing
  const empty = mergeRestauranteDraft({});
  assert.equal(hasRestauranteMinimumPublishImage(empty, "transport"), false);

  // 7. Full fixture
  const full = baseComplete({ heroImage: u, galleryImages: [u] });
  assert.ok(satisfiesRestauranteMinimumValidPreview(full));

  // 8. mediaAudit helper (no URLs in output — spot-check structure)
  const b = buildRestaurantePublishPayload(full, undefined, "free", "es") as Record<string, unknown>;
  const mergedFromBody = mergeRestauranteDraft(b);
  const audit = buildRestaurantePublish422MediaAudit(b, mergedFromBody);
  assert.equal(typeof audit.requestDraftHeroImageLength, "number");
  assert.equal(audit.hasRestauranteMinimumPublishImageAfterSanitize, true);

  console.log("restaurantes-publish-media-smoke: OK");
}

main();
