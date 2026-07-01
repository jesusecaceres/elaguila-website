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
  const rows =
    d.scheduleRows?.map((r) => ({
      day: String(r.day ?? "").trim(),
      dayCustom: String((r as { dayCustom?: string }).dayCustom ?? "").trim(),
      shift: String(r.shift ?? "").trim(),
      startTime: String((r as { startTime?: string }).startTime ?? "").trim(),
      endTime: String((r as { endTime?: string }).endTime ?? "").trim(),
      note: String((r as { note?: string }).note ?? "").trim(),
    })) ?? [];
  const scheduleRows =
    rows.some((r) => r.day || r.shift || r.startTime || r.endTime || r.note)
      ? rows
      : d.schedule.trim()
        ? [{ day: "", dayCustom: "", shift: d.schedule.trim(), startTime: "", endTime: "", note: "" }]
        : undefined;
  return normalizeEmpleosQuickDraft({
    title: d.title,
    businessName: d.businessName,
    categorySlug: d.categorySlug,
    categoryCustom: d.categoryCustom ?? "",
    experienceLevel: d.experienceLevel,
    workModality: d.workModality,
    city: d.city,
    state: d.state,
    jobType: d.jobType,
    schedule: d.schedule,
    scheduleRows,
    pay: d.pay,
    payAmount: d.payAmount ?? "",
    payUnit: d.payUnit ?? "",
    payUnitCustom: d.payUnitCustom ?? "",
    payNote: d.payNote ?? "",
    description: d.description,
    benefits: d.benefits,
    screenerQuestions: d.screenerQuestions,
    images: imagesFromRefs(d.images),
    logoUrl: d.logoUrl ?? "",
    applyLink: d.applyLink ?? "",
    phone: d.phone,
    whatsapp: d.whatsapp,
    smsPhone: d.smsPhone ?? "",
    email: d.email,
    website: d.website,
    contactPerson: d.contactPerson ?? "",
    contactTitle: d.contactTitle ?? "",
    preferredApplyMethod: (d.preferredApplyMethod as EmpleosQuickDraft["preferredApplyMethod"]) ?? "phone",
    primaryCta: d.primaryCta,
    jobTypeCustom: "",
    addressLine1: d.addressLine1,
    addressLine2: d.addressLine2 ?? "",
    workspaceName: d.workspaceName ?? "",
    locationNotes: d.locationNotes ?? "",
    addressCity: d.addressCity,
    addressState: d.addressState,
    addressZip: d.addressZip,
    stateRegion: d.stateRegion ?? d.addressState ?? d.state,
    postalCode: d.postalCode ?? d.addressZip,
    country: d.country ?? "",
    companyLinkedIn: d.companyLinkedIn ?? "",
    companyFacebook: d.companyFacebook ?? "",
    companyInstagram: d.companyInstagram ?? "",
    companyTikTok: d.companyTikTok ?? "",
    companyYouTube: d.companyYouTube ?? "",
    companyX: d.companyX ?? "",
    companySnapchat: d.companySnapchat ?? "",
    companyOtherLinkLabel: d.companyOtherLinkLabel ?? "",
    companyOtherLinkUrl: d.companyOtherLinkUrl ?? "",
    videoUrl: d.videoUrl ?? "",
    videoUrls: d.videoUrls ?? (d.videoUrl ? [d.videoUrl] : []),
  });
}

export function hydratePremiumDraftFromEnvelope(e: EmpleosPublishEnvelope): EmpleosPremiumDraft | null {
  if (e.payload.lane !== "premium") return null;
  const d = e.payload.data;
  return normalizeEmpleosPremiumDraft({
    title: d.title,
    companyName: d.companyName,
    categorySlug: d.categorySlug,
    categoryCustom: d.categoryCustom ?? "",
    experienceLevel: d.experienceLevel,
    workModality: d.workModality,
    scheduleLabel: d.scheduleLabel,
    city: d.city,
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
    phone: d.phone ?? "",
    whatsapp: d.whatsapp,
    email: d.email,
    primaryCta: d.primaryCta,
    introduction: d.introduction,
    responsibilities: d.responsibilities,
    requirements: d.requirements,
    offers: d.offers,
    companyOverview: d.companyOverview,
    employerAddress: d.employerAddress,
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
    addressLine1: d.addressLine1 ?? "",
    addressLine2: d.addressLine2 ?? "",
    city: d.city,
    state: d.stateRegion ?? d.state,
    stateRegion: d.stateRegion ?? d.state,
    postalCode: d.postalCode ?? "",
    country: d.country ?? "",
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
