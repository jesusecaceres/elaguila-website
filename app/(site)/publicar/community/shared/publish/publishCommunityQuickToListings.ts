"use client";

import { insertListingsRowResilient } from "@/app/clasificados/lib/listingsSelectShrink";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { digitsOnly } from "@/app/clasificados/publicar/servicios/lib/serviciosPhoneUi";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import type { EmpleosImageItem } from "@/app/publicar/empleos/shared/media/empleosMediaTypes";

import type { CommunityKind } from "../constants/communitySessionKeys";
import { normalizeSocialUrlForOpen, normalizeWebsiteForOpen } from "../lib/communityWebsiteAndSocial";
import { shouldBlockClasesPaidPublish } from "../required/communityRequiredForPreview";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "../types/communityQuickDraft";

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

function dayShort(day: DayHoursRow["day"], lang: Lang): string {
  const es: Record<DayHoursRow["day"], string> = {
    mon: "Lun",
    tue: "Mar",
    wed: "Mié",
    thu: "Jue",
    fri: "Vie",
    sat: "Sáb",
    sun: "Dom",
  };
  const en: Record<DayHoursRow["day"], string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return lang === "en" ? en[day] : es[day];
}

function formatWeekly(rows: DayHoursRow[], lang: Lang): string {
  const lines: string[] = [];
  for (const r of rows) {
    if (r.closed) continue;
    const o = String(r.open ?? "").trim();
    const c = String(r.close ?? "").trim();
    if (!o || !c) continue;
    lines.push(`${dayShort(r.day, lang)} ${o}–${c}`);
  }
  if (!lines.length) return "";
  const h = lang === "es" ? "Horario" : "Schedule";
  return `${h}:\n${lines.join("\n")}`;
}

function buildDescriptionClases(d: ClasesQuickDraft, lang: Lang): string {
  const parts: string[] = [];
  if (d.description.trim()) parts.push(d.description.trim());
  parts.push(lang === "es" ? `Organizador: ${d.organizer.trim()}` : `Organizer: ${d.organizer.trim()}`);
  const catLine =
    d.category === "otro" && d.categoryCustom.trim()
      ? `${lang === "es" ? "Tipo" : "Type"}: ${d.categoryCustom.trim()}`
      : `${lang === "es" ? "Tipo" : "Type"}: ${d.category.trim()}`;
  parts.push(catLine);
  const modeLabel =
    d.mode === "presencial"
      ? lang === "es"
        ? "Presencial"
        : "In person"
      : d.mode === "enLinea"
        ? lang === "es"
          ? "En línea"
          : "Online"
        : lang === "es"
          ? "Híbrida"
          : "Hybrid";
  parts.push(`${lang === "es" ? "Modalidad" : "Mode"}: ${modeLabel}`);
  const cost =
    d.classCostType === "gratis"
      ? lang === "es"
        ? "Gratis"
        : "Free"
      : lang === "es"
        ? "Clase pagada (publicación comercial pendiente)"
        : "Paid class (commercial publish pending)";
  parts.push(`${lang === "es" ? "Costo" : "Cost"}: ${cost}`);
  const wk = formatWeekly(d.weeklySchedule, lang);
  if (wk) parts.push(wk);
  if (d.venue.trim()) parts.push(`${lang === "es" ? "Lugar" : "Venue"}: ${d.venue.trim()}`);
  if (d.addressLine1.trim()) parts.push(`${lang === "es" ? "Dirección" : "Address"}: ${d.addressLine1.trim()}`);
  const site = normalizeWebsiteForOpen(d.website);
  if (site) parts.push(`${lang === "es" ? "Web" : "Web"}: ${site}`);
  const sl = d.socialLinks;
  const socialBits: string[] = [];
  if (normalizeSocialUrlForOpen(sl.facebook)) socialBits.push(`Facebook: ${normalizeSocialUrlForOpen(sl.facebook)}`);
  if (normalizeSocialUrlForOpen(sl.instagram)) socialBits.push(`Instagram: ${normalizeSocialUrlForOpen(sl.instagram)}`);
  if (normalizeSocialUrlForOpen(sl.tiktok)) socialBits.push(`TikTok: ${normalizeSocialUrlForOpen(sl.tiktok)}`);
  if (normalizeSocialUrlForOpen(sl.youtube)) socialBits.push(`YouTube: ${normalizeSocialUrlForOpen(sl.youtube)}`);
  if (normalizeSocialUrlForOpen(sl.xTwitter)) socialBits.push(`X: ${normalizeSocialUrlForOpen(sl.xTwitter)}`);
  if (normalizeSocialUrlForOpen(sl.linkedin)) socialBits.push(`LinkedIn: ${normalizeSocialUrlForOpen(sl.linkedin)}`);
  if (socialBits.length) parts.push((lang === "es" ? "Redes" : "Social") + ":\n" + socialBits.join("\n"));
  return parts.join("\n\n").trim();
}

