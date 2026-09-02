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
  const p = digitsOnly(d.phone);
  if (p.length >= 10) return p.slice(0, 15);
  return null;
}

/** Gate 3 — rich, category-owned detail pairs. Every key is optional/additive — legacy simple-lane rows (Leonix:mascotasLane = "simple" or absent) never had any of these and must keep hydrating fine. */
function buildMascotasDetailPairs(d: MascotasPerdidosQuickDraft): { label: string; value: string }[] {
  const pairs: { label: string; value: string }[] = [
    { label: "Leonix:mascotasLane", value: "rich" },
    { label: "Leonix:noticeType", value: d.noticeType.trim() },
  ];
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (v) pairs.push({ label, value: v });
  };

  push("Leonix:lastSeenLocation", d.lastSeenLocation);
  push("Leonix:landmark", d.landmark);
  push("Leonix:state", d.state);
  push("Leonix:country", d.country);
  push("Leonix:zip", d.zip);

  push("Leonix:petName", d.petName);
  push("Leonix:species", d.species);
  push("Leonix:breed", d.breed);
  push("Leonix:color", d.color);
  push("Leonix:sex", d.sex);
  push("Leonix:ageApprox", d.ageApprox);
  push("Leonix:size", d.size);
  push("Leonix:identifyingMarks", d.identifyingMarks);
  if (d.hasCollar) pairs.push({ label: "Leonix:hasCollar", value: "1" });
  push("Leonix:collarNote", d.collarNote);
  push("Leonix:microchip", d.microchip);

  push("Leonix:lastSeenDate", d.lastSeenDate);
  if (d.offersReward) {
    pairs.push({ label: "Leonix:offersReward", value: "1" });
    push("Leonix:rewardAmount", d.rewardAmount);
  }
  push("Leonix:safetyNote", d.safetyNote);

  push("Leonix:foundDate", d.foundDate);
  push("Leonix:currentStatus", d.currentStatus);
  push("Leonix:claimInstructions", d.claimInstructions);

  push("Leonix:temperament", d.temperament);
  push("Leonix:vaccinated", d.vaccinated);
  push("Leonix:spayedNeutered", d.spayedNeutered);
  push("Leonix:specialNeeds", d.specialNeeds);
  push("Leonix:adoptionDetails", d.adoptionDetails);

  push("Leonix:objectType", d.objectType);

  const smsDig = digitsOnly(d.smsPhone);
  if (smsDig.length >= 10) pairs.push({ label: "Leonix:smsDigits", value: smsDig.slice(0, 10) });
  // Globalization Build D-F5 — was hard-truncated to 10 digits, silently corrupting any
  // international WhatsApp number (>10 digits) at publish time. SMS stays US-only by design
  // (unchanged above); WhatsApp must not be capped.
  const waDig = digitsOnly(d.whatsapp);
  if (waDig.length >= 10) pairs.push({ label: "Leonix:whatsappDigits", value: waDig });

  push("Leonix:facebook", d.facebook);
  push("Leonix:instagram", d.instagram);

  return pairs;
}

export type MascotasPerdidosQuickPublishToListingsResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

function orderedImageUrls(images: MascotasPerdidosQuickDraft["images"]): string[] {
  const main = images.find((x) => x.isMain);
  const rest = images.filter((x) => x !== main);
  const ordered = main ? [main, ...rest] : [...images];
  return ordered.map((im) => im.url.trim()).filter(Boolean);
}

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
  const orderedUrls = orderedImageUrls(d.images);

  if (orderedUrls.length === 0) {
    return { ok: false, error: err("Añade al menos una foto para publicar.", "Add at least one photo to publish.") };
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

  const basePath = `${userId}/${listingId}/photos`;
  const photoUrls: string[] = [];

  try {
    for (let i = 0; i < orderedUrls.length; i++) {
      const src = orderedUrls[i];
      const blob = await fetchAsBlob(src);
      if (blob.size > MAX_IMAGE_BYTES) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(
            `Una foto supera el límite de ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
            `One photo exceeds the ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB limit.`,
          ),
        };
      }
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const path = `${basePath}/photo-${String(i + 1).padStart(2, "0")}.${ext}`;
      const up = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (up.error) {
        await markPublishFailedNonPublic();
        return {
          ok: false,
          error: err(`No se pudo subir una foto (${up.error.message}).`, `A photo upload failed (${up.error.message}).`),
        };
      }
      const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
      if (url) photoUrls.push(url);
    }

    if (photoUrls.length) {
      const marker = `[LEONIX_IMAGES]\n${photoUrls.map((u) => `url=${u}`).join("\n")}\n[/LEONIX_IMAGES]`;
      const appendix =
        lang === "es" ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n` : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
      await supabase
        .from("listings")
        .update({ description: `${descriptionBase}${appendix}`.trim(), images: photoUrls })
        .eq("id", listingId);
    }
  } catch (e: unknown) {
    await markPublishFailedNonPublic();
    return {
      ok: false,
      error: e instanceof Error ? e.message : err("Error al procesar las fotos.", "Error while processing photos."),
    };
  }

  const imagesOk = photoUrls.length === orderedUrls.length;
  if (!imagesOk) {
    await markPublishFailedNonPublic();
    return {
      ok: false,
      error: err("No se pudieron subir todas las fotos. El aviso no quedó público.", "Not all photos could upload. The notice was not made public."),
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
