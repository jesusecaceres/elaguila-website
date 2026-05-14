/**
 * Rentas Gate 08C — final `public.listings` insert payload diagnostics + boundary preflight.
 * Browser-safe (used from `publishLeonixRealEstateListingCore` client path only for `category === "rentas"`).
 */

const GIANT_PAIR_VALUE = 50_000;
const GIANT_JSON = 750_000;

function safeJsonLen(v: unknown): number | null {
  try {
    return JSON.stringify(v).length;
  } catch {
    return null;
  }
}

function scanObjectStringsForPatterns(
  obj: Record<string, unknown>,
  depth: number,
): { anyDataImage: boolean; anyBlob: boolean; anyBase64: boolean } {
  if (depth > 6) return { anyDataImage: false, anyBlob: false, anyBase64: false };
  let anyDataImage = false;
  let anyBlob = false;
  let anyBase64 = false;
  for (const v of Object.values(obj)) {
    if (typeof v === "string") {
      if (/data:(image|video|application)\//i.test(v)) anyDataImage = true;
      if (/blob:/i.test(v)) anyBlob = true;
      if (/;base64,/i.test(v) || (v.length > 12_000 && /\bbase64\b/i.test(v))) anyBase64 = true;
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      const n = scanObjectStringsForPatterns(v as Record<string, unknown>, depth + 1);
      anyDataImage ||= n.anyDataImage;
      anyBlob ||= n.anyBlob;
      anyBase64 ||= n.anyBase64;
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string") {
          if (/data:(image|video|application)\//i.test(item)) anyDataImage = true;
          if (/blob:/i.test(item)) anyBlob = true;
          if (/;base64,/i.test(item)) anyBase64 = true;
        } else if (item && typeof item === "object") {
          const n = scanObjectStringsForPatterns(item as Record<string, unknown>, depth + 1);
          anyDataImage ||= n.anyDataImage;
          anyBlob ||= n.anyBlob;
          anyBase64 ||= n.anyBase64;
        }
      }
    }
  }
  return { anyDataImage, anyBlob, anyBase64 };
}

export type RentasPublishFinalPayloadDebug = {
  category: string;
  /** `seller_type` on the insert row (personal vs business). */
  publicationAdType: string;
  payloadTopLevelKeys: string[];
  approxJsonPayloadLength: number | null;
  title: unknown;
  titleLength: number;
  descriptionIsNull: boolean;
  descriptionLength: number | null;
  descriptionFirst300: string;
  descriptionLast300: string;
  descriptionHasHttp: boolean;
  descriptionHasBlob: boolean;
  descriptionHasData: boolean;
  descriptionHasBase64: boolean;
  descriptionHasLeonixImages: boolean;
  descriptionHasDraftMediaUpload: boolean;
  descriptionHasUploadStatus: boolean;
  descriptionHasMux: boolean;
  descriptionHasSupabase: boolean;
  imagesCount: number;
  imagesHaveDataImage: boolean;
  imagesHaveBlob: boolean;
  imagesHaveBase64: boolean;
  firstImagePreview: string;
  listingJsonApproxLength: number | null;
  profileJsonApproxLength: number | null;
  detailPairsApproxLength: number | null;
  anyFieldContainingDataImage: boolean;
  anyFieldContainingBlob: boolean;
  anyFieldContainingBase64: boolean;
  muxAssetIdPresent: boolean;
  muxPlaybackIdPresent: boolean;
  muxThumbnailUrlPresent: boolean;
};

