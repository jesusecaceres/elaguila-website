"use client";

import { insertListingsRowResilient, updateListingsRowResilient } from "@/app/clasificados/lib/listingsSelectShrink";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import {
  clearSessionPublishAttemptKey,
  fetchOwnListingIdByPublishAttemptKey,
  getOrCreateSessionPublishAttemptKey,
  isPublishAttemptKeyConflict,
  logQuickListingReuseFailure,
  quickListingExistingIdentityInvalidMessage,
  verifyQuickListingReusable,
} from "@/app/(site)/clasificados/lib/quickListingIdempotency";

import { gateBuscoQuickPreview } from "./buscoRequiredForPreview";
import type { BuscoQuickDraft } from "./buscoQuickTypes";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

async function fetchAsBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("fetch blob failed");
  return res.blob();
}

function resolveContactPhone(d: BuscoQuickDraft): string | null {
  const p = digitsOnly(d.phone);
  if (p.length >= 10) return p.slice(0, 15);
  return null;
}

function buildBuscoDetailPairs(d: BuscoQuickDraft): { label: string; value: string }[] {
  const phoneDig = digitsOnly(d.phone);
  const whatsappDig = digitsOnly(d.whatsapp);
  const smsDig = digitsOnly(d.smsPhone);
  const pairs: { label: string; value: string }[] = [
    { label: "Leonix:buscoLane", value: "quick" },
    { label: "Leonix:buscoType", value: d.buscoType.trim() },
  ];
  const custom = d.buscoTypeCustom.trim();
  if (custom) pairs.push({ label: "Leonix:buscoTypeCustom", value: custom });
  // Location
  const state = d.state.trim();
  if (state) pairs.push({ label: "Leonix:state", value: state });
  const country = d.country.trim();
  if (country) pairs.push({ label: "Leonix:buscoCountry", value: country });
  const zip = d.zip.trim();
  if (zip) pairs.push({ label: "Leonix:zip", value: zip });
  const zone = d.zone.trim();
  if (zone) pairs.push({ label: "Leonix:buscoZone", value: zone });
  // Budget (structured, Gate 4) + urgency
  if (d.budgetMode && d.budgetMode !== "no_aplica") {
    pairs.push({ label: "Leonix:buscoBudgetMode", value: d.budgetMode });
    if (d.budgetMode === "tiene" && d.budgetAmount.trim()) {
      pairs.push({ label: "Leonix:buscoBudgetAmount", value: d.budgetAmount.trim() });
    }
  }
  if (d.urgency && d.urgency !== "normal") {
    pairs.push({ label: "Leonix:buscoUrgency", value: d.urgency });
  }
  // Section C — light conditional fields, only the ones relevant to the chosen type are ever filled.
  const preferredCondition = d.preferredCondition.trim();
  if (preferredCondition) pairs.push({ label: "Leonix:buscoPreferredCondition", value: preferredCondition });
  const workType = d.workType.trim();
  if (workType) pairs.push({ label: "Leonix:buscoWorkType", value: workType });
  const workSkills = d.workSkills.trim();
  if (workSkills) pairs.push({ label: "Leonix:buscoWorkSkills", value: workSkills });
  const workAvailability = d.workAvailability.trim();
  if (workAvailability) pairs.push({ label: "Leonix:buscoWorkAvailability", value: workAvailability });
  const transportOrigin = d.transportOrigin.trim();
  if (transportOrigin) pairs.push({ label: "Leonix:buscoTransportOrigin", value: transportOrigin });
  const transportDestination = d.transportDestination.trim();
  if (transportDestination) pairs.push({ label: "Leonix:buscoTransportDestination", value: transportDestination });
  const volunteersCount = d.volunteersCount.trim();
  if (volunteersCount) pairs.push({ label: "Leonix:buscoVolunteersCount", value: volunteersCount });
  const whenNeeded = d.whenNeeded.trim();
  if (whenNeeded) pairs.push({ label: "Leonix:buscoWhenNeeded", value: whenNeeded });
  // Phone / WhatsApp / SMS
  if (phoneDig.length >= 10) {
    pairs.push({ label: "Leonix:buscoContactPhoneAvailable", value: "1" });
    pairs.push({ label: "Leonix:phoneDigits", value: phoneDig });
  }
  // WhatsApp: use explicit whatsapp field if filled, else fall back to phone
  const effectiveWaDig = whatsappDig.length >= 10 ? whatsappDig : phoneDig;
  if (effectiveWaDig.length >= 10) {
    pairs.push({ label: "Leonix:whatsappDigits", value: effectiveWaDig });
  }
  if (smsDig.length >= 10) {
    pairs.push({ label: "Leonix:smsPhone", value: smsDig });
  }
  if (d.email.trim()) pairs.push({ label: "Leonix:buscoContactEmailAvailable", value: "1" });
  // Optional socials — Section M: Facebook, Instagram, TikTok, YouTube + one custom link.
  const fb = d.facebook.trim();
  if (fb) pairs.push({ label: "Leonix:buscoFacebook", value: fb });
  const ig = d.instagram.trim();
  if (ig) pairs.push({ label: "Leonix:buscoInstagram", value: ig });
  const tt = d.tiktok.trim();
  if (tt) pairs.push({ label: "Leonix:buscoTiktok", value: tt });
  const yt = d.youtube.trim();
  if (yt) pairs.push({ label: "Leonix:buscoYoutube", value: yt });
  const ocLabel = d.otherContactLabel.trim();
  const ocUrl = d.otherContactUrl.trim();
  if (ocUrl) {
    if (ocLabel) pairs.push({ label: "Leonix:buscoOtherContactLabel", value: ocLabel });
    pairs.push({ label: "Leonix:buscoOtherContactUrl", value: ocUrl });
  }
  return pairs;
}

export type BuscoQuickPublishToListingsResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

export async function publishBuscoQuickToListings(input: {
  draft: BuscoQuickDraft;
  lang: Lang;
  /** I.6B — verified-reusable canonical UUID from a prior in-flight attempt of this same submission. */
  existingListingId?: string | null;
  /** I.6B — invoked as soon as the row id is known (reused or freshly inserted), before photo upload. */
  onListingIdKnown?: (listingId: string) => void;
}): Promise<BuscoQuickPublishToListingsResult> {
  const { draft: d, lang, existingListingId, onListingIdKnown } = input;
  const err = (es: string, en: string) => (lang === "es" ? es : en);

  const gate = gateBuscoQuickPreview(d, lang);
  if (!gate.ok) {
    return {
      ok: false,
      error: err(
        `Completa los campos requeridos: ${gate.issues.join(", ")}.`,
        `Complete required fields: ${gate.issues.join(", ")}.`,
      ),
    };
  }

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

  const cityRaw = d.city.trim();
  const city = getCanonicalCityName(cityRaw) || cityRaw;
  const title = d.title.trim().slice(0, 500);
  const descriptionBase = d.description.trim();
  const pairs = buildBuscoDetailPairs(d);
  const contact_phone = resolveContactPhone(d);
  const contact_email = d.email.trim() || null;
  const imageSrc = d.imageDataUrl.trim();

  const insertPayload: Record<string, unknown> = {
    owner_id: userId,
    title,
    description: descriptionBase,
    city,
    category: "busco",
    price: 0,
    is_free: true,
    contact_phone,
    contact_email,
    status: "draft",
    is_published: false,
    seller_type: "personal",
    detail_pairs: pairs.length ? pairs : null,
  };

  const reuseCheck = existingListingId
    ? await verifyQuickListingReusable(supabase, {
        candidateId: existingListingId,
        ownerUserId: userId,
        expectedCategory: "busco",
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
    // second, duplicate row. The local draft is left untouched by returning early.
    logQuickListingReuseFailure("busco", reuseCheck!.reason);
    return { ok: false, error: quickListingExistingIdentityInvalidMessage(lang) };
  } else {
    // Globalization Package A Gate 3 — session-stable idempotency key closes the concurrent
    // double-submit race (unique index listings_owner_publish_attempt_key_uidx; recovery
    // below). Fail-open: null key (or an older DB — insertListingsRowResilient drops the
    // unknown column) preserves pre-gate behavior.
    const publishAttemptKey = getOrCreateSessionPublishAttemptKey("busco");
    if (publishAttemptKey) insertPayload.publish_attempt_key = publishAttemptKey;
    const ins = await insertListingsRowResilient(supabase, insertPayload);
    if (ins.error && publishAttemptKey && isPublishAttemptKeyConflict(ins.error)) {
      // This exact submission already created a row (racing click or lost response) —
      // recover it, never insert a duplicate.
      const recoveredId = await fetchOwnListingIdByPublishAttemptKey(supabase, {
        ownerUserId: userId,
        attemptKey: publishAttemptKey,
        expectedCategory: "busco",
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
    if (listingId) clearSessionPublishAttemptKey("busco");
  }
  if (!listingId) {
    return { ok: false, error: err("No se recibió el ID del anuncio.", "No listing id returned.") };
  }
  onListingIdKnown?.(listingId);

  const markPublishFailedNonPublic = async () => {
    await supabase.from("listings").update({ status: "removed", is_published: false }).eq("id", listingId);
  };

  if (imageSrc) {
    try {
      const blob = await fetchAsBlob(imageSrc);
      if (blob.size > MAX_IMAGE_BYTES) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `La imagen supera el límite de ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
            `The image exceeds the ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB limit.`,
          ),
        };
      }
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const basePath = `${userId}/${listingId}/photos`;
      const path = `${basePath}/photo-01.${ext}`;
      const up = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (up.error) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `No se pudo subir la foto (${up.error.message}).`,
            `Photo upload failed (${up.error.message}).`,
          ),
        };
      }
      const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
      if (url) {
        const marker = `[LEONIX_IMAGES]\nurl=${url}\n[/LEONIX_IMAGES]`;
        const appendix =
          lang === "es" ? `\n\n— Fotos —\n${url}\n${marker}\n` : `\n\n— Photos —\n${url}\n${marker}\n`;
        await supabase
          .from("listings")
          .update({ description: `${descriptionBase}${appendix}`.trim(), images: [url] })
          .eq("id", listingId);
      }
    } catch (e: unknown) {
      await markPublishFailedNonPublic();
      return {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : err("Error al procesar la imagen.", "Error while processing the image."),
      };
    }
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
