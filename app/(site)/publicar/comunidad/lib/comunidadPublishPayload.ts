import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatWeekly } from "@/app/(site)/publicar/community/shared/lib/communityScheduleText";
import { normalizeWebsiteForOpen } from "@/app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial";
import type { ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import {
  labelCommunityAudience,
  labelCommunityRegistration,
  labelComunidadAccessibilityKey,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

/** Comunidad-owned publish description composer. */
export function buildComunidadDescription(d: ComunidadQuickDraft, lang: Lang): string {
  const parts: string[] = [];
  if (d.description.trim()) parts.push(d.description.trim());
  parts.push(lang === "es" ? `Organizador: ${d.organizer.trim()}` : `Organizer: ${d.organizer.trim()}`);
  parts.push(
    `${lang === "es" ? "Tipo de evento" : "Event type"}: ${resolveComunidadEventTypePublicLabel(d.category, d.categoryCustom, lang)}`,
  );
  const costMap: Record<string, { es: string; en: string }> = {
    gratis: { es: "Gratis", en: "Free" },
    pagado: { es: "Pagado", en: "Paid" },
    donacion: { es: "Donación sugerida", en: "Suggested donation" },
    noConfirmado: { es: "Por confirmar", en: "TBD" },
  };
  const cm = costMap[d.eventCost] ?? { es: d.eventCost, en: d.eventCost };
  parts.push(`${lang === "es" ? "Costo del evento" : "Event cost"}: ${lang === "es" ? cm.es : cm.en}`);
  parts.push(
    `${lang === "es" ? "¿Para quién es?" : "Who is it for?"}: ${labelCommunityAudience(d.audience, lang)}`,
  );
  parts.push(
    `${lang === "es" ? "¿Requiere registro?" : "Registration required?"}: ${labelCommunityRegistration(d.registrationRequired, lang)}`,
  );
  if (d.accessibilityKeys.length) {
    const acc = d.accessibilityKeys.map((k) => labelComunidadAccessibilityKey(k, lang)).join(", ");
    parts.push(`${lang === "es" ? "Acceso" : "Access"}: ${acc}`);
  }
  if (d.bringNote.trim()) {
    parts.push(
      `${lang === "es" ? "Qué deben llevar o saber" : "What to bring or know"}: ${d.bringNote.trim()}`,
    );
  }
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
  /** Social links: detail_pairs + contact canvas only (no raw social URLs in description body). */
  return parts.join("\n\n").trim();
}

/** Comunidad-owned publish detail-pair composer — comunidad-only fields (common fields live in the shared transport file). */
export function buildComunidadDetailPairs(d: ComunidadQuickDraft): Array<{ label: string; value: string }> {
  const pairs: Array<{ label: string; value: string }> = [];
  const el = d.eventLinks;
  const pUrl = normalizeWebsiteForOpen(el.registrationUrl);
  if (pUrl) pairs.push({ label: "Leonix:registrationUrl", value: pUrl });
  const tkUrl = normalizeWebsiteForOpen(el.ticketsUrl);
  if (tkUrl) pairs.push({ label: "Leonix:ticketsUrl", value: tkUrl });
  const doUrl = normalizeWebsiteForOpen(el.donationUrl);
  if (doUrl) pairs.push({ label: "Leonix:donationUrl", value: doUrl });
  const pgUrl = normalizeWebsiteForOpen(el.eventProgramUrl);
  if (pgUrl) pairs.push({ label: "Leonix:eventProgramUrl", value: pgUrl });
  const egUrl = normalizeWebsiteForOpen(el.eventGuideUrl);
  if (egUrl) pairs.push({ label: "Leonix:eventGuideUrl", value: egUrl });
  const vlUrl = normalizeWebsiteForOpen(el.vendorListUrl);
  if (vlUrl) pairs.push({ label: "Leonix:vendorListUrl", value: vlUrl });
  const fvUrl = normalizeWebsiteForOpen(el.foodVendorsUrl);
  if (fvUrl) pairs.push({ label: "Leonix:foodVendorsUrl", value: fvUrl });
  const spUrl = normalizeWebsiteForOpen(el.sponsorsUrl);
  if (spUrl) pairs.push({ label: "Leonix:sponsorsUrl", value: spUrl });
  const c1l = el.customLink1Label.trim();
  const c1u = normalizeWebsiteForOpen(el.customLink1Url);
  if (c1l && c1u) {
    pairs.push({ label: "Leonix:customLink1Label", value: c1l });
    pairs.push({ label: "Leonix:customLink1Url", value: c1u });
  }
  const c2l = el.customLink2Label.trim();
  const c2u = normalizeWebsiteForOpen(el.customLink2Url);
  if (c2l && c2u) {
    pairs.push({ label: "Leonix:customLink2Label", value: c2l });
    pairs.push({ label: "Leonix:customLink2Url", value: c2u });
  }
  pairs.push({ label: "Leonix:eventCategory", value: d.category.trim() });
  if (d.category === "otro" && d.categoryCustom.trim()) {
    pairs.push({ label: "Leonix:eventCategoryCustom", value: d.categoryCustom.trim() });
  }
  pairs.push({ label: "Leonix:eventCost", value: d.eventCost });
  pairs.push({ label: "Leonix:eventDate", value: d.date.trim() });
  if (d.eventEndDate.trim()) pairs.push({ label: "Leonix:eventEndDate", value: d.eventEndDate.trim() });
  if (d.eventSessionStart.trim()) pairs.push({ label: "Leonix:eventSessionStart", value: d.eventSessionStart.trim() });
  if (d.eventSessionEnd.trim()) pairs.push({ label: "Leonix:eventSessionEnd", value: d.eventSessionEnd.trim() });
  if (d.admissionNote.trim()) pairs.push({ label: "Leonix:admissionNote", value: d.admissionNote.trim() });
  pairs.push({
    label: "Leonix:weeklyScheduleJson",
    value: JSON.stringify(d.weeklySchedule),
  });
  if (d.accessibilityKeys.length) {
    pairs.push({ label: "Leonix:accessibility", value: d.accessibilityKeys.join(",") });
  }
  return pairs;
}

export function comunidadPriceFields(d: ComunidadQuickDraft): { price: number; is_free: boolean } {
  if (d.eventCost === "gratis") return { price: 0, is_free: true };
  if (d.eventCost === "pagado") {
    const n = Number(String(d.admissionNote).replace(/[^0-9.]/g, ""));
    return { price: Number.isFinite(n) && n > 0 ? Math.round(n) : 0, is_free: false };
  }
  return { price: 0, is_free: false };
}
