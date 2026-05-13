/**
 * Shared Supabase insert for Leonix BR + Rentas: images, description marker, `detail_pairs`, `business_meta`.
 *
 * Dev smoke: publish from BR preview → row in `listings` → `/clasificados/anuncio/:id` → admin workspace
 * `?category=bienes-raices` + optional `leonix_branch` filters.
 */

import { insertListingsRowResilient, updateListingsRowResilient } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import {
  leonixPublishDescriptionDevDiagnostics,
  mapLeonixListingsDescriptionConstraintToUserMessage,
  prepareLeonixListingDescriptionForPublish,
  prepareLeonixListingTitleForPublish,
  toLeonixListingsDescriptionForDb,
  toLeonixListingsTitleForDb,
} from "@/app/(site)/clasificados/lib/leonixPublishPublicDescription";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const DEV = process.env.NODE_ENV === "development";

function devLog(...args: unknown[]) {
  if (DEV) console.info("[leonix publish]", ...args);
}

async function fetchAsBlob(src: string): Promise<Blob> {
  const s = src.trim();
  if (s.startsWith("data:")) {
    const comma = s.indexOf(",");
    if (comma === -1) throw new Error("invalid data URL");
    const header = s.slice(0, comma);
    const payload = s.slice(comma + 1);
    const isBase64 = /;base64/i.test(header);
    const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const mimeMatch = /^data:([^;,]+)/i.exec(header);
    const type = mimeMatch?.[1]?.trim() || "application/octet-stream";
    return new Blob([bytes], { type });
  }
  const res = await fetch(s);
  if (!res.ok) throw new Error("fetch blob failed");
  return res.blob();
}

function digitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

/** Same row shape as browser publish insert (Node scripts / QA seeds may call with authenticated `ownerId`). */
export function buildListingsInsertRowForLeonixPublish(
  ownerId: string,
  params: PublishLeonixRealEstateListingCoreParams,
): Record<string, unknown> {
  const {
    title,
    description,
    city,
    zip: zipRaw,
    price,
    isFree,
    category,
    sellerType,
    businessName,
    businessMetaJson,
    detailPairs,
    contactPhoneDigits,
    contactEmail,
  } = params;

  const phone =
    contactPhoneDigits && digitsOnly(contactPhoneDigits).length >= 10 ? digitsOnly(contactPhoneDigits).slice(0, 15) : null;
  const email = (contactEmail ?? "").trim() || null;

  const zipTrim = (zipRaw ?? "").trim();
  const insertPayload: Record<string, unknown> = {
    owner_id: ownerId,
    title: toLeonixListingsTitleForDb(title),
    description: toLeonixListingsDescriptionForDb(description),
    city: city.trim(),
    category,
    price: isFree ? 0 : Number.isFinite(price) && price >= 0 ? Math.round(price) : 0,
    is_free: isFree,
    contact_phone: phone,
    contact_email: email,
    status: "active",
    is_published: true,
    seller_type: sellerType,
    detail_pairs: detailPairs.length ? detailPairs : null,
  };

  if (zipTrim) {
    insertPayload.zip = zipTrim.replace(/\D/g, "").slice(0, 12);
  }

  if (sellerType === "business" && businessName?.trim()) {
    insertPayload.business_name = businessName.trim();
  }
  if (businessMetaJson?.trim()) {
    insertPayload.business_meta = businessMetaJson.trim();
  }
  const clock = new Date().toISOString();
  insertPayload.published_at = clock;
  insertPayload.updated_at = clock;

  const muxPid = String(params.muxPlaybackId ?? "").trim();
  if (muxPid) {
    insertPayload.mux_playback_id = muxPid;
    const aid = String(params.muxAssetId ?? "").trim();
    if (aid) insertPayload.mux_asset_id = aid;
    const th = String(params.muxThumbnailUrl ?? "").trim();
    if (th) insertPayload.mux_thumbnail_url = th;
    const st = String(params.muxStatus ?? "ready").trim();
    insertPayload.mux_status = st || "ready";
  }

  return insertPayload;
}

/**
 * @deprecated Legacy gallery tail embedded in `listings.description`.
 * New publishes persist gallery only in `listings.images` and keep `description` as user prose
 * (`prepareLeonixListingDescriptionForPublish`). Kept for one-off scripts / QA seeds that still
 * mimic historical rows.
 */
