import type { EmpleosPublishEnvelope } from "../publish/empleosPublishSnapshots";
import type { EmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import { normalizeEmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import type { EmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import { normalizeEmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";
import { normalizeEmpleosQuickDraft } from "../types/empleosQuickDraft";
import { newImageId, type EmpleosImageItem } from "../media/empleosMediaTypes";

function imagesFromRefs(refs: { url: string; alt: string; isMain: boolean }[]): EmpleosImageItem[] {
  return refs.map((r) => ({ id: newImageId(), url: r.url, alt: r.alt, isMain: r.isMain }));
}

export function hydrateQuickDraftFromEnvelope(e: EmpleosPublishEnvelope): EmpleosQuickDraft | null {
  if (e.payload.lane !== "quick") return null;
  const d = e.payload.data;
  return normalizeEmpleosQuickDraft({
    title: d.title,
    businessName: d.businessName,
    categorySlug: d.categorySlug,
    experienceLevel: d.experienceLevel,
    state: d.state,
    jobType: d.jobType,
    schedule: d.schedule,
    pay: d.pay,
    description: d.description,
    benefits: d.benefits,
    screenerQuestions: d.screenerQuestions,
    images: imagesFromRefs(d.images),
    logoUrl: d.logoUrl ?? "",
    phone: d.phone,
    whatsapp: d.whatsapp,
    email: d.email,
    website: d.website,
    primaryCta: d.primaryCta,
    addressLine1: d.addressLine1,
    addressCity: d.addressCity,
    addressState: d.addressState,
    addressZip: d.addressZip,
    videoUrl: d.videoUrl ?? "",
  });
}

export function hydratePremiumDraftFromEnvelope(e: EmpleosPublishEnvelope): EmpleosPremiumDraft | null {
  if (e.payload.lane !== "premium") return null;
  const d = e.payload.data;
  return normalizeEmpleosPremiumDraft({
    title: d.title,
    companyName: d.companyName,
    categorySlug: d.categorySlug,
    experienceLevel: d.experienceLevel,
    workModality: d.workModality,
    scheduleLabel: d.scheduleLabel,
    state: d.state,
    salaryPrimary: d.salaryPrimary,
    salarySecondary: d.salarySecondary,
    jobType: d.jobType,
    featured: d.featured,
    premium: d.premium,
    screenerQuestions: d.screenerQuestions,
    gallery: imagesFromRefs(d.gallery),
    logoUrl: d.logoUrl ?? "",
    applyLabel: d.applyLabel,
    websiteUrl: d.websiteUrl,
    whatsapp: d.whatsapp,
    email: d.email,
    primaryCta: d.primaryCta,
    introduction: d.introduction,
    responsibilities: d.responsibilities,
    requirements: d.requirements,
    offers: d.offers,
    companyOverview: d.companyOverview,
    employerRating: d.employerRating,
    employerAddress: d.employerAddress,
    reviewCount: d.reviewCount,
    videoUrl: d.videoUrl ?? "",
  });
}

export function hydrateFeriaDraftFromEnvelope(e: EmpleosPublishEnvelope): EmpleosFeriaDraft | null {
  if (e.payload.lane !== "feria") return null;
  const d = e.payload.data;
  return normalizeEmpleosFeriaDraft({
    title: d.title,
    flyerImageUrl: d.flyerImageUrl ?? "",
    flyerAlt: d.flyerAlt,
    dateLine: d.dateLine,
    timeLine: d.timeLine,
    venue: d.venue,
    state: d.state,
    organizer: d.organizer,
    organizerUrl: d.organizerUrl,
    modality: d.modality as EmpleosFeriaDraft["modality"],
    freeEntry: d.freeEntry,
    bilingual: d.bilingual,
    industryFocus: d.industryFocus,
    detailsBullets: d.detailsBullets,
    secondaryDetails: d.secondaryDetails,
    ctaIntro: d.ctaIntro,
    contactLink: d.contactLink,
    contactPhone: d.contactPhone,
    contactEmail: d.contactEmail,
    ctaLabel: d.ctaLabel,
  });
}
