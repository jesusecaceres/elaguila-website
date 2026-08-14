/**
 * Gate I.5.4A.1 — self-test for durable BR Privado seller-photo persistence.
 *
 * Proves: a `data:` seller photo is never embedded directly into `detail_pairs` by the preview
 * VM → detail-pairs mapper (any size — no more silent drop above a char cap); an already-hosted
 * `http(s)://` photo is embedded directly and survives the full publish → published-row → VM
 * round trip; old rows that still carry a small pre-gate `data:` URL in `detail_pairs` keep
 * rendering (read-path backward compatibility, no migration); the durable-upload wiring exists in
 * the shared publish core and both Privado draft builders (BR + Rentas, since they share the same
 * detail-pairs mapper); the dashboard edit page gates its seller-photo section to BR Privado rows
 * only and never touches the gallery `images` column; and no locked system (Stripe, webhooks,
 * lifecycle, entitlements, schema/migrations) is referenced by any of the changed files.
 *
 * No network, no React rendering, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-4a-1-br-privado-seller-photo-persistence-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { buildDetailPairsFromBienesRaicesPrivadoPreviewVm } from "../app/(site)/clasificados/lib/leonixRealEstateDetailPairsFromPreviewVm";
import { mapBrListingRowToPrivadoPreviewVm } from "../app/(site)/clasificados/bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm";
import type { BienesRaicesPrivadoPreviewVm } from "../app/(site)/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type { BienesLiveListingLike } from "../app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function fakeVm(overrides: Partial<BienesRaicesPrivadoPreviewVm> = {}): BienesRaicesPrivadoPreviewVm {
  return {
    categoria: "residencial",
    platformLogoUrl: "/logo.png",
    heroTitle: "Casa de prueba",
    addressLine: "Sacramento, CA",
    priceDisplay: "$450,000",
    listingStatusLabel: "Disponible",
    operationSummary: "Venta residencial",
    quickFacts: [],
    seller: {
      photoUrl: null,
      hasPhoto: false,
      name: "",
      byOwnerLabel: "",
      phoneDisplay: "",
      emailDisplay: "",
      whatsappDisplay: "",
      smsDisplay: "",
      noteLine: "",
    },
    media: {
      heroUrl: null,
      secondaryPhotoUrls: [],
      videoThumbUrls: [null, null],
      videoPlaybackUrls: [null, null],
      youtubeIds: [null, null],
      virtualTourUrl: null,
      floorPlanUrls: [],
      sitePlanUrl: null,
      metaLine: "",
      hasPhotos: false,
      hasVideo1: false,
      hasVideo2: false,
      hasVirtualTour: false,
      hasFloorPlans: false,
      hasSitePlan: false,
      photoCount: 0,
      heroCaption: null,
      allPhotoUrls: [],
      coverPhotoIndex: 0,
      photoCaptionsFull: [],
    },
    propertyDetailsRows: [],
    highlightsRows: [],
    hasHighlights: false,
    description: "",
    hasDescription: false,
    contactRailTitle: "Contacto",
    contact: {
      showSolicitarInfo: false,
      showLlamar: false,
      showWhatsapp: false,
      showSms: false,
      solicitarInfoHref: null,
      llamarHref: null,
      whatsappHref: null,
      smsHref: null,
      instructionsLine: "",
    },
    location: { mapsUrl: null, line1: "", cityStateZip: "", fullAddress: "", hasMeaningfulAddress: false },
    mostrarDireccionExacta: false,
    footerNote: "",
    ...overrides,
  };
}

async function main() {
  /* ---------------------------------------------------------------------------------------- *
   * 1 — a `data:` seller photo (small or huge) is never embedded directly by the detail-pairs
   * mapper. It must be deferred to the publish core's hosted upload, never silently dropped and
   * never persisted as raw base64.
   * ---------------------------------------------------------------------------------------- */
  {
    for (const photoUrl of ["data:image/jpeg;base64,AAAA", `data:image/jpeg;base64,${"A".repeat(200_000)}`]) {
      const vm = fakeVm({ seller: { ...fakeVm().seller, name: "Juan Pérez", photoUrl, hasPhoto: true } });
      const pairs = buildDetailPairsFromBienesRaicesPrivadoPreviewVm(vm);
      assert.ok(pairs.some((p) => p.label === "Vendedor" && p.value === "Juan Pérez"), "seller name must persist regardless of photo");
      assert.ok(!pairs.some((p) => p.label === "Foto del vendedor"), "a data: URL must never be embedded directly by this mapper");
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 2 — an already-hosted http(s) seller photo is embedded directly (no re-upload needed) and
   * survives the full VM → detail_pairs → published-row mapper → VM round trip.
   * ---------------------------------------------------------------------------------------- */
  {
    const hostedUrl = "https://xyzco.supabase.co/storage/v1/object/public/listing-images/owner-9/listing-9/seller-photo.jpg";
    const vm = fakeVm({ seller: { ...fakeVm().seller, name: "Ana Ruiz", photoUrl: hostedUrl, hasPhoto: true } });
    const pairs = buildDetailPairsFromBienesRaicesPrivadoPreviewVm(vm);
    assert.ok(pairs.some((p) => p.label === "Foto del vendedor" && p.value === hostedUrl), "hosted URL must be embedded directly");

    const fakeRow: BienesLiveListingLike = {
      id: "listing-9",
      title: { es: "Depa moderno", en: "Depa moderno" },
      priceLabel: { es: "$250,000", en: "$250,000" },
      city: "Roseville",
      blurb: { es: "", en: "" },
      images: [],
      owner_id: "owner-9",
      contact_phone: "9165551234",
      contact_email: "ana@example.com",
      detailPairs: pairs,
    };
    const publishedVm = mapBrListingRowToPrivadoPreviewVm(fakeRow, "es");
    assert.equal(publishedVm.seller.photoUrl, hostedUrl, "hosted seller photo must survive the full round trip");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 3 — backward compatibility: an old row published before this gate, whose `detail_pairs`
   * still carries a small pre-gate `data:` URL directly under "Foto del vendedor" (the interim
   * Gate I.5.4A behavior), must keep rendering. No destructive migration is required or run.
   * ---------------------------------------------------------------------------------------- */
  {
    const legacyDataUrl = "data:image/jpeg;base64,AAAA";
    const fakeRow: BienesLiveListingLike = {
      id: "listing-legacy",
      title: { es: "Casa antigua publicación", en: "Casa antigua publicación" },
      priceLabel: { es: "$300,000", en: "$300,000" },
      city: "Elk Grove",
      blurb: { es: "", en: "" },
      images: [],
      detailPairs: [
        { label: "Vendedor", value: "Legacy Seller" },
        { label: "Foto del vendedor", value: legacyDataUrl },
      ],
    };
    const publishedVm = mapBrListingRowToPrivadoPreviewVm(fakeRow, "es");
    assert.equal(publishedVm.seller.photoUrl, legacyDataUrl, "old small data: URL rows must keep rendering, unchanged");
    assert.equal(publishedVm.seller.hasPhoto, true);
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — durable upload wiring exists in the shared publish core: uploads to the same
   * `listing-images` bucket the gallery already uses, at an owner+listing-scoped path distinct
   * from the gallery's `/photos` folder, patches `detail_pairs` afterward, and never fails the
   * whole publish over a seller-photo hiccup (warning only).
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource("app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts");
    assert.ok(src.includes("sellerPhotoSource"), "core publish params must accept a sellerPhotoSource");
    assert.ok(src.includes("persistSellerPhotoIfNeeded"), "core must implement the seller-photo upload+patch step");
    assert.ok(/seller-photo\.\$\{ext\}/.test(src), "seller photo must upload to its own owner+listing-scoped path, not mixed into gallery numbering");
    assert.ok(src.includes('.from("listing-images")'), "must reuse the existing approved listing-images bucket, not a new one");
    assert.ok(src.includes('"Foto del vendedor"'), "must patch the same detail_pairs label the mapper and published reader already use");
    assert.ok(
      /raw\.startsWith\("data:"\)/.test(src),
      "must only attempt upload for a data: URL — an already-hosted URL is left untouched (no unnecessary re-upload)",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — both Privado draft builders that share `buildDetailPairsFromBienesRaicesPrivadoPreviewVm`
   * (BR Privado and Rentas Privado) must wire the same sellerPhotoSource through, or the shared
   * mapper change in test 1 would silently regress Rentas Privado's seller photo to "never
   * persisted" instead of the old size-capped behavior.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
    const occurrences = src.match(/sellerPhotoSource:\s*trim\(state\.seller\.fotoDataUrl\)/g) ?? [];
    assert.ok(occurrences.length >= 2, "both buildPublishParamsFromBienesRaicesPrivadoDraft and buildRentasPrivadoListingParams must wire sellerPhotoSource");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — the dashboard edit page's seller-photo section is gated to BR Privado rows only (never
   * Negocio, never other categories) and reads/writes detail_pairs, never the gallery `images`
   * column.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
    assert.ok(src.includes("isBrPrivadoListing"), "edit page must gate the seller-photo section to BR Privado rows");
    assert.ok(src.includes('seller_type ?? "").toLowerCase() === "personal"'), "gate must key off seller_type personal, not just category");
    assert.ok(src.includes("SELLER_PHOTO_DETAIL_LABEL"), "must read/write the same detail_pairs label as the publish pipeline");
    assert.ok(src.includes("readLeonixDetailPairValue"), "must hydrate from detail_pairs using the shared reader, not ad hoc parsing");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7 — the BR Privado application form rejects non-image files and oversized files up front
   * instead of letting an upload fail silently later.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource("app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx");
    assert.ok(src.includes("MAX_SELLER_PHOTO_BYTES"), "must enforce a reasonable seller-photo size limit");
    assert.ok(src.includes('f.type.startsWith("image/")'), "must reject non-image files for the seller photo");
    assert.ok(src.includes("sellerPhotoNotice"), "must surface a visible, actionable notice for rejected files");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 8 — no locked system touched: the *lines this gate actually added* (not pre-existing
   * comments elsewhere in files this gate had to touch, e.g. the existing `activationMode`
   * Stripe-lane doc comment in the core publish file) never reference payment, checkout,
   * webhook, lifecycle, entitlement, schema, or migration concerns.
   * ---------------------------------------------------------------------------------------- */
  {
    const files = [
      "app/(site)/clasificados/lib/leonixRealEstateDetailPairsFromPreviewVm.ts",
      "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts",
      "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
      "app/(site)/clasificados/bienes-raices/preview/privado/components/BienesRaicesPrivadoPreviewClient.tsx",
      "app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx",
      "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx",
    ];
    // Globalization Package A — files a later package is explicitly authorized to change are
    // skipped here (whole-file authorization with per-file justification lives in
    // scripts/globalizationCurrentPackageDiff.ts); this check keeps protecting every other file.
    const { GLOBALIZATION_CURRENT_PACKAGE_FILES } = await import("./globalizationCurrentPackageDiff");
    for (const f of files) {
      if (GLOBALIZATION_CURRENT_PACKAGE_FILES.has(f)) continue;
      let diff = "";
      try {
        diff = execFileSync("git", ["diff", "--unified=0", "HEAD", "--", f], { cwd: REPO_ROOT, encoding: "utf8" });
      } catch {
        diff = "";
      }
      const addedLines = diff
        .split("\n")
        .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
        .join("\n");
      assert.ok(
        !/stripe|checkout|webhook|entitlement|lifecycle|migrations\//i.test(addedLines),
        `${f}: lines added by this gate must not reference any locked system`,
      );
    }
  }

  console.log(`gate-i5-4a-1-br-privado-seller-photo-persistence-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