export function leonixGalleryAppendixForDescription(lang: "es" | "en", photoUrls: string[]): string {
  if (!photoUrls.length) return "";
  const marker = `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;
  return lang === "es"
    ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
    : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
}

/**
 * Public HTTPS URLs we may persist into `listings.images` without re-fetching + re-uploading to
 * `listing-images` (avoids browser CORS failures on third-party CDNs; Rentas draft-media uses Vercel Blob).
 * Exported for smoke tests.
 */
export function leonixHttpsGalleryUrlEligibleForDirectPersist(src: string): boolean {
  const t = src.trim();
  if (!/^https:\/\//i.test(t) || t.length > 2048) return false;
  try {
    const u = new URL(t);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h.endsWith(".public.blob.vercel-storage.com") || h === "public.blob.vercel-storage.com") return true;
    if (h.endsWith(".supabase.co") && u.pathname.includes("/object/public/listing-images/")) return true;
    return false;
  } catch {
    return false;
  }
}

export type PublishLeonixRealEstateListingCoreParams = {
  title: string;
  description: string;
  city: string;
  /** Optional postal/ZIP when `listings.zip` exists (see migration `20260421120000_rentas_listings_zip_and_public_read.sql`). */
  zip?: string | null;
  price: number;
  isFree: boolean;
  category: "bienes-raices" | "rentas";
  sellerType: "personal" | "business";
  businessName?: string | null;
  businessMetaJson?: string | null;
  detailPairs: Array<{ label: string; value: string }>;
  contactPhoneDigits: string | null;
  contactEmail: string | null;
  /** Ordered gallery: data URLs or http(s) URLs (cover first). */
  imageSources: string[];
  lang: "es" | "en";
  /** Rentas publish-time Mux (optional; omitted when listing has link-only video or no video). */
  muxAssetId?: string | null;
  muxPlaybackId?: string | null;
  muxThumbnailUrl?: string | null;
  muxStatus?: string | null;
};

export type PublishLeonixRealEstateListingCoreResult =
  | { ok: true; listingId: string; warnings: string[] }
  | { ok: false; error: string };

export async function publishLeonixRealEstateListingCore(
  params: PublishLeonixRealEstateListingCoreParams
): Promise<PublishLeonixRealEstateListingCoreResult> {
  const { title, description, city, category, sellerType, imageSources, lang } = params;

  if (!title.trim()) {
    return { ok: false, error: lang === "es" ? "Falta el título." : "Title is required." };
  }
  const titlePrep = prepareLeonixListingTitleForPublish(title, lang);
  if (!titlePrep.ok) {
    return { ok: false, error: titlePrep.error };
  }
  if (!city.trim()) {
    return { ok: false, error: lang === "es" ? "Falta la ciudad." : "City is required." };
  }

  const descriptionPrep = prepareLeonixListingDescriptionForPublish(description, lang);
  if (!descriptionPrep.ok) {
    return { ok: false, error: descriptionPrep.error };
  }
  const safeDescription = descriptionPrep.sanitized;
  const descriptionForDb = toLeonixListingsDescriptionForDb(safeDescription);
  const paramsForRow: PublishLeonixRealEstateListingCoreParams = {
    ...params,
    title: titlePrep.titleForDb,
    description: safeDescription,
  };

  let supabase: ReturnType<typeof createSupabaseBrowserClient>;
  try {
    supabase = createSupabaseBrowserClient();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Supabase error";
    devLog("browser client failed", msg);
    return {
      ok: false,
      error:
        lang === "es"
          ? `Configuración de Supabase en el navegador no disponible: ${msg}`
          : `Supabase browser configuration missing: ${msg}`,
    };
  }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return {
      ok: false,
      error: lang === "es" ? "Inicia sesión para publicar." : "Sign in to publish.",
    };
  }
  const userId = auth.user.id;

  const insertPayload = buildListingsInsertRowForLeonixPublish(userId, paramsForRow);

  if (DEV) {
    const descCol = insertPayload.description;
    devLog("description diag (pre-insert)", {
      rawIncomingLen: String(description ?? "").length,
      ...leonixPublishDescriptionDevDiagnostics(safeDescription, descriptionForDb),
      insertRowDescriptionIsNull: descCol == null,
      titleLen: titlePrep.titleForDb.length,
      insertKeys: Object.keys(insertPayload),
    });
  }

  devLog("insert listings row", { category, sellerType, titleLen: titlePrep.titleForDb.length });

  const { data: inserted, error: insErr } = await insertListingsRowResilient(supabase, insertPayload);
  if (insErr || !inserted?.id) {
    const err = insErr ?? { message: "unknown", code: "" };
    devLog("insert error", err);
    const code = typeof err.code === "string" ? err.code : "";
    const msg = String(err.message ?? "");
    const descConstraint = mapLeonixListingsDescriptionConstraintToUserMessage(err, lang);
    if (descConstraint) {
      return { ok: false, error: descConstraint };
    }
    const rls = code === "42501" || /row-level security|RLS|permission denied|violates row-level security/i.test(msg);
    const missingCol = /column\s+["']?(\w+)["']?\s+of\s+relation\s+["']?listings["']?\s+does not exist/i.test(msg);
    const hint =
      lang === "es"
        ? rls
          ? " (Supabase: revisa políticas RLS de `listings` para rol `authenticated` + insert.)"
          : missingCol
            ? " (Supabase: aplica migraciones de `listings` o alinea columnas con el insert del app.)"
            : code
              ? ` (código PostgREST/Postgres: ${code})`
              : ""
        : rls
          ? " (Supabase: check `listings` RLS policies for `authenticated` insert.)"
          : missingCol
            ? " (Supabase: apply `listings` migrations or align DB columns with the app insert.)"
            : code
              ? ` (PostgREST/Postgres code: ${code})`
              : "";
    const generic =
      lang === "es"
        ? "No se pudo guardar el anuncio. Inténtalo de nuevo."
        : "Could not save the listing. Please try again.";
    return {
      ok: false,
      error: DEV ? `${generic} (${msg}${hint})` : rls || missingCol ? `${generic}${hint}` : generic,
    };
  }

  const listingId = inserted.id;

  const warnings: string[] = [];
  const ordered = imageSources.filter((u) => typeof u === "string" && u.trim());
  const photoUrls: string[] = [];
  const basePath = `${userId}/${listingId}/photos`;
  let uploadFailures = 0;
  /** True only after `listings.images` + clean `description` update succeeds (when there are photos). */
  let listingImagesPersisted = false;

  try {
    for (let i = 0; i < ordered.length; i++) {
      const src = ordered[i]!;
      try {
        if (leonixHttpsGalleryUrlEligibleForDirectPersist(src)) {
          photoUrls.push(src.trim());
          continue;
        }
        const blob = await fetchAsBlob(src);
        const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
        const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${ext}`;
        const up = await supabase.storage
          .from("listing-images")
          .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
        if (up.error) {
          uploadFailures++;
          console.warn("[leonix publish] photo upload failed", up.error.message);
          devLog("storage upload failed", path, up.error.message);
          continue;
        }
        const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
        if (url) photoUrls.push(url);
      } catch (e) {
        uploadFailures++;
        console.warn("[leonix publish] photo fetch/upload threw", e);
        devLog("photo iteration error", e);
      }
    }

    if (ordered.length > 0 && photoUrls.length === 0) {
      await supabase.from("listings").delete().eq("id", listingId);
      return {
        ok: false,
        error:
          lang === "es"
            ? "No se pudo subir ninguna foto (revisa el bucket listing-images y las políticas de Storage). El anuncio no se publicó."
            : "No photos could be uploaded (check the listing-images bucket and Storage policies). The listing was not published.",
      };
    }
    if (uploadFailures > 0 && photoUrls.length > 0 && photoUrls.length < ordered.length) {
      warnings.push(
        lang === "es"
          ? `Algunas fotos no se subieron (${uploadFailures} error(es)); el anuncio muestra las que sí se guardaron.`
          : `Some photos failed to upload (${uploadFailures} error(s)); the listing shows the ones that saved.`
      );
    }

    if (photoUrls.length) {
      const touch = new Date().toISOString();
      const muxPid = String(params.muxPlaybackId ?? "").trim();
      const galleryPatch: Record<string, unknown> = {
        description: toLeonixListingsDescriptionForDb(safeDescription),
        images: photoUrls,
        published_at: touch,
        updated_at: touch,
      };
      if (muxPid) {
        galleryPatch.mux_playback_id = muxPid;
        const aid = String(params.muxAssetId ?? "").trim();
        if (aid) galleryPatch.mux_asset_id = aid;
        const th = String(params.muxThumbnailUrl ?? "").trim();
        if (th) galleryPatch.mux_thumbnail_url = th;
        const st = String(params.muxStatus ?? "ready").trim();
        galleryPatch.mux_status = st || "ready";
      }
      const { error: updErr } = await updateListingsRowResilient(supabase, listingId, galleryPatch);
      if (updErr) {
        devLog("description/images update failed", updErr);
        await supabase.from("listings").delete().eq("id", listingId);
        const updFriendly = mapLeonixListingsDescriptionConstraintToUserMessage(updErr, lang);
        return {
          ok: false,
          error: updFriendly
            ? updFriendly
            : lang === "es"
              ? DEV
                ? `Las fotos se subieron pero no se pudo guardar la galería en el anuncio: ${updErr.message}`
                : "Las fotos se subieron pero no se pudo guardar la galería en el anuncio. Inténtalo de nuevo."
              : DEV
                ? `Photos uploaded but the listing could not be updated with the gallery: ${updErr.message}`
                : "Photos uploaded but the listing could not be updated with the gallery. Please try again.",
        };
      }
      listingImagesPersisted = true;
    }
  } catch (e: unknown) {
    console.warn("[leonix publish] media upload error", e);
    devLog("media block error", e);
    if (ordered.length > 0 && !listingImagesPersisted) {
      await supabase.from("listings").delete().eq("id", listingId);
      return {
        ok: false,
        error:
          lang === "es"
            ? "Error al procesar las fotos; el anuncio no se publicó."
            : "Error while processing photos; the listing was not published.",
      };
    }
  }

  if (ordered.length > 0 && !listingImagesPersisted) {
    await supabase.from("listings").delete().eq("id", listingId);
    return {
      ok: false,
      error:
        lang === "es"
          ? "No se pudo guardar la galería de fotos; el anuncio no se publicó."
          : "The photo gallery could not be saved; the listing was not published.",
    };
  }

  devLog("publish ok", listingId, "warnings", warnings.length);
  return { ok: true, listingId, warnings };
}
