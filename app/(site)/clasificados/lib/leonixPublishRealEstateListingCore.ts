/**
 * Shared Supabase insert for Leonix BR + Rentas: images, description marker, `detail_pairs`, `business_meta`.
 *
 * Dev smoke: publish from BR preview → row in `listings` → `/clasificados/anuncio/:id` → admin workspace
 * `?category=bienes-raices` + optional `leonix_branch` filters.
 */

import { insertListingsRowResilient } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const DEV = process.env.NODE_ENV === "development";

function devLog(...args: unknown[]) {
  if (DEV) console.info("[leonix publish]", ...args);
}

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
};

export type PublishLeonixRealEstateListingCoreResult =
  | { ok: true; listingId: string; warnings: string[] }
  | { ok: false; error: string };

export async function publishLeonixRealEstateListingCore(
  params: PublishLeonixRealEstateListingCoreParams
): Promise<PublishLeonixRealEstateListingCoreResult> {
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

  const phone =
    contactPhoneDigits && digitsOnly(contactPhoneDigits).length >= 10 ? digitsOnly(contactPhoneDigits).slice(0, 15) : null;
  const email = (contactEmail ?? "").trim() || null;

  const zipTrim = (zipRaw ?? "").trim();
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

  if (zipTrim) {
    insertPayload.zip = zipTrim.replace(/\D/g, "").slice(0, 12);
  }

  if (sellerType === "business" && businessName?.trim()) {
    insertPayload.business_name = businessName.trim();
  }
  if (businessMetaJson?.trim()) {
    insertPayload.business_meta = businessMetaJson.trim();
  }

  devLog("insert listings row", { category, sellerType, titleLen: title.trim().length });

  const { data: inserted, error: insErr } = await insertListingsRowResilient(supabase, insertPayload);
  if (insErr || !inserted?.id) {
    const err = insErr ?? { message: "unknown", code: "" };
    devLog("insert error", err);
    const code = typeof err.code === "string" ? err.code : "";
    const msg = String(err.message ?? "");
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
    return {
      ok: false,
      error:
        lang === "es"
          ? `No se pudo guardar el anuncio: ${msg}${hint}`
          : `Could not save listing: ${msg}${hint}`,
    };
  }

  const listingId = inserted.id;

  const warnings: string[] = [];
  const ordered = imageSources.filter((u) => typeof u === "string" && u.trim());
  const photoUrls: string[] = [];
  const basePath = `${userId}/${listingId}/photos`;
  let uploadFailures = 0;

  try {
    for (let i = 0; i < ordered.length; i++) {
      const src = ordered[i]!;
      try {
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
      warnings.push(
        lang === "es"
          ? "El anuncio quedó publicado pero ninguna foto se pudo subir (revisa bucket listing-images y políticas)."
          : "The listing was published but no photos could be uploaded (check listing-images bucket and policies)."
      );
    } else if (uploadFailures > 0 && photoUrls.length > 0 && photoUrls.length < ordered.length) {
      warnings.push(
        lang === "es"
          ? `Algunas fotos no se subieron (${uploadFailures} error(es)); el anuncio muestra las que sí se guardaron.`
          : `Some photos failed to upload (${uploadFailures} error(s)); the listing shows the ones that saved.`
      );
    }

    if (photoUrls.length) {
      const marker = `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;
      const appendix =
        lang === "es"
          ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
          : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
      const descriptionForUpdate = `${description.trim()}${appendix}`.trim();
      const { error: updErr } = await supabase
        .from("listings")
        .update({ description: descriptionForUpdate, images: photoUrls })
        .eq("id", listingId);
      if (updErr) {
        warnings.push(
          lang === "es"
            ? `Fotos subidas pero no se pudo actualizar la descripción: ${updErr.message}`
            : `Photos uploaded but description update failed: ${updErr.message}`
        );
        devLog("description/images update failed", updErr);
      }
    }
  } catch (e: unknown) {
    console.warn("[leonix publish] media upload error", e);
    devLog("media block error", e);
    if (ordered.length) {
      warnings.push(
        lang === "es"
          ? "Error al procesar fotos; el anuncio existe sin galería actualizada."
          : "Error while processing photos; the listing exists without an updated gallery."
      );
    }
  }

  devLog("publish ok", listingId, "warnings", warnings.length);
  return { ok: true, listingId, warnings };
}