function buildDescriptionComunidad(d: ComunidadQuickDraft, lang: Lang): string {
  const parts: string[] = [];
  if (d.description.trim()) parts.push(d.description.trim());
  parts.push(lang === "es" ? `Organizador: ${d.organizer.trim()}` : `Organizer: ${d.organizer.trim()}`);
  const catLine =
    d.category === "otro" && d.categoryCustom.trim()
      ? `${lang === "es" ? "Tipo de evento" : "Event type"}: ${d.categoryCustom.trim()}`
      : `${lang === "es" ? "Tipo de evento" : "Event type"}: ${d.category.trim()}`;
  parts.push(catLine);
  const costMap: Record<string, { es: string; en: string }> = {
    gratis: { es: "Gratis", en: "Free" },
    pagado: { es: "Pagado", en: "Paid" },
    donacion: { es: "Donación sugerida", en: "Suggested donation" },
    noConfirmado: { es: "Por confirmar", en: "TBD" },
  };
  const cm = costMap[d.eventCost] ?? { es: d.eventCost, en: d.eventCost };
  parts.push(`${lang === "es" ? "Costo del evento" : "Event cost"}: ${lang === "es" ? cm.es : cm.en}`);
  if ((d.eventCost === "pagado" || d.eventCost === "donacion") && d.admissionNote.trim()) {
    parts.push(`${lang === "es" ? "Nota de admisión" : "Admission"}: ${d.admissionNote.trim()}`);
  }
  if (d.date.trim()) {
    parts.push(`${lang === "es" ? "Fecha" : "Date"}: ${d.date.trim()}`);
    if (d.eventEndDate.trim() && d.eventEndDate >= d.date) {
      parts.push(`${lang === "es" ? "Hasta" : "Through"}: ${d.eventEndDate.trim()}`);
    }
  }
  if (d.eventSessionStart.trim() && d.eventSessionEnd.trim()) {
    parts.push(
      `${lang === "es" ? "Horario puntual" : "One-time hours"}: ${d.eventSessionStart.trim()}–${d.eventSessionEnd.trim()}`,
    );
  }
  const wk = formatWeekly(d.weeklySchedule, lang);
  if (wk) parts.push(wk);
  if (d.venue.trim()) parts.push(`${lang === "es" ? "Lugar" : "Venue"}: ${d.venue.trim()}`);
  if (d.addressLine1.trim()) parts.push(`${lang === "es" ? "Dirección" : "Address"}: ${d.addressLine1.trim()}`);
  const site = normalizeWebsiteForOpen(d.website);
  if (site) parts.push(`${lang === "es" ? "Web" : "Web"}: ${site}`);
  const sl = d.socialLinks;
  const socialBits: string[] = [];
  if (normalizeSocialUrlForOpen(sl.facebook)) socialBits.push(`Facebook: ${normalizeSocialUrlForOpen(sl.facebook)}`);
  if (normalizeSocialUrlForOpen(sl.instagram)) socialBits.push(`Instagram: ${normalizeSocialUrlForOpen(sl.instagram)}`);
  if (normalizeSocialUrlForOpen(sl.tiktok)) socialBits.push(`TikTok: ${normalizeSocialUrlForOpen(sl.tiktok)}`);
  if (normalizeSocialUrlForOpen(sl.youtube)) socialBits.push(`YouTube: ${normalizeSocialUrlForOpen(sl.youtube)}`);
  if (normalizeSocialUrlForOpen(sl.xTwitter)) socialBits.push(`X: ${normalizeSocialUrlForOpen(sl.xTwitter)}`);
  if (normalizeSocialUrlForOpen(sl.linkedin)) socialBits.push(`LinkedIn: ${normalizeSocialUrlForOpen(sl.linkedin)}`);
  if (socialBits.length) parts.push((lang === "es" ? "Redes" : "Social") + ":\n" + socialBits.join("\n"));
  return parts.join("\n\n").trim();
}

