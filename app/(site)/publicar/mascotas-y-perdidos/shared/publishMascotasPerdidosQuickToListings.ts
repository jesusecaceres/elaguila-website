"use client";

import { insertListingsRowResilient } from "@/app/clasificados/lib/listingsSelectShrink";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";

import { gateMascotasPerdidosQuickPreview } from "./mascotasPerdidosRequiredForPreview";
import type { MascotasPerdidosQuickDraft } from "./mascotasPerdidosQuickTypes";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

async function fetchAsBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("fetch blob failed");
  return res.blob();
}

function resolveContactPhone(d: MascotasPerdidosQuickDraft): string | null {
  const p = digitsOnly(d.contactPhone);
  if (p.length >= 10) return p.slice(0, 15);
  return null;
}

function buildMascotasDetailPairs(d: MascotasPerdidosQuickDraft): { label: string; value: string }[] {
  const phoneDig = digitsOnly(d.contactPhone);
  const pairs: { label: string; value: string }[] = [
    { label: "Leonix:mascotasLane", value: "simple" },
    { label: "Leonix:noticeType", value: d.noticeType.trim() },
    { label: "Leonix:lastSeenLocation", value: d.lastSeenLocation.trim() },
  ];
  if (phoneDig.length >= 10) {
    pairs.push({ label: "Leonix:phoneDigits", value: phoneDig });
    pairs.push({ label: "Leonix:whatsappDigits", value: phoneDig });
  }
  if (d.email.trim()) pairs.push({ label: "Leonix:contactEmailAvailable", value: "1" });
  return pairs;
}

export type MascotasPerdidosQuickPublishToListingsResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

export async function publishMascotasPerdidosQuickToListings(input: {
  draft: MascotasPerdidosQuickDraft;
  lang: Lang;
}): Promise<MascotasPerdidosQuickPublishToListingsResult> {
  const { draft: d, lang } = input;
  const err = (es: string, en: string) => (lang === "es" ? es : en);

  const gate = gateMascotasPerdidosQuickPreview(d, lang);
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
  const pairs = buildMascotasDetailPairs(d);
  const contact_phone = resolveContactPhone(d);
  const contact_email = d.email.trim() || null;
  const imageSrc = d.imageDataUrl.trim();

  if (!imageSrc) {
    return { ok: false, error: err("Añade una imagen para publicar.", "Add an image to publish.") };
  }

  const insertPayload: Record<string, unknown> = {
    owner_id: userId,
    title,
    description: descriptionBase,
    city,
    category: "mascotas-y-perdidos",
    price: 0,
    is_free: true,
    contact_phone,
    contact_email,
    status: "draft",
    is_published: false,
    seller_type: "personal",
    detail_pairs: pairs.length ? pairs : null,
  };

  const ins = await insertListingsRowResilient(supabase, insertPayload);
  if (ins.error) {
    return { ok: false, error: ins.error.message };
  }
  const listingId = ins.data?.id;
  if (!listingId) {
    return { ok: false, error: err("No se recibió el ID del anuncio.", "No listing id returned.") };
  }

  const markPublishFailedNonPublic = async () => {
    await supabase.from("listings").update({ status: "removed", is_published: false }).eq("id", listingId);
  };

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
