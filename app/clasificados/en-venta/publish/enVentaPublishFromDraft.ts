"use client";

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { appendEnVentaDetailPairs } from "@/app/clasificados/en-venta/mapping/appendEnVentaDetailPairs";
import { mapEnVentaSellerKindToDb } from "@/app/clasificados/en-venta/mapping/mapEnVentaDraftToInsert";
import { getOrderedEnVentaImageUrls } from "@/app/clasificados/en-venta/preview/buildEnVentaPreviewModel";
import type { PublishLang } from "@/app/clasificados/lib/buildDetailsAppendix";

function resolveContactForInsert(state: EnVentaFreeApplicationState): {
  contact_phone: string | null;
  contact_email: string | null;
} {
  const m = state.contactMethod;
  if (m === "email") {
    return { contact_phone: null, contact_email: state.email.trim() || null };
  }
  if (m === "phone") {
    return { contact_phone: state.phone.replace(/\D/g, "").slice(0, 15) || null, contact_email: null };
  }
  if (m === "whatsapp") {
    return { contact_phone: state.whatsapp.replace(/\D/g, "").slice(0, 15) || null, contact_email: null };
  }
  return {
    contact_phone: state.phone.replace(/\D/g, "").slice(0, 15) || null,
    contact_email: state.email.trim() || null,
  };
}

function buildDetailsRecord(state: EnVentaFreeApplicationState): Record<string, string> {
  return {
    rama: state.rama,
    evSub: state.evSub,
    itemType: state.itemType,
    condition: state.condition,
    brand: state.brand,
    model: state.model,
    pickup: state.pickup ? "1" : "",
    shipping: state.shipping ? "1" : "",
    delivery: state.localDelivery ? "1" : "",
  };
}

function buildDetailPairs(
  state: EnVentaFreeApplicationState,
  lang: PublishLang,
  plan: "free" | "pro"
): Array<{ label: string; value: string }> {
  const pairs: Array<{ label: string; value: string }> = [];
  appendEnVentaDetailPairs(lang, buildDetailsRecord(state), pairs);
  if (state.meetup) {
    pairs.push({ label: lang === "es" ? "Encuentro" : "Meetup", value: lang === "es" ? "Sí" : "Yes" });
  }
  if (state.negotiable === "yes" && !state.priceIsFree) {
    pairs.push({ label: lang === "es" ? "Negociable" : "Negotiable", value: lang === "es" ? "Sí" : "Yes" });
  }
  if (state.quantity.trim()) {
    pairs.push({
      label: lang === "es" ? "Cantidad" : "Quantity",
      value: state.quantity.trim(),
    });
  }
  pairs.push({ label: "Leonix:plan", value: plan });
  return pairs;
}

function buildDescriptionBody(state: EnVentaFreeApplicationState, lang: PublishLang): string {
  let d = state.description.trim();
  const extras: string[] = [];
  if (state.wearNotes.trim()) extras.push(state.wearNotes.trim());
  if (state.accessoriesNotes.trim()) extras.push(state.accessoriesNotes.trim());
  if (state.itemExtraDetails.trim()) extras.push(state.itemExtraDetails.trim());
  if (extras.length) {
    d = [d, ...extras].filter(Boolean).join("\n\n");
  }

  const deliveryLines: string[] = [];
  if (state.shipping && state.shippingNotes.trim()) deliveryLines.push(state.shippingNotes.trim());
  if (state.pickup && state.pickupDetailNotes.trim()) deliveryLines.push(state.pickupDetailNotes.trim());
  if (state.meetup && state.meetupDetailNotes.trim()) deliveryLines.push(state.meetupDetailNotes.trim());
  if (state.localDelivery && state.localDeliveryDetailNotes.trim()) deliveryLines.push(state.localDeliveryDetailNotes.trim());
  if (deliveryLines.length) {
    const h = lang === "es" ? "Entrega / logística" : "Delivery / logistics";
    d = `${d}\n\n${h}:\n${deliveryLines.join("\n")}`.trim();
  }

  return d.trim();
}

