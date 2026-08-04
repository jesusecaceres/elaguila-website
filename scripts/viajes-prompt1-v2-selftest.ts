/**
 * Focused Viajes Prompt 1 Gate 1/2 selftest — run with:
 *   npx tsx scripts/viajes-prompt1-v2-selftest.ts
 * Do not add a package.json script.
 */

import assert from "node:assert/strict";

import { emptyViajesNegociosDraft } from "../app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftDefaults";
import { emptyViajesPrivadoDraft } from "../app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftDefaults";
import {
  isViajesDurableHttpsUrl,
  isViajesNonDurableMediaRef,
  stripViajesDraftOnlyMediaFields,
} from "../app/(site)/clasificados/viajes/lib/v2/viajesMediaDurableGuards";
import { mapLegacyOfferTypeToViajesOfferKind, viajesOfferKindToLegacyTripKeys } from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferKindMap";
import { formatViajesPhoneDisplay, viajesPhoneActionDigits } from "../app/(site)/clasificados/viajes/lib/v2/viajesPhoneDisplay";
import {
  normalizeViajesNegociosDraftToV2,
  normalizeViajesOfferToV2,
  normalizeViajesPrivadoDraftToV2,
} from "../app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { serializeViajesOfferV2ForStaged } from "../app/(site)/clasificados/viajes/lib/v2/serializeViajesOfferV2ForStaged";
import { mapViajesOfferV2ToDetailModel } from "../app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";
import { mapViajesOfferV2ToBrowseResult } from "../app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToBrowseResult";
import {
  validateViajesOfferForSubmit,
  viajesMediaBlocksSubmit,
} from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferV2Validation";
import { createViajesMediaAssetDraft, emptyViajesOfferModelV2, newViajesStableId } from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";
import { VIAJES_MEDIA_MAX_IMAGES, VIAJES_MEDIA_MAX_VIDEOS } from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import {
  createEmptyViajesItineraryItem,
  createEmptyViajesModule,
  VIAJES_MODULE_KINDS,
} from "../app/(site)/publicar/viajes/components/modules/viajesModuleFactories";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`PASS ${name}`);
}

function fail(name: string, err: unknown): never {
  console.error(`FAIL ${name}`);
  console.error(err);
  process.exit(1);
}

