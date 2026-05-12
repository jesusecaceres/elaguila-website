/**
 * Rentas publish media transport gates (no network).
 * Run: npx tsx scripts/rentas-publish-media-smoke.ts
 */
import assert from "node:assert/strict";
import type { BrNegocioCategoriaPropiedad } from "../app/(site)/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  buildListingsInsertRowForLeonixPublish,
  leonixHttpsGalleryUrlEligibleForDirectPersist,
} from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";
import {
  createEmptyRentasNegocioFormState,
  mergePartialRentasNegocioState,
} from "../app/(site)/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
} from "../app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { orderedRentasGallerySourcesForPublish } from "../app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  isRentasPublishableRemoteImageRef,
  rentasDraftImageRequiresBlobUpload,
} from "../app/(site)/clasificados/rentas/shared/rentasPublishMediaTransport";

const tinyData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const httpsOk = "https://cdn.example.com/rentas/a.jpg";

function assertIsoClockFields(row: Record<string, unknown>, label: string) {
  assert.ok(typeof row.published_at === "string" && (row.published_at as string).length > 10, `${label}: published_at`);
  assert.ok(typeof row.updated_at === "string" && (row.updated_at as string).length > 10, `${label}: updated_at`);
}

function main() {
  assert.equal(isRentasPublishableRemoteImageRef(httpsOk), true);
  assert.equal(isRentasPublishableRemoteImageRef(tinyData), false);
  assert.equal(isRentasPublishableRemoteImageRef("blob:http://x"), false);
  assert.equal(rentasDraftImageRequiresBlobUpload(tinyData), true);
  assert.equal(rentasDraftImageRequiresBlobUpload(httpsOk), false);
  assert.equal(rentasDraftImageRequiresBlobUpload(""), false);

  const ordered = orderedRentasGallerySourcesForPublish(["a", "b", "c", "d"], 1);
  assert.deepEqual(ordered, ["b", "c", "d", "a"], "cover-first publish order");

  assert.equal(leonixHttpsGalleryUrlEligibleForDirectPersist("https://x.public.blob.vercel-storage.com/foo.jpg"), true);
  assert.equal(
    leonixHttpsGalleryUrlEligibleForDirectPersist(
      "https://abcdefgh.supabase.co/storage/v1/object/public/listing-images/u/l/01.jpg",
    ),
    true,
  );
  assert.equal(leonixHttpsGalleryUrlEligibleForDirectPersist("https://evil.example.com/a.jpg"), false);
  assert.equal(leonixHttpsGalleryUrlEligibleForDirectPersist("http://x.public.blob.vercel-storage.com/a.jpg"), false);

  const baseInsertArgs = {
    title: "media-smoke",
    description: "body",
    city: "Oakland",
    price: 1000,
    isFree: false,
    category: "rentas" as const,
    sellerType: "personal" as const,
    detailPairs: [{ label: "Leonix:branch", value: "rentas_privado" }],
    contactPhoneDigits: null,
    contactEmail: null,
    lang: "es" as const,
  };
  const noPhotoInsert = buildListingsInsertRowForLeonixPublish("00000000-0000-4000-8000-000000000099", {
    ...baseInsertArgs,
    title: "[NO_PHOTOS] media-smoke",
    imageSources: [],
  });
  assertIsoClockFields(noPhotoInsert, "[NO_PHOTOS] insert payload");
  const withPhotoInsert = buildListingsInsertRowForLeonixPublish("00000000-0000-4000-8000-000000000088", {
    ...baseInsertArgs,
    title: "[WITH_PHOTOS] media-smoke",
    imageSources: [httpsOk],
  });
  assertIsoClockFields(withPhotoInsert, "[WITH_PHOTOS] insert payload");

  // Transport: draft may hold data URLs; they must not count as publishable until Blob upload step.
  assert.equal(isRentasPublishableRemoteImageRef(tinyData), false, "data:image blocked from transport");

  /** QA parity: every Rentas Negocio property branch must keep `media.photoDataUrls` after merge (no branch-specific strip). */
  const negCats: BrNegocioCategoriaPropiedad[] = ["residencial", "comercial", "terreno_lote"];
  const emptyNegMedia = createEmptyRentasNegocioFormState().media;
  for (const cat of negCats) {
    const merged = mergePartialRentasNegocioState({
      ...createEmptyRentasNegocioFormState(),
      categoriaPropiedad: cat,
      titulo: `[SMOKE][WITH_PHOTOS][RENTAS][NEGOCIO][${String(cat).toUpperCase()}] media parity`,
      rentaMensual: "1200",
      ciudad: "Oakland",
      ubicacionLinea: "123 Main",
      descripcion: "d",
      media: {
        ...emptyNegMedia,
        photoDataUrls: [tinyData],
        primaryImageIndex: 0,
        videoUrl: "",
        videoLocalDataUrl: "",
      },
      negocioNombre: "Smoke Realty",
      negocioEmail: "smoke@example.com",
      confirmListingAccurate: true,
      confirmPhotosRepresentItem: true,
      confirmCommunityRules: true,
    });
    const orderedNeg = orderedRentasGallerySourcesForPublish(merged.media.photoDataUrls, merged.media.primaryImageIndex);
    assert.ok(orderedNeg.length >= 1, `[WITH_PHOTOS] negocio merge keeps gallery for ${cat}`);
    assert.equal(rentasDraftImageRequiresBlobUpload(orderedNeg[0]!), true, `negocio ${cat}: publish still resolves data URL before core`);
  }

  const mergedPrivNoPhotos = mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    categoriaPropiedad: "residencial",
    titulo: "[SMOKE][NO_PHOTOS][RENTAS][PRIVADO] sin fotos (título explícito)",
    rentaMensual: "800",
    ciudad: "Oakland",
    ubicacionLinea: "1 Test",
    descripcion: "d",
    media: {
      ...createEmptyRentasPrivadoFormState().media,
      photoDataUrls: [],
      primaryImageIndex: 0,
      videoUrl: "",
      videoLocalDataUrl: "",
    },
    seller: {
      fotoDataUrl: "",
      nombre: "Seller",
      telefono: "5555550100",
      whatsapp: "",
      mensajesTexto: "",
      correo: "seller@example.com",
      notaContacto: "",
    },
    mascotas: "permitidas",
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  });
  const orderedNoPh = orderedRentasGallerySourcesForPublish(
    mergedPrivNoPhotos.media.photoDataUrls,
    mergedPrivNoPhotos.media.primaryImageIndex,
  );
  assert.equal(orderedNoPh.length, 0, "[NO_PHOTOS] empty gallery stays empty");

  const mergedPriv = mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    categoriaPropiedad: "residencial",
    titulo: "[SMOKE][WITH_PHOTOS][RENTAS][PRIVADO] media parity",
    rentaMensual: "900",
    ciudad: "Oakland",
    ubicacionLinea: "456 Oak",
    descripcion: "d",
    media: {
      ...createEmptyRentasPrivadoFormState().media,
      photoDataUrls: [tinyData],
      primaryImageIndex: 0,
      videoUrl: "",
      videoLocalDataUrl: "",
    },
    seller: {
      fotoDataUrl: "",
      nombre: "Seller",
      telefono: "5555550100",
      whatsapp: "",
      mensajesTexto: "",
      correo: "seller@example.com",
      notaContacto: "",
    },
    mascotas: "permitidas",
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  });
  const orderedPriv = orderedRentasGallerySourcesForPublish(mergedPriv.media.photoDataUrls, mergedPriv.media.primaryImageIndex);
  assert.ok(orderedPriv.length >= 1, "[WITH_PHOTOS] privado merge keeps gallery for residencial");

  // eslint-disable-next-line no-console -- smoke summary for manual QA vs historical DB rows
  console.log(
    "rentas-publish-media-smoke summary: [WITH_PHOTOS] branches passed (draft keeps photos → ordered gallery); [NO_PHOTOS] empty gallery allowed; insert builder always sets published_at+updated_at; old production rows with images:null are out of scope here (historical or no-photo smoke).",
  );
  console.log("rentas-publish-media-smoke: OK");
}

main();
