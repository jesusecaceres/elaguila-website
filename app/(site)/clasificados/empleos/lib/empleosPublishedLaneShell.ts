import type { EmpleoJobFairSample } from "@/app/clasificados/empleos/data/empleoJobFairSampleData";
import type { EmpleoPremiumJobSample, PremiumGalleryImage } from "@/app/clasificados/empleos/data/empleoPremiumJobSampleData";
import type { QuickJobDetailSample } from "@/app/clasificados/empleos/data/empleoQuickJobSampleData";
import type { EmpleosJobRecord } from "@/app/clasificados/empleos/data/empleosJobTypes";
import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import {
  empleosFeriaPublicCityState,
  empleosPremiumPublicCityState,
  empleosQuickPublicCityState,
} from "@/app/publicar/empleos/shared/lib/empleosPublicLocation";
import { FALLBACK_IMG } from "@/app/publicar/empleos/shared/required/empleosRequiredForPreview";
import { sanitizeHttpUrl } from "@/app/publicar/empleos/shared/publish/empleosPublishSanitize";

function modalityLabelEs(m: string): string {
  const v = m.toLowerCase();
  if (v === "virtual") return "Virtual";
  if (v === "remoto") return "Remoto";
  if (v.includes("híbrid") || v === "hibrida" || v === "hibrido") return v.endsWith("a") ? "Híbrida" : "Híbrido";
  return "Presencial";
}

export function mapPublishedQuickToShell(job: EmpleosJobRecord, env: EmpleosPublishEnvelope | null): QuickJobDetailSample {
  if (env?.payload.lane === "quick") {
    const d = env.payload.data;
    const loc = empleosQuickPublicCityState({
      city: d.city,
      state: d.state,
      addressCity: d.addressCity,
      addressState: d.addressState,
      addressZip: d.addressZip,
    });
    const imgs = d.images.filter((x) => String(x.url ?? "").trim());
    const main = imgs.find((x) => x.isMain) ?? imgs[0];
    const mainSrc = main?.url && !main.url.startsWith("blob:") ? main.url : job.imageSrc;
    const mainAlt = main?.alt || job.imageAlt;
    const hasAddr = Boolean(d.addressLine1.trim() || d.addressZip.trim());
    const web = sanitizeHttpUrl(d.website);
    return {
      title: d.title || job.title,
      businessName: d.businessName || job.company,
      logoSrc: d.logoUrl?.trim() || undefined,
      logoAlt: d.businessName || job.company,
      city: loc.city,
      state: loc.state,
      filterRegionFootnote: loc.filterRegionFootnote,
      mainImageSrc: mainSrc || FALLBACK_IMG,
      mainImageAlt: mainAlt,
      pay: d.pay || job.salaryLabel,
      jobType: d.jobType || job.jobType,
      schedule: (d.schedule || job.scheduleLabel || "—").trim(),
      workModalityLabel: d.workModality ? modalityLabelEs(d.workModality) : modalityLabelEs(job.modality),
      description: d.description || job.description,
      benefits: [...d.benefits],
      phone: d.phone || job.employerPhone || "",
      whatsapp: d.whatsapp || job.employerWhatsapp || "",
      email: d.email || job.employerEmail || "",
      websiteUrl: web ?? job.employerWebsite,
      primaryCta: d.primaryCta,
      location: hasAddr
        ? {
            businessLine: d.businessName.trim() || job.company,
            addressLine1: d.addressLine1.trim() || "—",
            city: d.addressCity.trim() || loc.city,
            state: d.addressState.trim() || loc.state,
            zip: d.addressZip.trim() || "—",
          }
        : undefined,
      relatedJobs: [],
    };
  }

  const loc = empleosQuickPublicCityState({
    city: job.city,
    state: job.state,
    addressCity: "",
    addressState: "",
    addressZip: job.postalCode ?? "",
  });
  return {
    title: job.title,
    businessName: job.company,
    city: loc.city,
    state: loc.state,
    filterRegionFootnote: loc.filterRegionFootnote,
    mainImageSrc: job.imageSrc,
    mainImageAlt: job.imageAlt,
    pay: job.salaryLabel,
    jobType: job.jobType,
    schedule: job.scheduleLabel || "—",
    workModalityLabel: modalityLabelEs(job.modality),
    description: job.description,
    benefits: [...job.benefits],
    phone: job.employerPhone ?? "",
    whatsapp: job.employerWhatsapp ?? "",
    email: job.employerEmail ?? "",
    websiteUrl: job.employerWebsite,
    primaryCta: job.quickApply ? "email" : "phone",
    location: job.employerAddressLine
      ? {
          businessLine: job.company,
          addressLine1: job.employerAddressLine,
          city: loc.city,
          state: loc.state,
          zip: job.postalCode ?? "—",
        }
      : undefined,
    relatedJobs: [],
  };
}

