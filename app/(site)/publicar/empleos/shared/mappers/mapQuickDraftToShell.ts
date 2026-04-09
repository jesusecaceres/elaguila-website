import type { QuickJobDetailSample } from "@/app/clasificados/empleos/data/empleoQuickJobSampleData";

import { FALLBACK_IMG } from "../required/empleosRequiredForPreview";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";

function pickMainImage(d: EmpleosQuickDraft): { src: string; alt: string } {
  const withUrl = d.images.filter((x) => String(x.url ?? "").trim());
  if (!withUrl.length) return { src: FALLBACK_IMG, alt: "Imagen del empleo" };
  const main = withUrl.find((x) => x.isMain) ?? withUrl[0];
  return { src: main.url, alt: main.alt || "Imagen principal" };
}

export function mapQuickDraftToShell(d: EmpleosQuickDraft): QuickJobDetailSample {
  const main = pickMainImage(d);
  const hasAddr = Boolean(d.addressLine1.trim() || d.addressZip.trim());
  const finalLoc = hasAddr
    ? {
        businessLine: d.businessName.trim() || "Ubicación",
        addressLine1: d.addressLine1.trim() || "—",
        city: d.addressCity.trim() || d.city.trim(),
        state: d.addressState.trim() || d.state.trim(),
        zip: d.addressZip.trim() || "—",
      }
    : undefined;

  return {
    title: d.title.trim() || "Empleo",
    businessName: d.businessName.trim() || "Empresa",
    logoSrc: d.logoUrl.trim() || undefined,
    logoAlt: d.businessName.trim() || undefined,
    city: d.city.trim() || "—",
    state: d.state.trim() || "—",
    mainImageSrc: main.src,
    mainImageAlt: main.alt,
    pay: d.pay.trim() || "—",
    jobType: d.jobType.trim() || "—",
    schedule: d.schedule.trim() || "—",
    description: d.description.trim() || "—",
    benefits: d.benefitsText
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean),
    phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim(),
    email: d.email.trim(),
    location: finalLoc,
    relatedJobs: [],
  };
}
