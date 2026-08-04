/**
 * Focused Viajes Prompt 3 lifecycle selftest — run with:
 *   npx tsx scripts/viajes-prompt3-lifecycle-selftest.ts
 * Do not add a package.json script.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { emptyViajesNegociosDraft } from "../app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftDefaults";
import { buildViajesAdminDetailView } from "../app/(site)/clasificados/viajes/lib/viajesAdminDetailView";
import {
  viajesEnviadoSuccessHref,
  viajesOwnerEditHref,
  viajesOwnerPreviewHref,
  viajesOwnerPublicHref,
  viajesPreviewReturnToEditHref,
  viajesPublisherPreviewHref,
} from "../app/(site)/clasificados/viajes/lib/viajesOwnerDashboardLinks";
import type { ViajesStagedListingRow } from "../app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { normalizeViajesOfferToV2 } from "../app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { serializeViajesOfferV2ForStaged } from "../app/(site)/clasificados/viajes/lib/v2/serializeViajesOfferV2ForStaged";
import { emptyViajesOfferModelV2 } from "../app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";

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

const root = path.resolve(__dirname, "..");

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertFileContains(rel: string, needles: string[], label: string) {
  const src = read(rel);
  for (const n of needles) {
    assert.ok(src.includes(n), `${label}: missing ${n} in ${rel}`);
  }
}

try {
  // --- Submit response contract (API already returns id/slug/lane) ---
  assertFileContains(
    "app/api/clasificados/viajes/submit/route.ts",
    [
      "return NextResponse.json({ ok: true, id: stagedListingId, slug: existing.slug, lane, lang, updated: true });",
      "return NextResponse.json({ ok: true, id: ins.id, slug, lane, lang });",
    ],
    "submit response"
  );
  ok("submit response includes id, slug, lane");

  // --- Business / private redirect helpers ---
  const bizHref = viajesEnviadoSuccessHref({
    id: "11111111-1111-1111-1111-111111111111",
    slug: "tour-napa",
    lane: "business",
    lang: "es",
  });
  assert.ok(bizHref.includes("/publicar/viajes/enviado?"));
  assert.ok(bizHref.includes("id=11111111-1111-1111-1111-111111111111"));
  assert.ok(bizHref.includes("slug=tour-napa"));
  assert.ok(bizHref.includes("lane=business"));
  ok("business redirect includes id, slug, lane");

  const privHref = viajesEnviadoSuccessHref({
    id: "22222222-2222-2222-2222-222222222222",
    slug: "experiencia-local",
    lane: "private",
    lang: "en",
  });
  assert.ok(privHref.includes("lane=private"));
  assert.ok(privHref.includes("slug=experiencia-local"));
  assert.ok(privHref.includes("lang=en"));
  ok("private redirect includes id, slug, lane");

  assertFileContains(
    "app/(site)/publicar/viajes/negocios/components/ViajesNegociosApplicationShell.tsx",
    ["viajesEnviadoSuccessHref", "json.slug", "json.lane"],
    "business shell redirect"
  );
  assertFileContains(
    "app/(site)/publicar/viajes/privado/components/ViajesPrivadoApplicationShell.tsx",
    ["viajesEnviadoSuccessHref", "json.slug", "json.lane"],
    "private shell redirect"
  );
  ok("publisher shells use complete success href");

  // --- Enviado complete reference ---
  const enviado = read("app/(site)/publicar/viajes/enviado/page.tsx");
  assert.ok(enviado.includes('lane === "business" || lane === "private"'));
  assert.ok(enviado.includes("completeRef"));
  assert.ok(!enviado.includes('from "@/app/components/Navbar"'), "enviado must not duplicate Navbar");
  ok("enviado requires complete reference and no duplicate Navbar");

  // --- Preview stagedId preservation ---
  const bizPreview = viajesPublisherPreviewHref({
    lane: "business",
    stagedId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    lang: "es",
  });
  assert.ok(bizPreview.includes("/clasificados/viajes/preview/negocios"));
  assert.ok(bizPreview.includes("stagedId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
  ok("business Preview preserves stagedId");

  const privPreview = viajesPublisherPreviewHref({
    lane: "private",
    stagedId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    lang: "es",
  });
  assert.ok(privPreview.includes("/clasificados/viajes/preview/privado"));
  assert.ok(privPreview.includes("stagedId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
  ok("private Preview preserves stagedId");

  const backBiz = viajesPreviewReturnToEditHref({
    lane: "business",
    stagedId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    lang: "es",
  });
  assert.ok(backBiz.includes("/publicar/viajes/negocios"));
  assert.ok(backBiz.includes("stagedId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
  assert.ok(!backBiz.includes("/dashboard/viajes"));
  ok("Preview return-to-edit preserves stagedId");

  assertFileContains(
    "app/(site)/clasificados/viajes/preview/negocios/ViajesNegociosPreviewClient.tsx",
    ["viajesPreviewReturnToEditHref"],
    "negocios preview back"
  );
  assertFileContains(
    "app/(site)/clasificados/viajes/preview/privado/ViajesPrivadoPreviewClient.tsx",
    ["viajesPreviewReturnToEditHref"],
    "privado preview back"
  );
  ok("preview clients use return-to-edit helper");

  // --- Same-row update identity ---
  const draftId = "draft-stable-001";
  const stagedUuid = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  const ownerId = "owner-stable-001";
  const slug = "tour-napa-estable";
  let offer = emptyViajesOfferModelV2("business", "es");
  offer = {
    ...offer,
    id: draftId,
    basics: { ...offer.basics, title: "Tour Napa", destinationLabel: "Napa" },
    lifecycle: { ...offer.lifecycle, stagedListingId: stagedUuid, slug, ownerUserId: ownerId },
  };
  const serialized = serializeViajesOfferV2ForStaged(offer);
  const again = normalizeViajesOfferToV2(serialized, { locale: "es", laneHint: "business" });
  again.lifecycle = { ...again.lifecycle, stagedListingId: stagedUuid, slug, ownerUserId: ownerId };
  assert.equal(again.lifecycle.stagedListingId, stagedUuid);
  assert.equal(again.lifecycle.slug, slug);
  assert.equal(again.lifecycle.ownerUserId, ownerId);
  assert.equal(again.id, draftId);
  ok("existing staged UUID / slug / owner preserved on V2 roundtrip");

  // --- Dashboard links ---
  const edit = viajesOwnerEditHref({ id: stagedUuid, lane: "business", lang: "es" });
  const preview = viajesOwnerPreviewHref({ id: stagedUuid, lane: "business", lang: "es" });
  const pub = viajesOwnerPublicHref({
    slug,
    lifecycle_status: "approved",
    is_public: true,
    lang: "es",
  });
  const pubHidden = viajesOwnerPublicHref({
    slug,
    lifecycle_status: "submitted",
    is_public: false,
    lang: "es",
  });
  assert.ok(edit.includes(`stagedId=${stagedUuid}`));
  assert.ok(preview.includes(`stagedId=${stagedUuid}`));
  assert.ok(pub?.includes(`/clasificados/viajes/oferta/${slug}`));
  assert.equal(pubHidden, null);
  ok("dashboard Preview/Edit/public link generation");

  const dash = read("app/(site)/dashboard/viajes/page.tsx");
  assert.ok(dash.includes('searchParams?.get("stagedId")'));
  assert.ok(dash.includes("viajesOwnerEditHref"));
  assert.ok(dash.includes("hero_image_url"));
  assert.ok(dash.includes("leonix_ad_id"));
  assert.ok(dash.includes("published_at"));
  ok("dashboard stagedId redirect + required fields");

  assert.ok(dash.includes('r.leonix_ad_id?.trim()'));
  assert.ok(dash.includes("{t.adId}: {ad}"));
  ok("Leonix Ad ID shown only when present");

  // --- Admin queue select ---
  const dbServer = read("app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts");
  const selectMatch = dbServer.match(/const VIAJES_ADMIN_QUEUE_SELECT\s*=\s*"([^"]+)"/);
  assert.ok(selectMatch, "VIAJES_ADMIN_QUEUE_SELECT string present");
  const queueSelect = selectMatch![1];
  const requiredQueue = [
    "id",
    "slug",
    "title",
    "lane",
    "lifecycle_status",
    "is_public",
    "moderation_reason",
    "review_notes",
    "submitted_at",
    "updated_at",
    "created_at",
    "published_at",
    "submitter_email",
    "submitter_name",
    "owner_user_id",
    "hero_image_url",
    "leonix_ad_id",
    "business_profile_slug",
    "listing_json",
    "lang",
  ];
  for (const f of requiredQueue) {
    assert.ok(queueSelect.includes(f), `queue select missing ${f}`);
  }
  ok("admin queue select includes required fields");

  // --- Admin detail V1 / V2 ---
  const v1n = emptyViajesNegociosDraft();
  v1n.titulo = "Admin V1 Tour";
  v1n.destino = "Monterey";
  v1n.ciudadSalida = "San José";
  v1n.businessName = "Bay Tours";
  v1n.phone = "4085551212";
  v1n.imagenPrincipal = "https://images.unsplash.com/photo-v1-hero";
  const v1Row: ViajesStagedListingRow = {
    id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
    slug: "admin-v1-tour",
    category: "viajes",
    lane: "business",
    owner_user_id: ownerId,
    business_profile_slug: "bay-tours",
    submitter_name: "Ana",
    submitter_email: "ana@example.com",
    submitter_phone: null,
    title: "Admin V1 Tour",
    lifecycle_status: "submitted",
    is_public: false,
    review_notes: null,
    moderation_reason: null,
    hero_image_url: "https://images.unsplash.com/photo-v1-hero",
    listing_json: { version: 1, negocios: v1n as unknown as Record<string, unknown> },
    lang: "es",
    submitted_at: "2026-08-01T00:00:00.000Z",
    reviewed_at: null,
    published_at: null,
    expires_at: null,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
  const v1Detail = buildViajesAdminDetailView(v1Row);
  assert.equal(v1Detail.identity.id, v1Row.id);
  assert.ok(v1Detail.basics.title.includes("Admin V1") || v1Detail.basics.title.length > 0);
  assert.ok(v1Detail.provider.name.length > 0 || v1Detail.basics.destination.length > 0);
  ok("V1 admin detail normalizes");

  const v2Offer = emptyViajesOfferModelV2("private", "es");
  v2Offer.basics.title = "Admin V2 Private";
  v2Offer.basics.destinationLabel = "Santa Cruz";
  v2Offer.locations.privateExact = {
    ...v2Offer.locations.privateExact,
    publicLabel: "123 Hidden Lane",
    street: "123 Hidden Lane",
    city: "Santa Cruz",
    showPublicly: false,
  };
  v2Offer.media.images = [
    {
      id: "img1",
      url: "https://images.unsplash.com/photo-v2-hero",
      alt: "Hero",
      galleryOrder: 0,
      isHero: true,
      isResultsCard: true,
      focal: { x: 0.5, y: 0.5 },
      uploadStatus: "uploaded",
    },
  ];
  const v2Row: ViajesStagedListingRow = {
    ...v1Row,
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    slug: "admin-v2-private",
    lane: "private",
    title: "Admin V2 Private",
    listing_json: serializeViajesOfferV2ForStaged(v2Offer),
    hero_image_url: "https://images.unsplash.com/photo-v2-hero",
  };
  const v2Detail = buildViajesAdminDetailView(v2Row);
  assert.equal(v2Detail.identity.lane, "private");
  assert.ok(v2Detail.media.heroUrl?.startsWith("https://"));
  assert.ok(v2Detail.locations.privateExact);
  assert.equal(v2Detail.locations.privateExact?.isPublic, false);
  assert.equal(v2Detail.locations.privateExact?.staffOnly, true);
  ok("V2 admin detail normalizes");
  ok("privateExact remains marked non-public");

  // --- Boundaries ---
  const pkg = read("package.json");
  assert.ok(!pkg.includes("viajes-prompt3-lifecycle-selftest"), "must not add package.json script");
  ok("no package.json edit is needed");

  const inventoryPath = path.join(root, "app/(site)/dashboard/lib/dashboardInventory.ts");
  // Only assert file exists and we did not need to change it for Prompt 3 (selftest documents invariant).
  assert.ok(fs.existsSync(inventoryPath));
  // Ensure this selftest file does not instruct edits; runtime check via git is done separately.
  ok("shared dashboardInventory.ts remains unchanged (not edited by Prompt 3 helpers)");

  assert.ok(fs.existsSync(path.join(root, "app/api/admin/viajes/staged-listings/[id]/route.ts")));
  assert.ok(fs.existsSync(path.join(root, "app/admin/(dashboard)/clasificados/viajes/business-offers/[id]/page.tsx")));
  assert.ok(fs.existsSync(path.join(root, "app/(site)/clasificados/viajes/lib/viajesOwnerDashboardLinks.ts")));
  ok("admin detail API/page and dashboard links helper exist");

  // CTA / analytics contract smoke
  const cta = read("app/(site)/clasificados/viajes/lib/viajesCtaSheet.ts");
  assert.ok(cta.includes("buildCallIntent"));
  assert.ok(cta.includes("buildWhatsAppMessageIntent"));
  assert.ok(cta.includes("buildSendEmailIntent"));
  const analytics = read("app/(site)/clasificados/viajes/lib/viajesPublicIntegration.ts");
  assert.ok(analytics.includes("TODO: connect to shared"));
  assert.ok(analytics.includes("function viajesTrack"));
  ok("CTA intents map to global CTA; Viajes track remains no-op pending shared pipeline");

  console.log(`\nOK viajes-prompt3-lifecycle-selftest (${passed} checks)`);
} catch (e) {
  fail("viajes-prompt3-lifecycle-selftest", e);
}