export function mapPublishedPremiumToShell(job: EmpleosJobRecord, env: EmpleosPublishEnvelope | null): EmpleoPremiumJobSample {
  if (env?.payload.lane === "premium") {
    const d = env.payload.data;
    const imgs: PremiumGalleryImage[] = d.gallery
      .filter((x) => String(x.url ?? "").trim())
      .map((x) => ({ src: x.url, alt: x.alt || "Imagen" }));
    if (!imgs.length) imgs.push({ src: job.imageSrc, alt: job.imageAlt });
    const loc = empleosPremiumPublicCityState({
      city: d.city,
      state: d.state,
      employerAddress: d.employerAddress,
    });
    const locationLabel = d.employerAddress.trim() || `${loc.city}, ${loc.state}`.replace(/^—,\s*/, "");
    return {
      title: d.title,
      companyName: d.companyName,
      logoSrc: d.logoUrl?.trim() || undefined,
      logoAlt: d.companyName,
      city: loc.city,
      state: loc.state,
      filterRegionFootnote: loc.filterRegionFootnote,
      salaryPrimary: d.salaryPrimary,
      salarySecondary: d.salarySecondary.trim() || undefined,
      jobType: d.jobType,
      workModality: d.workModality,
      scheduleLabel: d.scheduleLabel.trim() || undefined,
      locationLabel,
      featured: d.featured,
      premium: d.premium,
      phone: d.phone.trim() || undefined,
      whatsapp: d.whatsapp.trim() || undefined,
      email: d.email.trim() || undefined,
      websiteUrl: d.websiteUrl.trim() || undefined,
      primaryCta: d.primaryCta ?? "apply",
      applyCtaLabel: d.applyLabel.trim() || undefined,
      gallery: imgs,
      introduction: d.introduction,
      responsibilities: d.responsibilities.length ? d.responsibilities : ["—"],
      requirements: d.requirements.length ? d.requirements : ["—"],
      offers: d.offers.length ? d.offers : ["—"],
      companyOverview: d.companyOverview.trim() || undefined,
      employerAddress: d.employerAddress.trim() || undefined,
      relatedJobs: [],
    };
  }

  const locLegacy = empleosPremiumPublicCityState({
    city: job.city,
    state: job.state,
    employerAddress: job.employerAddressLine ?? "",
  });
  return {
    title: job.title,
    companyName: job.company,
    city: locLegacy.city,
    state: locLegacy.state,
    filterRegionFootnote: locLegacy.filterRegionFootnote,
    salaryPrimary: job.salaryLabel,
    jobType: job.jobType,
    workModality: job.modality,
    scheduleLabel: job.scheduleLabel,
    locationLabel: job.employerAddressLine?.trim() || `${locLegacy.city}, ${locLegacy.state}`.replace(/^—,\s*/, ""),
    featured: job.listingTier === "featured",
    premium: job.premiumEmployer,
    phone: job.employerPhone,
    whatsapp: job.employerWhatsapp,
    email: job.employerEmail,
    websiteUrl: job.employerWebsite,
    primaryCta: job.externalApplyUrl ? "apply" : job.employerEmail ? "email" : "website",
    gallery: [{ src: job.imageSrc, alt: job.imageAlt }],
    introduction: job.summary || job.description.slice(0, 400),
    responsibilities: job.description ? [job.description] : ["—"],
    requirements: [...job.requirements],
    offers: [...job.benefits],
    companyOverview: undefined,
    employerAddress: job.employerAddressLine,
    relatedJobs: [],
  };
}

export function mapPublishedFeriaToShell(job: EmpleosJobRecord, env: EmpleosPublishEnvelope | null): EmpleoJobFairSample {
  if (env?.payload.lane === "feria") {
    const d = env.payload.data;
    const flyer = d.flyerImageUrl?.trim() || job.imageSrc;
    const loc = empleosFeriaPublicCityState({ city: d.city, state: d.state, venue: d.venue });
    const baseDetails = d.detailsBullets.map((x) => x.trim()).filter(Boolean);
    const modality = modalityLabelEs(String(d.modality));
    const entry = d.freeEntry ? "Entrada gratuita" : "Entrada con costo";
    const merged = [...new Set([...baseDetails, modality, entry])];
    const modalityNorm = (() => {
      const s = String(d.modality ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (s === "virtual") return "virtual" as const;
      if (s === "hibrida" || s === "hybrid") return "híbrida" as const;
      if (s === "presencial" || s === "inperson" || s === "in_person") return "presencial" as const;
      return undefined;
    })();
    return {
      title: d.title,
      flyerImageSrc: flyer,
      flyerImageAlt: d.flyerAlt || d.title,
      dateLine: d.dateLine,
      timeLine: d.timeLine || undefined,
      venue: d.venue,
      city: d.city,
      state: d.state,
      displayCityState: loc.cityLine,
      filterRegionFootnote: loc.filterRegionFootnote,
      organizer: d.organizer,
      organizerUrl: d.organizerUrl.trim() || undefined,
      detailsBullets: merged.length ? merged : [d.title],
      secondaryDetails: d.secondaryDetails.length ? d.secondaryDetails : undefined,
      ctaIntro: d.ctaIntro,
      ctaLabel: d.ctaLabel.trim() || undefined,
      contactLink: d.contactLink.trim() || undefined,
      contactPhone: d.contactPhone.trim() || undefined,
      contactEmail: d.contactEmail.trim() || undefined,
      modality: modalityNorm,
      freeEntry: d.freeEntry,
      bilingual: d.bilingual,
      industryFocus: d.industryFocus.trim() || undefined,
    };
  }

  const loc = empleosFeriaPublicCityState({
    city: job.city,
    state: job.state,
    venue: job.feriaVenue || "",
  });
  return {
    title: job.title,
    flyerImageSrc: job.imageSrc,
    flyerImageAlt: job.imageAlt,
    dateLine: job.feriaDateLine || "—",
    timeLine: job.feriaTimeLine,
    venue: job.feriaVenue || "—",
    city: job.city,
    state: job.state,
    displayCityState: loc.cityLine,
    filterRegionFootnote: loc.filterRegionFootnote,
    organizer: job.company,
    organizerUrl: job.organizerUrl,
    detailsBullets: [...job.benefits],
    secondaryDetails: job.requirements.length ? [...job.requirements] : undefined,
    ctaIntro: job.summary,
    contactPhone: job.employerPhone,
    contactEmail: job.employerEmail,
    contactLink: job.externalApplyUrl,
    freeEntry: job.freeEntry,
    bilingual: job.bilingual,
    industryFocus: job.industryFocus,
  };
}