function buildDetailPairs(
  kind: CommunityKind,
  d: ClasesQuickDraft | ComunidadQuickDraft,
  lang: Lang,
): Array<{ label: string; value: string }> {
  const pairs: Array<{ label: string; value: string }> = [];
  pairs.push({ label: "Leonix:communityLane", value: "quick" });
  pairs.push({ label: "Leonix:communityKind", value: kind });
  pairs.push({ label: "Leonix:organizer", value: d.organizer.trim() });
  pairs.push({ label: "Leonix:primaryCta", value: d.primaryCta });
  pairs.push({ label: "Leonix:zip", value: d.zip.trim() });
  pairs.push({ label: "Leonix:state", value: d.state.trim() });
  if (d.venue.trim()) pairs.push({ label: "Leonix:venue", value: d.venue.trim() });
  if (d.addressLine1.trim()) pairs.push({ label: "Leonix:addressLine1", value: d.addressLine1.trim() });
  const web = normalizeWebsiteForOpen(d.website);
  if (web) pairs.push({ label: "Leonix:website", value: web });
  const sl = d.socialLinks;
  const sf = normalizeSocialUrlForOpen(sl.facebook);
  if (sf) pairs.push({ label: "Leonix:socialFacebook", value: sf });
  const si = normalizeSocialUrlForOpen(sl.instagram);
  if (si) pairs.push({ label: "Leonix:socialInstagram", value: si });
  const st = normalizeSocialUrlForOpen(sl.tiktok);
  if (st) pairs.push({ label: "Leonix:socialTiktok", value: st });
  const sy = normalizeSocialUrlForOpen(sl.youtube);
  if (sy) pairs.push({ label: "Leonix:socialYoutube", value: sy });
  const sx = normalizeSocialUrlForOpen(sl.xTwitter);
  if (sx) pairs.push({ label: "Leonix:socialXTwitter", value: sx });
  const sln = normalizeSocialUrlForOpen(sl.linkedin);
  if (sln) pairs.push({ label: "Leonix:socialLinkedin", value: sln });
  if (d.smsPhone.trim()) pairs.push({ label: "Leonix:smsPhone", value: digitsOnly(d.smsPhone) });
  if (kind === "clases") {
    const c = d as ClasesQuickDraft;
    pairs.push({ label: "Leonix:classCategory", value: c.category.trim() });
    if (c.category === "otro" && c.categoryCustom.trim()) {
      pairs.push({ label: "Leonix:classCategoryCustom", value: c.categoryCustom.trim() });
    }
    pairs.push({ label: "Leonix:classCostType", value: c.classCostType });
    pairs.push({ label: "Leonix:mode", value: c.mode });
    if (c.classCostType === "pagada") {
      pairs.push({ label: "Leonix:priceAmount", value: c.priceAmount.trim() });
      pairs.push({ label: "Leonix:priceFrequency", value: c.priceFrequency });
      if (c.priceNote.trim()) pairs.push({ label: "Leonix:priceNote", value: c.priceNote.trim() });
    }
    pairs.push({
      label: "Leonix:weeklyScheduleJson",
      value: JSON.stringify(c.weeklySchedule),
    });
  } else {
    const c = d as ComunidadQuickDraft;
    pairs.push({ label: "Leonix:eventCategory", value: c.category.trim() });
    if (c.category === "otro" && c.categoryCustom.trim()) {
      pairs.push({ label: "Leonix:eventCategoryCustom", value: c.categoryCustom.trim() });
    }
    pairs.push({ label: "Leonix:eventCost", value: c.eventCost });
    pairs.push({ label: "Leonix:eventDate", value: c.date.trim() });
    if (c.eventEndDate.trim()) pairs.push({ label: "Leonix:eventEndDate", value: c.eventEndDate.trim() });
    if (c.eventSessionStart.trim()) pairs.push({ label: "Leonix:eventSessionStart", value: c.eventSessionStart.trim() });
    if (c.eventSessionEnd.trim()) pairs.push({ label: "Leonix:eventSessionEnd", value: c.eventSessionEnd.trim() });
    if (c.admissionNote.trim()) pairs.push({ label: "Leonix:admissionNote", value: c.admissionNote.trim() });
    pairs.push({
      label: "Leonix:weeklyScheduleJson",
      value: JSON.stringify(c.weeklySchedule),
    });
  }
  return pairs;
}

function clasesPriceFields(d: ClasesQuickDraft): { price: number; is_free: boolean } {
  if (d.classCostType !== "gratis") return { price: 0, is_free: false };
  return { price: 0, is_free: true };
}

function comunidadPriceFields(d: ComunidadQuickDraft): { price: number; is_free: boolean } {
  if (d.eventCost === "gratis") return { price: 0, is_free: true };
  if (d.eventCost === "pagado") {
    const n = Number(String(d.admissionNote).replace(/[^0-9.]/g, ""));
    return { price: Number.isFinite(n) && n > 0 ? Math.round(n) : 0, is_free: false };
  }
  return { price: 0, is_free: false };
}

export type CommunityQuickPublishToListingsResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string };

export async function publishCommunityQuickToListings(input: {
  kind: CommunityKind;
  draft: ClasesQuickDraft | ComunidadQuickDraft;
  lang: Lang;
}): Promise<CommunityQuickPublishToListingsResult> {
  const { kind, draft: d, lang } = input;
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
    kind === "clases" ? buildDescriptionClases(d as ClasesQuickDraft, lang) : buildDescriptionComunidad(d as ComunidadQuickDraft, lang);
  const pairs = buildDetailPairs(kind, d, lang);
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

  const ins = await insertListingsRowResilient(supabase, insertPayload);
  if (ins.error) {
    return { ok: false, error: ins.error.message };
  }
  const listingId = ins.data?.id;
  if (!listingId) {
    return { ok: false, error: err("No se recibió el ID del anuncio.", "No listing id returned.") };
  }

  const basePath = `${userId}/${listingId}/photos`;
  const photoUrls: string[] = [];

  const markPublishFailedNonPublic = async () => {
    await supabase.from("listings").update({ status: "removed", is_published: false }).eq("id", listingId);
  };

  try {
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
      const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${ext}`;
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

    if (photoUrls.length) {
      const marker = `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;
      const appendix =
        lang === "es"
          ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
          : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;
      const descriptionForUpdate = `${descriptionBase}${appendix}`.trim();
      await supabase.from("listings").update({ description: descriptionForUpdate, images: photoUrls }).eq("id", listingId);
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
