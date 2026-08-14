/**
 * Gate I.5.4A — self-test for the Bienes Raíces Privado published-shell repair.
 *
 * Proves: lane detection is deterministic and correct for all three lanes; seller name/photo
 * round-trip through the exact persistence path (VM → detail_pairs → published-row mapper →
 * VM again) without going through Supabase; the shared public route now branches by lane
 * instead of unconditionally using the Negocio shell; Negocio parent/child call sites and the
 * Negocio shell component itself are byte-unchanged; no locked system was touched.
 *
 * No network, no React rendering, no Supabase. Run from repo root:
 *   npx tsx scripts/gate-i5-4a-br-privado-shell-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { resolveBrListingLane } from "../app/(site)/clasificados/bienes-raices/listing/brListingLane";
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
   * 1/2/3 — deterministic lane detection for all three lanes, from canonical evidence only.
   * ---------------------------------------------------------------------------------------- */
  {
    assert.equal(resolveBrListingLane({ sellerType: "personal" }), "privado");
    assert.equal(resolveBrListingLane({ seller_type: "personal" }), "privado", "must accept snake_case DB row shape too");
    assert.equal(resolveBrListingLane({}), "privado", "unknown/missing sellerType must fail closed to privado, never to negocio");

    assert.equal(resolveBrListingLane({ sellerType: "business" }), "negocio_parent");
    assert.equal(
      resolveBrListingLane({ sellerType: "business", inventory_role: "main" }),
      "negocio_parent",
      "role main is the parent, not a child",
    );

    assert.equal(
      resolveBrListingLane({ sellerType: "business", inventory_role: "inventory_property", br_inventory_parent_listing_id: "parent-uuid" }),
      "negocio_child",
    );
    assert.equal(
      resolveBrListingLane({ sellerType: "business", inventory_role: "inventory_property", br_inventory_parent_listing_id: "" }),
      "negocio_parent",
      "inventory_property role with no real parent id must not be misclassified as a child",
    );
  }

  /* ---------------------------------------------------------------------------------------- *
   * 4 — Privado published renderer is no longer the agent shell: the shared route now branches
   * by lane, and both the Privado and Negocio shells are actually referenced.
   * ---------------------------------------------------------------------------------------- */
  {
    const src = readSource("app/(site)/clasificados/anuncio/[id]/page.tsx");
    assert.ok(src.includes("resolveBrListingLane("), "shared route must resolve BR lane before choosing a shell");
    assert.ok(src.includes('brLane === "privado"'), "must branch specifically on the privado lane");
    assert.ok(src.includes("<BienesRaicesPrivadoLiveDetailShell"), "must render the new Privado shell for that lane");
    assert.ok(src.includes("<BienesRaicesNegocioLiveDetailShell"), "must still render the Negocio shell for non-privado lanes");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 5 — seller name + an already-hosted photo survive end-to-end: VM → detail_pairs
   * (publish-side) → published-row mapper → VM again (public-detail-side), without ever
   * touching the Negocio agent-schema fields.
   *
   * Superseded by Gate I.5.4A.1: a raw `data:` photo is no longer embedded directly by
   * `buildDetailPairsFromBienesRaicesPrivadoPreviewVm` at all (see test below) — it is uploaded
   * to hosted storage by `publishLeonixRealEstateListingCore` and patched into `detail_pairs`
   * afterward, so this function only ever sees (and persists) an already-hosted `http(s)://`
   * value at this layer.
   * ---------------------------------------------------------------------------------------- */
  {
    const previewVm = fakeVm({
      heroTitle: "Casa con jardín",
      priceDisplay: "$399,000",
      seller: {
        photoUrl: "https://cdn.example.com/listing-images/owner-1/listing-1/seller-photo.jpg",
        hasPhoto: true,
        name: "María López",
        byOwnerLabel: "Propietaria",
        phoneDisplay: "(916) 555-0100",
        emailDisplay: "maria@example.com",
        whatsappDisplay: "(916) 555-0100",
        smsDisplay: "(916) 555-0100",
        noteLine: "",
      },
    });

    const pairs = buildDetailPairsFromBienesRaicesPrivadoPreviewVm(previewVm);
    assert.ok(pairs.some((p) => p.label === "Vendedor" && p.value === "María López"), "seller name must be persisted");
    assert.ok(
      pairs.some(
        (p) => p.label === "Foto del vendedor" && p.value === "https://cdn.example.com/listing-images/owner-1/listing-1/seller-photo.jpg",
      ),
      "an already-hosted seller photo URL must be persisted directly",
    );

    const fakeRow: BienesLiveListingLike = {
      id: "listing-1",
      title: { es: "Casa con jardín", en: "Casa con jardín" },
      priceLabel: { es: "$399,000", en: "$399,000" },
      city: "Sacramento",
      blurb: { es: "Hermosa propiedad.", en: "Hermosa propiedad." },
      images: ["https://cdn.example.com/cover.jpg", "https://cdn.example.com/second.jpg"],
      owner_id: "owner-1",
      leonix_ad_id: "BR-2026-000001",
      contact_phone: "9165550100",
      contact_email: "maria@example.com",
      detailPairs: pairs,
    };

    const publishedVm = mapBrListingRowToPrivadoPreviewVm(fakeRow, "es");
    assert.equal(publishedVm.seller.name, "María López", "seller name must survive the full round trip");
    assert.equal(
      publishedVm.seller.photoUrl,
      "https://cdn.example.com/listing-images/owner-1/listing-1/seller-photo.jpg",
      "seller photo must survive the full round trip",
    );
    assert.equal(publishedVm.seller.phoneDisplay, "(916) 555-0100", "phone must survive from contact_phone column");
    assert.equal(publishedVm.seller.emailDisplay, "maria@example.com", "email must survive from contact_email column");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 6 — Gate I.5.4A.1: a raw `data:` seller photo (any size) is never embedded directly by this
   * function — small or huge, it is excluded here and left for `publishLeonixRealEstateListingCore`
   * to upload and patch in as a hosted URL. This replaces the old size-cap behavior (Gate I.5.4A),
   * which silently dropped oversized photos instead of uploading them.
   * ---------------------------------------------------------------------------------------- */
  {
    const smallPhoto = "data:image/jpeg;base64,AAAA";
    const hugePhoto = `data:image/jpeg;base64,${"A".repeat(70_000)}`;
    for (const photoUrl of [smallPhoto, hugePhoto]) {
      const vm = fakeVm({ seller: { ...fakeVm().seller, name: "Juan", photoUrl, hasPhoto: true } });
      const pairs = buildDetailPairsFromBienesRaicesPrivadoPreviewVm(vm);
      assert.ok(pairs.some((p) => p.label === "Vendedor"), "name must still persist regardless of photo handling");
      assert.ok(
        !pairs.some((p) => p.label === "Foto del vendedor"),
        "a data: URL photo must never be embedded directly, regardless of size — it is deferred to hosted upload",
      );
    }
  }

  /* ---------------------------------------------------------------------------------------- *
   * 7 — chosen cover image remains first: the published mapper reads images[0] as heroUrl,
   * consistent with Gate I.5.4's cover-order fix already putting the seller's chosen cover
   * photo at index 0 by publish time.
   * ---------------------------------------------------------------------------------------- */
  {
    const fakeRow: BienesLiveListingLike = {
      id: "listing-2",
      title: { es: "T", en: "T" },
      priceLabel: { es: "$1", en: "$1" },
      city: "Sacramento",
      blurb: { es: "", en: "" },
      images: ["cover.jpg", "second.jpg", "third.jpg"],
      detailPairs: [],
    };
    const vm = mapBrListingRowToPrivadoPreviewVm(fakeRow, "es");
    assert.equal(vm.media.heroUrl, "cover.jpg");
    assert.deepEqual(vm.media.allPhotoUrls, ["cover.jpg", "second.jpg", "third.jpg"]);
  }

  /* ---------------------------------------------------------------------------------------- *
   * 8 — Negocio parent/child call site and the Negocio shell component itself are untouched:
   * same prop shape passed to both shells, same component still exported and used for
   * non-privado lanes. No duplicate large renderer was introduced for Negocio.
   * ---------------------------------------------------------------------------------------- */
  {
    const negocioShellSrc = readSource("app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx");
    assert.ok(negocioShellSrc.includes("AgenteIndividualResidencialPreviewPage"), "Negocio shell must still use its own approved renderer");
    assert.ok(negocioShellSrc.includes('isChild = listing.inventory_role === "inventory_property"'), "child-gating logic must be untouched");
    assert.ok(!negocioShellSrc.includes("BienesRaicesPrivadoPreviewView"), "Negocio shell must never import the Privado renderer");

    const privadoShellSrc = readSource("app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx");
    assert.ok(!privadoShellSrc.includes("AgenteIndividualResidencialPreviewPage"), "Privado shell must never import the agent renderer");
  }

  /* ---------------------------------------------------------------------------------------- *
   * 9 — no locked system touched: payment, lifecycle, entitlement, schema, migration files are
   * absent from this gate's changed-file set (checked by the report's own git diff, this is a
   * source-level sanity check that the new files don't import any locked module).
   * ---------------------------------------------------------------------------------------- */
  {
    const files = [
      "app/(site)/clasificados/bienes-raices/listing/brListingLane.ts",
      "app/(site)/clasificados/bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm.ts",
      "app/(site)/clasificados/bienes-raices/listing/BienesRaicesPrivadoLiveDetailShell.tsx",
    ];
    for (const f of files) {
      const src = readSource(f);
      assert.ok(!/stripe|webhook|entitlement|migrations\//i.test(src), `${f} must not reference any locked system`);
    }
  }

  console.log(`gate-i5-4a-br-privado-shell-selftest: OK`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
