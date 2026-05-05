/**
 * Focused smoke: preview publish readiness audit (client gate matches canonical draft).
 * Run: npx tsx scripts/restaurante-preview-readiness-smoke.ts
 */
import assert from "node:assert/strict";
import { mergeRestauranteDraft } from "../app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import {
  auditRestaurantePublishReadiness,
  auditRestaurantePublishMediaReadinessSafe,
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

const sampleHttpsImage =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=70";

function baseComplete(overrides: Record<string, unknown> = {}) {
  return mergeRestauranteDraft({
    businessName: "Smoke Taqueria",
    businessType: "food_truck",
    primaryCuisine: "mexican",
    shortSummary: "Tacos de prueba para humo de readiness.",
    cityCanonical: "San Jose",
    heroImage: sampleHttpsImage,
    galleryImages: [],
    phoneNumber: "+14085550100",
    ...weekOpen,
    ...overrides,
  });
}

function main() {
  // 1. First gallery image only (no hero) — must be ready
  const galleryOnly = baseComplete({
    heroImage: "",
    galleryImages: [sampleHttpsImage],
  });
  const a1 = auditRestaurantePublishReadiness(galleryOnly);
  assert.equal(a1.readyToPublish, true, "gallery-only complete draft should publish");
  assert.equal(a1.hasHeroImage, false);
  assert.equal(a1.hasFirstGalleryImage, true);
  assert.equal(a1.hasAnyPublishImage, true);
  assert.ok(satisfiesRestauranteMinimumValidPreview(galleryOnly));

  // 2. Hero image — must be ready
  const heroOnly = baseComplete({ heroImage: sampleHttpsImage, galleryImages: [] });
  const a2 = auditRestaurantePublishReadiness(heroOnly);
  assert.equal(a2.readyToPublish, true);
  assert.equal(a2.hasHeroImage, true);
  assert.ok(satisfiesRestauranteMinimumValidPreview(heroOnly));

  // 3. Empty / pristine-shaped incomplete
  const empty = mergeRestauranteDraft({});
  const a3 = auditRestaurantePublishReadiness(empty);
  assert.equal(a3.readyToPublish, false);
  assert.ok(a3.missingFields.length >= 3);
  assert.ok(!satisfiesRestauranteMinimumValidPreview(empty));

  // 4. Precise missing field naming
  const noCity = baseComplete({ cityCanonical: "" });
  const a4 = auditRestaurantePublishReadiness(noCity);
  assert.equal(a4.readyToPublish, false);
  assert.ok(a4.missingFields.includes("ciudad"));
  assert.ok(!a4.missingFields.includes("nombre"));

  // 5. satisfies === audit.readyToPublish (no drift)
  const samples = [galleryOnly, heroOnly, empty, noCity, baseComplete({ phoneNumber: "", websiteUrl: "https://example.com" })];
  for (const s of samples) {
    assert.equal(
      satisfiesRestauranteMinimumValidPreview(s),
      auditRestaurantePublishReadiness(s).readyToPublish,
      "satisfies and audit must agree",
    );
  }

  // 6. Website-only contact path
  const webOnly = baseComplete({ phoneNumber: "", websiteUrl: "https://example.com" });
  const a6 = auditRestaurantePublishReadiness(webOnly);
  assert.equal(a6.hasContactPath, true);
  assert.equal(a6.readyToPublish, true);

  // 7. Long https image ref (typical signed/CDN URL) — must count as publish image (not stripped by 1024-only sanitizer)
  const longHero = `https://example.com/${"x".repeat(1100)}`;
  assert.ok(longHero.length > 1024 && longHero.length < 2048, `longHero length ${longHero.length}`);
  const longHeroDraft = baseComplete({ heroImage: longHero, galleryImages: [] });
  assert.ok(hasRestauranteMinimumPublishImage(longHeroDraft));
  const mdLong = auditRestaurantePublishMediaReadinessSafe(longHeroDraft);
  assert.equal(mdLong.heroImageValueShape, "https");
  assert.equal(mdLong.hasAnyPublishImage, true);
  assert.ok(satisfiesRestauranteMinimumValidPreview(longHeroDraft));

  // 8. No hero / no gallery — image readiness false + missing field
  const noImg = baseComplete({ heroImage: "", galleryImages: [] });
  assert.equal(hasRestauranteMinimumPublishImage(noImg), false);
  const aNoImg = auditRestaurantePublishReadiness(noImg);
  assert.ok(aNoImg.missingFields.includes("imagen principal o primera de galería"));

  // 9. Safe media audit matches helper (API / preview alignment)
  assert.equal(
    auditRestaurantePublishMediaReadinessSafe(galleryOnly).hasAnyPublishImage,
    hasRestauranteMinimumPublishImage(galleryOnly),
  );

  console.log("restaurante-preview-readiness-smoke: OK");
}

main();
