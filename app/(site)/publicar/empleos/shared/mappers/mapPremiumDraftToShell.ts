import type { EmpleoPremiumJobSample, PremiumGalleryImage } from "@/app/clasificados/empleos/data/empleoPremiumJobSampleData";

import { empleosPremiumPublicCityState } from "../lib/empleosPublicLocation";
import { FALLBACK_IMG } from "../required/empleosRequiredForPreview";
import type { EmpleosPremiumDraft } from "../types/empleosPremiumDraft";

export function mapPremiumDraftToShell(d: EmpleosPremiumDraft): EmpleoPremiumJobSample {
  const imgs = d.gallery
    .filter((x) => String(x.url ?? "").trim())
    .map(
      (x): PremiumGalleryImage => ({
        src: x.url,
        alt: x.alt || "Imagen",
      })
    );
  if (!imgs.length) imgs.push({ src: FALLBACK_IMG, alt: "Imagen" });

  const loc = empleosPremiumPublicCityState({
    city: d.city,
    state: d.state,
    employerAddress: d.employerAddress,
  });
  const addr = d.employerAddress.trim();
  const locationLabel = addr || `${loc.city}, ${loc.state}`.replace(/^—,\s*/, "");

  return {
    title: d.title.trim() || "Vacante",
    companyName: d.companyName.trim() || "Empresa",
    logoSrc: d.logoUrl.trim() || undefined,
    logoAlt: d.companyName.trim() || undefined,
    city: loc.city,
    state: loc.state,
    filterRegionFootnote: loc.filterRegionFootnote,
    salaryPrimary: d.salaryPrimary.trim() || "—",
    salarySecondary: d.salarySecondary.trim() || undefined,
    jobType: d.jobType.trim() || "—",
    workModality: d.workModality,
    scheduleLabel: d.scheduleLabel.trim() || undefined,
    locationLabel,
    featured: d.featured,
    premium: d.premium,
    phone: d.phone.trim() || undefined,
    whatsapp: d.whatsapp.trim() || undefined,
    email: d.email.trim() || undefined,
    websiteUrl: d.websiteUrl.trim() || undefined,
    primaryCta: d.primaryCta,
    applyCtaLabel: d.applyLabel.trim() || undefined,
    gallery: imgs,
    introduction: d.introduction.trim() || "—",
    responsibilities: d.responsibilities.map((x) => x.trim()).filter(Boolean).length
      ? d.responsibilities.map((x) => x.trim()).filter(Boolean)
      : ["—"],
    requirements: d.requirements.map((x) => x.trim()).filter(Boolean).length
      ? d.requirements.map((x) => x.trim()).filter(Boolean)
      : ["—"],
    offers: d.offers.map((x) => x.trim()).filter(Boolean).length ? d.offers.map((x) => x.trim()).filter(Boolean) : ["—"],
    companyOverview: d.companyOverview.trim() || undefined,
    employerAddress: d.employerAddress.trim() || undefined,
    relatedJobs: [],
  };
}
