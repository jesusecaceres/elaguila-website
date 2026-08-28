"use client";

import { insertListingsRowResilient, updateListingsRowResilient } from "@/app/clasificados/lib/listingsSelectShrink";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  logQuickListingReuseFailure,
  quickListingExistingIdentityInvalidMessage,
  clearSessionPublishAttemptKey,
  fetchOwnListingIdByPublishAttemptKey,
  getOrCreateSessionPublishAttemptKey,
  isPublishAttemptKeyConflict,
  verifyQuickListingReusable,
} from "@/app/(site)/clasificados/lib/quickListingIdempotency";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

import type { CommunityKind } from "../constants/communitySessionKeys";
import { normalizeSocialUrlForOpen, normalizeWebsiteForOpen } from "../lib/communityWebsiteAndSocial";
import { shouldBlockClasesPaidPublish } from "../required/communityRequiredForPreview";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "../types/communityQuickDraft";
import {
  buildComunidadDescription,
  buildComunidadDetailPairs,
  comunidadPriceFields,
} from "@/app/(site)/publicar/comunidad/lib/comunidadPublishPayload";
import {
  buildClasesDescription,
  buildClasesDetailPairs,
  clasesPriceFields,
} from "@/app/(site)/publicar/clases/lib/clasesPublishPayload";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function isPdfItem(url: string, mime?: string): boolean {
  if (mime === "application/pdf") return true;
  const u = String(url ?? "").trim();
  if (u.startsWith("data:application/pdf")) return true;
  const base = u.split(/[?#]/)[0]?.toLowerCase() ?? "";
  if (u.startsWith("http") && base.endsWith(".pdf")) return true;
  return false;
}

/** True if any gallery slot is a PDF — live publish uses images only (`listing-images` photos). */
export function communityGalleryContainsPdf(images: EmpleosImageItem[]): boolean {
  return images.some((im) => isPdfItem(im.url, im.attachmentMime));
}

function orderedImageItems(images: EmpleosImageItem[]): EmpleosImageItem[] {
  const main = images.find((x) => x.isMain);
  const rest = images.filter((x) => x !== main);
  return main ? [main, ...rest] : [...images];
}

/** URLs to upload: non-PDF only, main first. Skips empty URLs. */
function uploadableImageUrls(images: EmpleosImageItem[]): string[] {
  const out: string[] = [];
  for (const im of orderedImageItems(images)) {
    const u = String(im.url ?? "").trim();
    if (!u || isPdfItem(u, im.attachmentMime)) continue;
    out.push(u);
  }
  return out;
}

async function fetchAsBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("fetch blob failed");
  return res.blob();
}

function resolveContactPhone(d: { phone: string; whatsapp: string }): string | null {
  const p = digitsOnly(d.phone);
  const w = digitsOnly(d.whatsapp);
  if (p.length >= 10) return p.slice(0, 15);
  if (w.length >= 10) return w.slice(0, 15);
  return null;
}

/**
 * Gate 0 (community category isolation) — this builds only the pairs that are
 * genuinely identical for both Comunidad and Clases (no `kind` branching in
 * this function body). Category-specific pairs (event links/cost/schedule vs.
 * class category/cost/schedule/links) are owned by
 * app/(site)/publicar/comunidad/lib/comunidadPublishPayload.ts and
 * app/(site)/publicar/clases/lib/clasesPublishPayload.ts respectively — see
 * buildDetailPairs() below, which combines the two.
 */
function buildCommonDetailPairs(
  kind: CommunityKind,
  d: ClasesQuickDraft | ComunidadQuickDraft,
  organizerLogoUploadedUrl: string | null,
): Array<{ label: string; value: string }> {
  const pairs: Array<{ label: string; value: string }> = [];
  pairs.push({ label: "Leonix:communityLane", value: "quick" });
  pairs.push({ label: "Leonix:communityKind", value: kind });
  pairs.push({ label: "Leonix:organizer", value: d.organizer.trim() });
  // Use uploaded URL if available, otherwise use original URL if it's http
  const logoUrl = organizerLogoUploadedUrl ?? (normalizeWebsiteForOpen(d.organizerLogoUrl) ?? d.organizerLogoUrl.trim());
  if (logoUrl && logoUrl.startsWith("http")) {
    pairs.push({ label: "Leonix:organizerLogoUrl", value: logoUrl });
  }
  pairs.push({ label: "Leonix:primaryCta", value: d.primaryCta });
  pairs.push({ label: "Leonix:zip", value: d.zip.trim() });
  pairs.push({ label: "Leonix:state", value: d.state.trim() });
  if (d.venue.trim()) pairs.push({ label: "Leonix:venue", value: d.venue.trim() });
  if (d.addressLine1.trim()) pairs.push({ label: "Leonix:addressLine1", value: d.addressLine1.trim() });
  if (d.addressLine2.trim()) pairs.push({ label: "Leonix:addressLine2", value: d.addressLine2.trim() });
  if (d.country.trim()) pairs.push({ label: "Leonix:country", value: d.country.trim() });
  const web = normalizeWebsiteForOpen(d.website);
  if (web) pairs.push({ label: "Leonix:website", value: web });
  const sl = d.socialLinks;
  const sf = normalizeSocialUrlForOpen(sl.facebook, "facebook");
  if (sf) pairs.push({ label: "Leonix:socialFacebook", value: sf });
  const si = normalizeSocialUrlForOpen(sl.instagram, "instagram");
  if (si) pairs.push({ label: "Leonix:socialInstagram", value: si });
  const st = normalizeSocialUrlForOpen(sl.tiktok, "tiktok");
  if (st) pairs.push({ label: "Leonix:socialTiktok", value: st });
  const sy = normalizeSocialUrlForOpen(sl.youtube, "youtube");
  if (sy) pairs.push({ label: "Leonix:socialYoutube", value: sy });
  const sx = normalizeSocialUrlForOpen(sl.xTwitter, "xTwitter");
  if (sx) pairs.push({ label: "Leonix:socialXTwitter", value: sx });
  const sln = normalizeSocialUrlForOpen(sl.linkedin, "linkedin");
  if (sln) pairs.push({ label: "Leonix:socialLinkedin", value: sln });
  const ssc = normalizeSocialUrlForOpen(sl.snapchat, "snapchat");
  if (ssc) pairs.push({ label: "Leonix:socialSnapchat", value: ssc });
  const spi = normalizeSocialUrlForOpen(sl.pinterest, "pinterest");
  if (spi) pairs.push({ label: "Leonix:socialPinterest", value: spi });
  const pDig = digitsOnly(d.phone);
  if (pDig.length >= 10) pairs.push({ label: "Leonix:phoneDigits", value: pDig.slice(0, 10) });
  const wDig = digitsOnly(d.whatsapp);
  if (wDig.length >= 10) pairs.push({ label: "Leonix:whatsappDigits", value: wDig.slice(0, 10) });
  if (d.smsPhone.trim()) pairs.push({ label: "Leonix:smsPhone", value: digitsOnly(d.smsPhone) });
  if (d.audience.trim()) pairs.push({ label: "Leonix:audience", value: d.audience.trim() });
  if (d.registrationRequired.trim()) pairs.push({ label: "Leonix:registrationRequired", value: d.registrationRequired.trim() });
  if (d.bringNote.trim()) pairs.push({ label: "Leonix:bringNote", value: d.bringNote.trim() });
  return pairs;
}

function buildDetailPairs(
  kind: CommunityKind,
  d: ClasesQuickDraft | ComunidadQuickDraft,
  lang: Lang,
  organizerLogoUploadedUrl: string | null,
): Array<{ label: string; value: string }> {
  const common = buildCommonDetailPairs(kind, d, organizerLogoUploadedUrl);
  const categoryPairs =
    kind === "clases"
      ? buildClasesDetailPairs(d as ClasesQuickDraft)
      : buildComunidadDetailPairs(d as ComunidadQuickDraft);
  void lang;
  return [...common, ...categoryPairs];
}


export type CommunityQuickPublishToListingsResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

export async function publishCommunityQuickToListings(input: {
  kind: CommunityKind;
  draft: ClasesQuickDraft | ComunidadQuickDraft;
  lang: Lang;
  /** I.6B — verified-reusable canonical UUID from a prior in-flight attempt of this same submission. */
  existingListingId?: string | null;
  /** I.6B — invoked as soon as the row id is known (reused or freshly inserted), before photo upload. */
  onListingIdKnown?: (listingId: string) => void;
}): Promise<CommunityQuickPublishToListingsResult> {
  const { kind, draft: d, lang, existingListingId, onListingIdKnown } = input;
  const err = (es: string, en: string) => (lang === "es" ? es : en);

  if (kind === "clases" && shouldBlockClasesPaidPublish(d as ClasesQuickDraft)) {
    return { ok: false, error: err("Las clases pagadas aún no se publican aquí.", "Paid classes are not published here yet.") };
  }

  if (communityGalleryContainsPdf(d.images)) {
    return {
      ok: false,
      error: err(
        "Quita el PDF del volante para publicar: Leonix solo sube fotos (JPG/PNG/WebP) al bucket listing-images. Puedes dejar el PDF solo en vista previa de sesión.",
        "Remove the PDF flyer to publish: Leonix only uploads photos (JPG/PNG/WebP) to the listing-images bucket. PDFs can stay in session preview only.",
      ),
    };
  }

  const orderedUrls = uploadableImageUrls(d.images);
  if (orderedUrls.length === 0) {
    return {
      ok: false,
      error: err(
        "Añade al menos una imagen (no solo PDF) para publicar en Leonix.",
        "Add at least one image (not PDF-only) to publish on Leonix.",
      ),
    };
  }

  // Include organizer logo URL if it's a data URL (file upload) that needs upload
  const organizerLogoRaw = d.organizerLogoUrl.trim();
  const organizerLogoNeedsUpload = organizerLogoRaw.startsWith("data:image/");
  const organizerLogoHttpUrl = organizerLogoRaw.startsWith("http") ? organizerLogoRaw : null;

  let supabase: ReturnType<typeof createSupabaseBrowserClient>;
  try {
    supabase = createSupabaseBrowserClient();
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Supabase error" };
  }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return { ok: false, error: err("Inicia sesión para publicar.", "Sign in to publish.") };
  }
  const userId = auth.user.id;

  const cityRaw = d.publicCity.trim();
  const city = getCanonicalCityName(cityRaw) || cityRaw;
  const title = d.title.trim().slice(0, 500);
  const descriptionBase =
    kind === "clases" ? buildClasesDescription(d as ClasesQuickDraft, lang) : buildComunidadDescription(d as ComunidadQuickDraft, lang);
  const pairs = buildDetailPairs(kind, d, lang, null);
  const contact_phone = resolveContactPhone(d);
  const contact_email = d.email.trim() || null;

  const { price, is_free } =
    kind === "clases" ? clasesPriceFields(d as ClasesQuickDraft) : comunidadPriceFields(d as ComunidadQuickDraft);

  const insertPayload: Record<string, unknown> = {
    owner_id: userId,
    title,
    description: descriptionBase,
    city,
    category: kind,
    price,
    is_free,
    contact_phone,
    contact_email,
    status: "draft",
    is_published: false,
    seller_type: "personal",
    detail_pairs: pairs.length ? pairs : null,
  };

  const zipTrim = d.zip.trim().replace(/\D/g, "").slice(0, 12);
  if (zipTrim) insertPayload.zip = zipTrim;

  const reuseCheck = existingListingId
    ? await verifyQuickListingReusable(supabase, {
        candidateId: existingListingId,
        ownerUserId: userId,
        expectedCategory: kind,
      })
    : null;

  let listingId: string | undefined;
  if (reuseCheck?.safe) {
    listingId = reuseCheck.listingId;
    const { category: _category, owner_id: _ownerId, ...updatablePayload } = insertPayload;
    void _category;
    void _ownerId;
    const upd = await updateListingsRowResilient(supabase, listingId, updatablePayload);
    if (upd.error) {
      return { ok: false, error: upd.error.message };
    }
  } else if (existingListingId) {
    // I.6C — an existing-listing intention was supplied but failed verification. Fail closed:
    // never fall back to an INSERT here, or a failed identity check would silently become a
    // second, duplicate row. The local draft is left untouched by returning early. Covers both
    // Clases and Comunidad — this publisher is shared by `kind`.
    logQuickListingReuseFailure(`community:${kind}`, reuseCheck!.reason);
    return { ok: false, error: quickListingExistingIdentityInvalidMessage(lang) };
  } else {
    // Globalization Package A Gate 3 — session-stable idempotency key closes the concurrent
    // double-submit race (unique index listings_owner_publish_attempt_key_uidx; recovery
    // below). Fail-open: null key (or an older DB — insertListingsRowResilient drops the
    // unknown column) preserves pre-gate behavior.
    const publishAttemptKey = getOrCreateSessionPublishAttemptKey(kind);
    if (publishAttemptKey) insertPayload.publish_attempt_key = publishAttemptKey;
    const ins = await insertListingsRowResilient(supabase, insertPayload);
    if (ins.error && publishAttemptKey && isPublishAttemptKeyConflict(ins.error)) {
      // This exact submission already created a row (racing click or lost response) —
      // recover it, never insert a duplicate.
      const recoveredId = await fetchOwnListingIdByPublishAttemptKey(supabase, {
        ownerUserId: userId,
        attemptKey: publishAttemptKey,
        expectedCategory: kind,
      });
      if (recoveredId) {
        listingId = recoveredId;
      } else {
        return { ok: false, error: ins.error.message };
      }
    } else if (ins.error) {
      return { ok: false, error: ins.error.message };
    } else {
      listingId = ins.data?.id;
    }
    if (listingId) clearSessionPublishAttemptKey(kind);
  }
  if (!listingId) {
    return { ok: false, error: err("No se recibió el ID del anuncio.", "No listing id returned.") };
  }
  onListingIdKnown?.(listingId);

  const basePath = `${userId}/${listingId}/photos`;
  const photoUrls: string[] = [];
  let organizerLogoUploadedUrl: string | null = null;

  const markPublishFailedNonPublic = async () => {
    await supabase.from("listings").update({ status: "removed", is_published: false }).eq("id", listingId);
  };

  try {
    // Upload main gallery images
    for (let i = 0; i < orderedUrls.length; i++) {
      const src = orderedUrls[i];
      const blob = await fetchAsBlob(src);
      if (blob.size > MAX_IMAGE_BYTES) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `Una imagen supera el límite de ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
            `One image exceeds the ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB limit.`,
          ),
        };
      }
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const fileName = `photo-${String(i + 1).padStart(2, "0")}.${ext}`;
      const path = `${basePath}/${fileName}`;
      const up = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (up.error) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `No se pudo subir la foto (${up.error.message}). Revisa el bucket listing-images y que la ruta empiece con tu usuario.`,
            `Photo upload failed (${up.error.message}). Check the listing-images bucket and user-scoped paths.`,
          ),
        };
      }
      const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
      if (url) photoUrls.push(url);
    }

    // Upload organizer logo if it's a data URL
    if (organizerLogoNeedsUpload) {
      const blob = await fetchAsBlob(organizerLogoRaw);
      if (blob.size > MAX_IMAGE_BYTES) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `El logo del organizador supera el límite de ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
            `Organizer logo exceeds the ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB limit.`,
          ),
        };
      }
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const fileName = `organizer-logo.${ext}`;
      const path = `${basePath}/${fileName}`;
      const up = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (up.error) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `No se pudo subir el logo del organizador (${up.error.message}).`,
            `Organizer logo upload failed (${up.error.message}).`,
          ),
        };
      }
      const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
      if (url) organizerLogoUploadedUrl = url;
    }

    if (photoUrls.length) {
      const marker = `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;
      const appendix =
        lang === "es"
          ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
          : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
      const descriptionForUpdate = `${descriptionBase}${appendix}`.trim();
      await supabase.from("listings").update({ description: descriptionForUpdate, images: photoUrls }).eq("id", listingId);
    }

    // Update detail pairs with uploaded organizer logo URL if it was uploaded
    if (organizerLogoUploadedUrl) {
      const updatedPairs = buildDetailPairs(kind, d, lang, organizerLogoUploadedUrl);
      await supabase.from("listings").update({ detail_pairs: updatedPairs.length ? updatedPairs : null }).eq("id", listingId);
    }
  } catch (e: unknown) {
    await markPublishFailedNonPublic();
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : err("Error al procesar medios.", "Error while processing media."),
    };
  }

  const imagesOk = orderedUrls.length === 0 || photoUrls.length === orderedUrls.length;
  if (orderedUrls.length > 0 && !imagesOk) {
    await markPublishFailedNonPublic();
    return {
      ok: false,
      error: err(
        "No se pudieron subir todas las fotos. El anuncio no quedó público.",
        "Not all photos could upload. The listing was not made public.",
      ),
    };
  }

  const { error: finErr } = await supabase
    .from("listings")
    .update({ status: "active", is_published: true })
    .eq("id", listingId);
  if (finErr) {
    await markPublishFailedNonPublic();
    return { ok: false, error: finErr.message };
  }

  return { ok: true, listingId };
}
