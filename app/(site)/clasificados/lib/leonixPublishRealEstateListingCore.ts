/**
 * Shared Supabase insert for Leonix BR + Rentas: images, description marker, `detail_pairs`, `business_meta`.
 */

import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

async function fetchAsBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  if (!res.ok) throw new Error("fetch blob failed");
  return res.blob();
}

function digitsOnly(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export type PublishLeonixRealEstateListingCoreParams = {
  title: string;
  description: string;
  city: string;
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
};

export type PublishLeonixRealEstateListingCoreResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

export async function publishLeonixRealEstateListingCore(
  params: PublishLeonixRealEstateListingCoreParams
): Promise<PublishLeonixRealEstateListingCoreResult> {
  const {
    title,
    description,
    city,
    price,
    isFree,
    category,
    sellerType,
    businessName,
    businessMetaJson,
    detailPairs,
    contactPhoneDigits,
    contactEmail,
    imageSources,
    lang,
  } = params;

  if (!title.trim()) {
    return { ok: false, error: lang === "es" ? "Falta el título." : "Title is required." };
  }
  if (!city.trim()) {
    return { ok: false, error: lang === "es" ? "Falta la ciudad." : "City is required." };
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

  const phone =
    contactPhoneDigits && digitsOnly(contactPhoneDigits).length >= 10 ? digitsOnly(contactPhoneDigits).slice(0, 15) : null;
  const email = (contactEmail ?? "").trim() || null;

  const insertPayload: Record<string, unknown> = {
    owner_id: userId,
    title: title.trim(),
    description: description.trim(),
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

  if (sellerType === "business" && businessName?.trim()) {
    insertPayload.business_name = businessName.trim();
  }
  if (businessMetaJson?.trim()) {
    insertPayload.business_meta = businessMetaJson.trim();
  }

  const { data: row, error: insErr } = await supabase.from("listings").insert([insertPayload]).select("id").single();

  if (insErr) {
    return { ok: false, error: insErr.message };
  }

  const listingId = (row as { id?: string } | null)?.id;
  if (!listingId) {
    return { ok: false, error: lang === "es" ? "No se recibió el ID del anuncio." : "No listing id returned." };
  }

  const ordered = imageSources.filter((u) => typeof u === "string" && u.trim());
  const photoUrls: string[] = [];
  const basePath = `${userId}/${listingId}/photos`;

  try {
    for (let i = 0; i < ordered.length; i++) {
      const src = ordered[i]!;
      const blob = await fetchAsBlob(src);
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
      const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${ext}`;
      const up = await supabase.storage
        .from("listing-images")
        .upload(path, blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (up.error) {
        console.warn("[leonix publish] photo upload failed", up.error.message);
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
      const descriptionForUpdate = `${description.trim()}${appendix}`.trim();
      await supabase.from("listings").update({ description: descriptionForUpdate, images: photoUrls }).eq("id", listingId);
    }
  } catch (e: unknown) {
    console.warn("[leonix publish] media upload error", e);
  }

  return { ok: true, listingId };
}