function resolveMuxVideoCols(state: EnVentaFreeApplicationState) {
  const first = state.listingVideoSlots?.[0];
  const second = state.listingVideoSlots?.[1];
  const hasFirst = Boolean(first?.assetId || first?.playbackId || first?.playbackUrl);
  const hasSecond = Boolean(second?.assetId || second?.playbackId || second?.playbackUrl);
  const layout = hasFirst && hasSecond ? "virtual_tour_plus_video" : hasFirst ? "single" : null;
  return {
    mux_asset_id: first?.assetId || null,
    mux_playback_id: first?.playbackId || null,
    mux_status: first?.status || null,
    mux_thumbnail_url: first?.thumbnailUrl || null,
    mux_duration_seconds: first?.durationSeconds ?? null,
    mux_asset_id_2: second?.assetId || null,
    mux_playback_id_2: second?.playbackId || null,
    mux_status_2: second?.status || null,
    mux_thumbnail_url_2: second?.thumbnailUrl || null,
    mux_duration_seconds_2: second?.durationSeconds ?? null,
    video_layout_type: layout,
  };
}

async function fetchAsBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("fetch blob failed");
  return res.blob();
}

export type EnVentaPublishFromDraftResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

/**
 * Inserts an En Venta listing, uploads ordered gallery images to `listing-images`
 * (`${userId}/${listingId}/photos/01.ext`), then saves public URLs on `listings.images`
 * in the same order (cover first). Description is updated with the same LEONIX image
 * marker pattern used elsewhere.
 */
export async function publishEnVentaFromDraft(
  state: EnVentaFreeApplicationState,
  lang: PublishLang,
  plan: "free" | "pro"
): Promise<EnVentaPublishFromDraftResult> {
  if (!state.title.trim()) {
    return { ok: false, error: lang === "es" ? "Añade un título." : "Add a title." };
  }
  if (!state.city.trim()) {
    return { ok: false, error: lang === "es" ? "Añade una ciudad." : "Add a city." };
  }
  if (!state.priceIsFree && !String(state.price).trim()) {
    return { ok: false, error: lang === "es" ? "Indica un precio o marca gratis." : "Set a price or mark as free." };
  }

  let supabase: ReturnType<typeof createSupabaseBrowserClient>;
  try {
    supabase = createSupabaseBrowserClient();
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Supabase error" };
  }

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return {
      ok: false,
      error: lang === "es" ? "Inicia sesión para publicar." : "Sign in to publish.",
    };
  }
  const userId = auth.user.id;

  const pairs = buildDetailPairs(state, lang, plan);
  const descriptionBase = buildDescriptionBody(state, lang);
  const contact = resolveContactForInsert(state);

  const sellerType = mapEnVentaSellerKindToDb(state.seller_kind);
  const muxCols = resolveMuxVideoCols(state);
  const insertPayload: Record<string, unknown> = {
    owner_id: userId,
    title: state.title.trim(),
    description: descriptionBase,
    city: state.city.trim(),
    category: "en-venta",
    price: state.priceIsFree ? 0 : Number(String(state.price).replace(/[^0-9.]/g, "")) || 0,
    is_free: state.priceIsFree,
    contact_phone: contact.contact_phone,
    contact_email: contact.contact_email,
    status: "active",
    is_published: true,
    seller_type: sellerType,
    detail_pairs: pairs.length ? pairs : null,
    ...muxCols,
  };

  if (state.seller_kind === "business" && state.displayName.trim()) {
    insertPayload.business_name = state.displayName.trim();
  }

  const { data: row, error: insErr } = await supabase.from("listings").insert([insertPayload]).select("id").single();

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  const listingId = (row as { id?: string } | null)?.id;
  if (!listingId) {
    return { ok: false, error: lang === "es" ? "No se recibió el ID del anuncio." : "No listing id returned." };
  }

  const ordered = getOrderedEnVentaImageUrls(state);
  const photoUrls: string[] = [];
  const basePath = `${userId}/${listingId}/photos`;

  try {
    for (let i = 0; i < ordered.length; i++) {
      const src = ordered[i];
      const blob = await fetchAsBlob(src);
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${ext}`;
      const up = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (up.error) {
        console.warn("en-venta photo upload failed", up.error.message);
        continue;
      }
      const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
      if (url) photoUrls.push(url);
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

    if (plan === "pro" && state.listingVideoUrl.trim() && !state.listingVideoSlots?.[0]?.playbackId) {
      const note = lang === "es" ? `\n\nVideo: ${state.listingVideoUrl.trim()}` : `\n\nVideo: ${state.listingVideoUrl.trim()}`;
      const { data: cur } = await supabase.from("listings").select("description").eq("id", listingId).maybeSingle();
      const prev = String((cur as { description?: string } | null)?.description ?? "");
      await supabase.from("listings").update({ description: `${prev}${note}`.trim() }).eq("id", listingId);
    }
  } catch (e: unknown) {
    console.warn("en-venta media upload error", e);
  }

  return { ok: true, listingId };
}