export function buildRentasPublishFinalPayloadDebug(args: {
  insertPayload: Record<string, unknown>;
  imageSources: string[];
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  muxThumbnailUrl?: string | null;
  sellerType: "personal" | "business";
  titleForDb: string;
  descriptionForDb: string | null;
}): RentasPublishFinalPayloadDebug {
  const { insertPayload, imageSources, muxAssetId, muxPlaybackId, muxThumbnailUrl, sellerType, titleForDb, descriptionForDb } = args;
  const descStr = descriptionForDb == null ? "" : String(descriptionForDb);
  const images = imageSources.filter((u) => typeof u === "string" && u.trim());
  let imagesHaveDataImage = false;
  let imagesHaveBlob = false;
  let imagesHaveBase64 = false;
  for (const u of images) {
    if (/^data:image\//i.test(u)) imagesHaveDataImage = true;
    if (/^blob:/i.test(u)) imagesHaveBlob = true;
    if (/;base64,/i.test(u) || (u.length > 12_000 && /\bbase64\b/i.test(u))) imagesHaveBase64 = true;
  }
  const scan = scanObjectStringsForPatterns(insertPayload, 0);
  const first = images[0]?.slice(0, 200) ?? "";

  return {
    category: String(insertPayload.category ?? ""),
    publicationAdType: String(insertPayload.seller_type ?? sellerType ?? ""),
    payloadTopLevelKeys: Object.keys(insertPayload),
    approxJsonPayloadLength: safeJsonLen(insertPayload),
    title: insertPayload.title,
    titleLength: titleForDb.length,
    descriptionIsNull: descriptionForDb == null,
    descriptionLength: descriptionForDb == null ? null : descStr.length,
    descriptionFirst300: descStr.slice(0, 300),
    descriptionLast300: descStr.length > 300 ? descStr.slice(-300) : descStr,
    descriptionHasHttp: /https?:\/\//i.test(descStr),
    descriptionHasBlob: /blob:/i.test(descStr),
    descriptionHasData: /\bdata:(image|video|application)\//i.test(descStr),
    descriptionHasBase64: /;base64,/i.test(descStr),
    descriptionHasLeonixImages: /\[LEONIX_IMAGES\]/i.test(descStr),
    descriptionHasDraftMediaUpload: /draft-media-upload/i.test(descStr),
    descriptionHasUploadStatus: /upload-status/i.test(descStr),
    descriptionHasMux: /\bmux\b/i.test(descStr) || /stream\.mux\.com/i.test(descStr),
    descriptionHasSupabase: /supabase\.co/i.test(descStr),
    imagesCount: images.length,
    imagesHaveDataImage,
    imagesHaveBlob,
    imagesHaveBase64,
    firstImagePreview: first,
    listingJsonApproxLength: insertPayload.listing_json != null ? safeJsonLen(insertPayload.listing_json) : null,
    profileJsonApproxLength: insertPayload.profile_json != null ? safeJsonLen(insertPayload.profile_json) : null,
    detailPairsApproxLength: insertPayload.detail_pairs != null ? safeJsonLen(insertPayload.detail_pairs) : null,
    anyFieldContainingDataImage: scan.anyDataImage,
    anyFieldContainingBlob: scan.anyBlob,
    anyFieldContainingBase64: scan.anyBase64,
    muxAssetIdPresent: Boolean(String(muxAssetId ?? "").trim()),
    muxPlaybackIdPresent: Boolean(String(muxPlaybackId ?? "").trim()),
    muxThumbnailUrlPresent: Boolean(String(muxThumbnailUrl ?? "").trim()),
  };
}

/**
 * Hard boundary before Supabase for Rentas only. Returns a user-facing error, or `null` when OK.
 */
export function rentasPublishFinalBoundaryPreflight(
  dbg: RentasPublishFinalPayloadDebug,
  insertPayload: Record<string, unknown>,
  imageSources: string[],
  lang: "es" | "en",
): string | null {
  const title = String(insertPayload.title ?? "");
  if (title.length > 0 && title.length < 5) {
    return lang === "es" ? "El título es demasiado corto para publicar." : "Title is too short to publish.";
  }
  if (title.length > 120) {
    return lang === "es" ? "El título es demasiado largo para publicar." : "Title is too long to publish.";
  }

  const d = insertPayload.description;
  if (typeof d === "string") {
    if (d.length > 0 && d.length < 20) {
      return lang === "es" ? "La descripción no cumple la longitud mínima para guardarla en la base." : "Description length is invalid for the database.";
    }
    if (d.length > 3900) {
      return lang === "es" ? "La descripción es demasiado larga. Acórtala antes de publicar." : "The description is too long. Shorten it before publishing.";
    }
    if (/data:(image|video|application)\//i.test(d) || /blob:/i.test(d) || /;base64,/i.test(d)) {
      return lang === "es"
        ? "La descripción contiene datos de medios incrustados. Quítalos del texto y vuelve a intentar."
        : "Description contains embedded media data. Remove it from the text and try again.";
    }
  }

  for (const u of imageSources) {
    if (typeof u !== "string" || !u.trim()) continue;
    if (/^data:image\//i.test(u) || /^blob:/i.test(u) || /;base64,/i.test(u)) {
      return lang === "es"
        ? "Las fotos aún tienen datos locales (data:/blob:). Vuelve al formulario o recarga la vista previa para subirlas a la nube antes de publicar."
        : "Photos still use local data URLs or blob URLs. Return to the form or reload preview to upload them before publishing.";
    }
  }

  if (dbg.anyFieldContainingDataImage || dbg.anyFieldContainingBlob) {
    return lang === "es"
      ? "El anuncio contiene referencias blob:/data: en campos públicos. Revisa el formulario y quita medios pegados en notas o campos personalizados."
      : "The listing payload still contains blob:/data: references in public fields.";
  }

  if (dbg.detailPairsApproxLength != null && dbg.detailPairsApproxLength > GIANT_JSON) {
    return lang === "es"
      ? "Los detalles del anuncio son demasiado grandes para publicar. Reduce texto o archivos pegados en el formulario."
      : "Listing detail pairs payload is too large to publish.";
  }

  const bm = insertPayload.business_meta;
  if (typeof bm === "string" && bm.length > GIANT_JSON) {
    return lang === "es" ? "Los metadatos del negocio son demasiado grandes para publicar." : "Business metadata payload is too large to publish.";
  }

  const pairs = insertPayload.detail_pairs;
  if (Array.isArray(pairs)) {
    for (const p of pairs) {
      if (!p || typeof p !== "object") continue;
      const val = String((p as { value?: unknown }).value ?? "");
      if (val.length > GIANT_PAIR_VALUE) {
        return lang === "es"
          ? "Un detalle del anuncio es demasiado grande (posible contenido pegado). Acórtalo antes de publicar."
          : "A detail pair value is too large (possibly pasted content). Shorten it before publishing.";
      }
      if (/data:(image|video|application)\//i.test(val) || /blob:/i.test(val) || /;base64,/i.test(val)) {
        return lang === "es"
          ? "Los detalles del anuncio contienen datos de imagen o archivo. Quítalos de los campos de detalle."
          : "Detail pairs contain embedded media or file data. Remove it from detail fields.";
      }
    }
  }

  return null;
}

/** After gallery upload, ensure only durable HTTPS URLs are written to `listings.images`. */
export function rentasPublishGalleryUrlsPreflight(photoUrls: string[], lang: "es" | "en"): string | null {
  for (const u of photoUrls) {
    const t = String(u ?? "").trim();
    if (!t) continue;
    if (!/^https:\/\//i.test(t)) {
      return lang === "es"
        ? "La galería final debe usar solo URLs https públicas. Revisa la subida de fotos."
        : "Final gallery must use only public https URLs. Check photo uploads.";
    }
    if (/^data:|^blob:/i.test(t) || /;base64,/i.test(t)) {
      return lang === "es"
        ? "La galería final no puede incluir data: ni blob: ni base64."
        : "Final gallery cannot include data:, blob:, or base64 payloads.";
    }
  }
  return null;
}
