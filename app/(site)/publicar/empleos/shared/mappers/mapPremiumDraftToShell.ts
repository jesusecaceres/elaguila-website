import type { EmpleoPremiumJobSample, PremiumGalleryImage } from "@/app/clasificados/empleos/data/empleoPremiumJobSampleData";

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

  const rating = Number.parseFloat(d.employerRating.replace(",", "."));
  const employerRating = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : undefined;

  return {
    title: d.title.trim() || "Vacante",
    companyName: d.companyName.trim() || "Empresa",
    logoSrc: d.logoUrl.trim() || undefined,
    logoAlt: d.companyName.trim() || undefined,
    city: d.city.trim() || "—",
    state: d.state.trim() || "—",
    salaryPrimary: d.salaryPrimary.trim() || "—",
    salarySecondary: d.salarySecondary.trim() || undefined,
    jobType: d.jobType.trim() || "—",
    locationLabel: `${d.city.trim() || "—"}, ${d.state.trim() || "—"}`,
    featured: d.featured,
    premium: d.premium,
    whatsapp: d.whatsapp.trim() || undefined,
    email: d.email.trim() || undefined,
    websiteUrl: d.websiteUrl.trim() || undefined,
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
    employerRating,
    employerAddress: d.employerAddress.trim() || undefined,
    relatedJobs: [],
  };
}
