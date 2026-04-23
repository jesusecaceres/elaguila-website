import type { JobModalitySlug } from "@/app/clasificados/empleos/data/empleosJobTypes";
import type { QuickJobDetailSample } from "@/app/clasificados/empleos/data/empleoQuickJobSampleData";

import { empleosQuickPublicCityState } from "../lib/empleosPublicLocation";
import { FALLBACK_IMG } from "../required/empleosRequiredForPreview";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";
import { sanitizeHttpUrl } from "../publish/empleosPublishSanitize";

function pickMainImage(d: EmpleosQuickDraft): { src: string; alt: string } {
  const withUrl = d.images.filter((x) => String(x.url ?? "").trim());
  if (!withUrl.length) return { src: FALLBACK_IMG, alt: "Imagen del empleo" };
  const main = withUrl.find((x) => x.isMain) ?? withUrl[0];
  return { src: main.url, alt: main.alt || "Imagen principal" };
}

function modalityLabelEs(m: JobModalitySlug): string {
  if (m === "remoto") return "Remoto";
  if (m === "hibrido") return "Híbrido";
  return "Presencial";
}

function scheduleDisplayFromDraft(d: EmpleosQuickDraft): string {
  const rows = d.scheduleRows.filter((r) => String(r.day ?? "").trim() || String(r.shift ?? "").trim());
  if (!rows.length) return d.schedule.trim() || "—";
  return rows
    .map((r) => {
      const day = String(r.day ?? "").trim();
      const shift = String(r.shift ?? "").trim();
      if (day && shift) return `${day}: ${shift}`;
      return day || shift;
    })
    .join("\n");
}

export function mapQuickDraftToShell(d: EmpleosQuickDraft): QuickJobDetailSample {
  const main = pickMainImage(d);
  const hasAddr = Boolean(d.addressLine1.trim() || d.addressZip.trim());
  const loc = empleosQuickPublicCityState({
    city: d.city,
    state: d.state,
    addressCity: d.addressCity,
    addressState: d.addressState,
    addressZip: d.addressZip,
  });
  const finalLoc = hasAddr
    ? {
        businessLine: d.businessName.trim() || "Ubicación",
        addressLine1: d.addressLine1.trim() || "—",
        city: d.addressCity.trim() || loc.city,
        state: d.addressState.trim() || loc.state,
        zip: d.addressZip.trim() || "—",
      }
    : undefined;

  const web = sanitizeHttpUrl(d.website);

  return {
    title: d.title.trim() || "Empleo",
    businessName: d.businessName.trim() || "Empresa",
    logoSrc: d.logoUrl.trim() || undefined,
    logoAlt: d.businessName.trim() || undefined,
    city: loc.city,
    state: loc.state,
    filterRegionFootnote: loc.filterRegionFootnote,
    mainImageSrc: main.src,
    mainImageAlt: main.alt,
    pay: d.pay.trim() || "—",
    jobType: d.jobType.trim() || "—",
    schedule: scheduleDisplayFromDraft(d),
    workModalityLabel: modalityLabelEs(d.workModality),
    description: d.description.trim() || "—",
    benefits: d.benefits.map((b) => b.trim()).filter(Boolean),
    phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim(),
    email: d.email.trim(),
    websiteUrl: web ?? undefined,
    primaryCta: d.primaryCta,
    location: finalLoc,
    relatedJobs: [],
  };
}