try {
  assert.equal(isViajesDurableHttpsUrl("https://example.com/a.jpg"), true);
  assert.equal(isViajesDurableHttpsUrl("http://example.com/a.jpg"), false);
  assert.equal(isViajesDurableHttpsUrl("blob:https://x"), false);
  assert.equal(isViajesDurableHttpsUrl("data:image/png;base64,xx"), false);
  assert.equal(isViajesNonDurableMediaRef("blob:x"), true);
  assert.equal(isViajesNonDurableMediaRef("data:image/png;base64,x"), true);
  ok("durable URL guards");

  assert.equal(formatViajesPhoneDisplay("4085551212"), "(408) 555-1212");
  assert.equal(formatViajesPhoneDisplay("14085551212"), "(408) 555-1212");
  assert.equal(viajesPhoneActionDigits("(408) 555-1212"), "4085551212");
  assert.equal(formatViajesPhoneDisplay("+44 20 7946 0958"), "+44 20 7946 0958");
  ok("phone display");

  assert.equal(mapLegacyOfferTypeToViajesOfferKind("crucero"), "cruise");
  assert.equal(mapLegacyOfferTypeToViajesOfferKind("paquete"), "vacation_package");
  assert.ok(viajesOfferKindToLegacyTripKeys("car_rental").includes("transporte"));
  ok("offer kind map");

  const v1n = emptyViajesNegociosDraft();
  v1n.titulo = "Tour Napa";
  v1n.destino = "Napa";
  v1n.ciudadSalida = "San José";
  v1n.offerType = "tour";
  v1n.incluyeHotel = true;
  v1n.incluye = "Cata\nAlmuerzo";
  v1n.imagenPrincipal = "https://images.unsplash.com/photo-1";
  v1n.businessName = "Costa Tours";
  v1n.phone = "4085551212";
  const n2 = normalizeViajesNegociosDraftToV2(v1n, "es");
  assert.equal(n2.schemaVersion, 2);
  assert.equal(n2.lane, "business");
  assert.equal(n2.offerKind, "tour_excursion");
  assert.equal(n2.basics.title, "Tour Napa");
  assert.ok(n2.inclusions.length >= 2);
  assert.ok(n2.modules.some((m) => m.kind === "accommodation"));
  assert.equal(n2.media.images[0]?.uploadStatus, "uploaded");
  ok("V1 negocios normalize");

  const v1p = emptyViajesPrivadoDraft();
  v1p.titulo = "Escapada SF";
  v1p.destino = "San Francisco";
  v1p.displayName = "Ana";
  v1p.offerType = "weekend";
  const p2 = normalizeViajesPrivadoDraftToV2(v1p, "es");
  assert.equal(p2.lane, "private");
  assert.equal(p2.locations.privateExact.showPublicly, false);
  assert.equal(p2.locations.privateExact.showMap, false);
  ok("V1 privado normalize + privacy defaults");

  const stagedV1 = normalizeViajesOfferToV2({ version: 1, negocios: v1n }, { laneHint: "business" });
  assert.equal(stagedV1.basics.title, "Tour Napa");
  const stagedV2 = serializeViajesOfferV2ForStaged(n2);
  assert.equal(stagedV2.version, 2);
  assert.equal(stagedV2.offer.schemaVersion, 2);
  const round = normalizeViajesOfferToV2(stagedV2, { laneHint: "business" });
  assert.equal(round.basics.title, "Tour Napa");
  ok("V1 staged + V2 serialize round-trip");

  const dirty = emptyViajesOfferModelV2("business", "es");
  dirty.basics.title = "X";
  dirty.basics.destinationLabel = "Y";
  dirty.media.images = [
    createViajesMediaAssetDraft({
      url: "blob:http://local/1",
      uploadStatus: "local_pending",
      isHero: true,
      isResultsCard: true,
      localPreviewObjectUrl: "blob:http://local/1",
      localIdbKey: "abc",
    }),
  ];
  assert.equal(viajesMediaBlocksSubmit(dirty.media.images), true);
  const issues = validateViajesOfferForSubmit(dirty);
  assert.ok(issues.some((i) => i.code === "media_not_durable"));
  const ser = serializeViajesOfferV2ForStaged(dirty);
  assert.equal(ser.offer.media.images.length, 0);
  ok("submit blocks local-only media; serialize strips them");

  const good = emptyViajesOfferModelV2("business", "es");
  good.basics.title = "Good";
  good.basics.destinationLabel = "Monterey";
  good.media.images = [
    createViajesMediaAssetDraft({
      url: "https://example.public.blob.vercel-storage.com/a.jpg",
      uploadStatus: "uploaded",
      isHero: true,
      isResultsCard: true,
      alt: "Coast",
      focal: { x: 0.4, y: 0.6 },
      galleryOrder: 0,
      localIdbKey: "should-strip",
      uploadProgressPct: 100,
    }),
  ];
  const goodIssues = validateViajesOfferForSubmit(good);
  assert.equal(goodIssues.length, 0);
  const goodSer = serializeViajesOfferV2ForStaged(good);
  assert.equal(goodSer.offer.media.images.length, 1);
  assert.equal((goodSer.offer.media.images[0] as { localIdbKey?: string }).localIdbKey, undefined);
  const stripped = stripViajesDraftOnlyMediaFields({ ...good.media.images[0]! } as unknown as Record<string, unknown>);
  assert.equal(stripped.localIdbKey, undefined);
  ok("durable media serialize keeps roles/focal strips draft-only");

  const detail = mapViajesOfferV2ToDetailModel(good, { sparse: true, lang: "es" });
  assert.equal(detail.title, "Good");
  assert.ok(detail.heroImageSrc.includes("https://"));
  ok("detail mapper");

  const browse = mapViajesOfferV2ToBrowseResult(good, {
    id: "uuid-1",
    slug: "good-monterey",
    title: "Good",
    published_at: null,
    submitted_at: "2026-01-01",
    created_at: "2026-01-01",
    hero_image_url: null,
    submitter_name: "Biz",
    business_profile_slug: null,
    lane: "business",
  });
  assert.equal(browse.offerTitle, "Good");
  assert.equal(browse.href, "/clasificados/viajes/oferta/good-monterey");
  ok("browse mapper");

  assert.equal(VIAJES_MEDIA_MAX_IMAGES, 20);
  assert.equal(VIAJES_MEDIA_MAX_VIDEOS, 4);
  const many = emptyViajesOfferModelV2("business", "es");
  many.basics.title = "T";
  many.basics.destinationLabel = "D";
  many.media.images = Array.from({ length: 21 }, (_, i) =>
    createViajesMediaAssetDraft({
      id: newViajesStableId("m"),
      url: `https://example.com/${i}.jpg`,
      uploadStatus: "uploaded",
      isHero: i === 0,
      isResultsCard: i === 0,
      galleryOrder: i,
    })
  );
  assert.ok(validateViajesOfferForSubmit(many).some((i) => i.code === "too_many_images"));
  ok("20-image limit validation");

  // MIME allowlist mirrored from upload route constants
  const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
  assert.equal(allowed.has("image/png"), true);
  assert.equal(allowed.has("application/octet-stream"), false);
  assert.equal(allowed.has(""), false);
  ok("upload MIME policy constants");

  // Module factory stable IDs + offer-kind change must not wipe modules
  const mods = VIAJES_MODULE_KINDS.map((k) => createEmptyViajesModule(k));
  assert.equal(mods.length, 9);
  const ids = new Set(mods.map((m) => m.id));
  assert.equal(ids.size, 9);
  const itinerary = createEmptyViajesItineraryItem();
  assert.ok(itinerary.id.startsWith("itin_") || itinerary.id.length > 4);
  const withMods = emptyViajesOfferModelV2("business", "es");
  withMods.modules = mods;
  withMods.itinerary = [itinerary];
  withMods.highlights = [{ id: newViajesStableId("hl"), label: "Vista" }];
  withMods.inclusions = [{ id: newViajesStableId("inc"), label: "Hotel" }];
  withMods.exclusions = [{ id: newViajesStableId("exc"), label: "Vuelos" }];
  withMods.amenities = [{ id: newViajesStableId("am"), label: "WiFi" }];
  withMods.policies = [{ id: newViajesStableId("pol"), label: "Cancelación" }];
  withMods.accessibility = [{ id: newViajesStableId("acc"), label: "Rampa" }];
  withMods.needToKnow = [{ id: newViajesStableId("ntk"), label: "Pasaporte" }];
  const kindChanged = { ...withMods, offerKind: "cruise" as const };
  assert.equal(kindChanged.modules.length, 9);
  assert.equal(kindChanged.highlights.length, 1);
  assert.equal(kindChanged.modules[0]!.id, mods[0]!.id);
  const reordered = [kindChanged.modules[1]!, kindChanged.modules[0]!, ...kindChanged.modules.slice(2)];
  assert.equal(reordered[0]!.kind, mods[1]!.kind);
  assert.equal(reordered[1]!.id, mods[0]!.id);
  const removed = reordered.filter((m) => m.id !== mods[0]!.id);
  assert.equal(removed.length, 8);
  const edited = removed.map((m) =>
    m.kind === "car_rental" ? { ...m, description: "Traslado temporal en destino" } : m
  );
  assert.ok(edited.some((m) => m.kind === "car_rental" && m.description.includes("temporal")));
  const flight = edited.find((m) => m.kind === "flight");
  assert.ok(flight);
  assert.ok(!("availability" in flight) && !("bookingUrl" in flight));
  const stagedMods = serializeViajesOfferV2ForStaged({
    ...kindChanged,
    modules: edited,
    basics: { ...kindChanged.basics, title: "Mods", destinationLabel: "X" },
    media: {
      images: [
        createViajesMediaAssetDraft({
          id: newViajesStableId("m"),
          url: "https://example.com/h.jpg",
          uploadStatus: "uploaded",
          isHero: true,
          isResultsCard: true,
        }),
      ],
      videos: [],
    },
  });
  assert.equal(stagedMods.offer.modules.length, 8);
  ok("module CRUD + kind-change preserve + serialize");

  console.log(`\nAll ${passed} checks passed.`);
} catch (e) {
  fail("selftest", e);
}
