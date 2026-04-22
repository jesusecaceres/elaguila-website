import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { EmpleosFeriaDraft } from "../types/empleosFeriaDraft";
import type { EmpleosPremiumDraft } from "../types/empleosPremiumDraft";
import type { EmpleosQuickDraft } from "../types/empleosQuickDraft";
import { defaultEmpleosPaymentHandoff, type EmpleosPaymentHandoffPlaceholder } from "./empleosPaymentHandoff";
import type {
  EmpleosPremiumPublishSnapshot,
  EmpleosPublishEnvelope,
  EmpleosPublishImageRef,
  EmpleosQuickPublishSnapshot,
} from "./empleosPublishSnapshots";
import { sanitizeHttpUrl } from "./empleosPublishSanitize";

function mapImagesForPublish(items: { url: string; alt: string; isMain?: boolean }[]): EmpleosPublishImageRef[] {
  const refs: EmpleosPublishImageRef[] = [];
  for (const x of items) {
    const u = String(x.url ?? "").trim();
    if (u.startsWith("blob:") || u.startsWith("data:")) continue;
    const clean = sanitizeHttpUrl(u);
    if (!clean) continue;
    refs.push({ url: clean, alt: String(x.alt ?? "").trim(), isMain: Boolean(x.isMain) });
  }
  return refs;
}

export function buildQuickPublishSnapshot(d: EmpleosQuickDraft): EmpleosQuickPublishSnapshot {
  const refs = mapImagesForPublish(d.images);
  const logo = sanitizeHttpUrl(d.logoUrl);
  const vid = sanitizeHttpUrl(d.videoUrl);
  return {
    title: d.title.trim(),
    businessName: d.businessName.trim(),
    categorySlug: d.categorySlug.trim(),
    experienceLevel: d.experienceLevel,
    city: d.city.trim(),
    state: d.state.trim(),
    jobType: d.jobType.trim(),
    schedule: d.schedule.trim(),
    pay: d.pay.trim(),
    description: d.description.trim(),
    benefits: d.benefits.map((b) => b.trim()).filter(Boolean),
    screenerQuestions: d.screenerQuestions.map((s) => s.trim()).filter(Boolean).slice(0, 5),
    images: refs,
    logoUrl: logo,
    phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim(),
    email: d.email.trim(),
    website: d.website.trim(),
    primaryCta: d.primaryCta,
    addressLine1: d.addressLine1.trim(),
    addressCity: d.addressCity.trim(),
    addressState: d.addressState.trim(),
    addressZip: d.addressZip.trim(),
    videoUrl: vid,
  };
}

export function quickDraftSkippedBlobImages(d: EmpleosQuickDraft): boolean {
  return d.images.some((x) => {
    const u = String(x.url ?? "").trim();
    return u.startsWith("blob:") || u.startsWith("data:");
  });
}

export function premiumDraftSkippedBlobImages(d: EmpleosPremiumDraft): boolean {
  return d.gallery.some((x) => {
    const u = String(x.url ?? "").trim();
    return u.startsWith("blob:") || u.startsWith("data:");
  });
}

export function buildPremiumPublishSnapshot(d: EmpleosPremiumDraft): EmpleosPremiumPublishSnapshot {
  const refs = mapImagesForPublish(d.gallery);
  const logo = sanitizeHttpUrl(d.logoUrl);
  const vid = sanitizeHttpUrl(d.videoUrl);
  return {
    title: d.title.trim(),
    companyName: d.companyName.trim(),
    categorySlug: d.categorySlug.trim() || "oficina",
    experienceLevel: d.experienceLevel,
    workModality: d.workModality,
    scheduleLabel: d.scheduleLabel.trim(),
    city: d.city.trim(),
    state: d.state.trim(),
    salaryPrimary: d.salaryPrimary.trim(),
    salarySecondary: d.salarySecondary.trim(),
    jobType: d.jobType.trim(),
    featured: d.featured,
    premium: d.premium,
    screenerQuestions: d.screenerQuestions.map((s) => s.trim()).filter(Boolean).slice(0, 5),
    gallery: refs,
    logoUrl: logo,
    applyLabel: d.applyLabel.trim(),
    websiteUrl: d.websiteUrl.trim(),
    whatsapp: d.whatsapp.trim(),
    email: d.email.trim(),
    primaryCta: d.primaryCta,
    introduction: d.introduction.trim(),
    responsibilities: d.responsibilities.map((x) => x.trim()).filter(Boolean),
    requirements: d.requirements.map((x) => x.trim()).filter(Boolean),
    offers: d.offers.map((x) => x.trim()).filter(Boolean),
    companyOverview: d.companyOverview.trim(),
    employerRating: d.employerRating.trim(),
    employerAddress: d.employerAddress.trim(),
    reviewCount: d.reviewCount.trim(),
    videoUrl: vid,
  };
}

export function buildFeriaPublishSnapshot(d: EmpleosFeriaDraft) {
  const flyer = sanitizeHttpUrl(d.flyerImageUrl);
  return {
    title: d.title.trim(),
    flyerImageUrl: flyer,
    flyerAlt: d.flyerAlt.trim(),
    dateLine: d.dateLine.trim(),
    timeLine: d.timeLine.trim(),
    venue: d.venue.trim(),
    city: d.city.trim(),
    state: d.state.trim(),
    organizer: d.organizer.trim(),
    organizerUrl: d.organizerUrl.trim(),
    modality: d.modality,
    freeEntry: d.freeEntry,
    bilingual: d.bilingual,
    industryFocus: d.industryFocus.trim(),
    detailsBullets: d.detailsBullets.map((x) => x.trim()).filter(Boolean),
    secondaryDetails: d.secondaryDetails.map((x) => x.trim()).filter(Boolean),
    ctaIntro: d.ctaIntro.trim(),
    contactLink: d.contactLink.trim(),
    contactPhone: d.contactPhone.trim(),
    contactEmail: d.contactEmail.trim(),
    ctaLabel: d.ctaLabel.trim(),
  };
}

function envelopeBase(
  lang: Lang,
  payload: EmpleosPublishEnvelope["payload"],
  mediaReferences: EmpleosPublishEnvelope["mediaReferences"],
  payment?: EmpleosPaymentHandoffPlaceholder
): EmpleosPublishEnvelope {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    category: "empleos",
    lane: payload.lane,
    language: lang,
    listingStatus: "ready_for_publish",
    listingId: null,
    ownerId: null,
    createdAt: null,
    updatedAt: now,
    publishedAt: null,
    payload,
    moderationNote: null,
    mediaReferences,
    payment: payment ?? defaultEmpleosPaymentHandoff(),
  };
}

export function buildEmpleosPublishEnvelopeFromQuick(d: EmpleosQuickDraft, lang: Lang): EmpleosPublishEnvelope {
  const data = buildQuickPublishSnapshot(d);
  const primary = data.images.find((x) => x.isMain)?.url ?? data.images[0]?.url ?? null;
  const skippedBlob = quickDraftSkippedBlobImages(d);
  return envelopeBase(
    lang,
    { lane: "quick", data },
    {
      primaryImageUrl: primary,
      imageUrls: data.images.map((r) => r.url),
      hasDraftOnlyVideo:
        Boolean(d.videoObjectUrl) || skippedBlob || Boolean(String(d.videoUrl ?? "").trim() && !sanitizeHttpUrl(d.videoUrl)),
    }
  );
}

export function buildEmpleosPublishEnvelopeFromPremium(d: EmpleosPremiumDraft, lang: Lang): EmpleosPublishEnvelope {
  const data = buildPremiumPublishSnapshot(d);
  const primary = data.gallery.find((x) => x.isMain)?.url ?? data.gallery[0]?.url ?? null;
  const skippedBlob = premiumDraftSkippedBlobImages(d);
  return envelopeBase(
    lang,
    { lane: "premium", data },
    {
      primaryImageUrl: primary,
      imageUrls: data.gallery.map((r) => r.url),
      hasDraftOnlyVideo:
        Boolean(d.videoObjectUrl) || skippedBlob || Boolean(String(d.videoUrl ?? "").trim() && !sanitizeHttpUrl(d.videoUrl)),
    }
  );
}

export function buildEmpleosPublishEnvelopeFromFeria(d: EmpleosFeriaDraft, lang: Lang): EmpleosPublishEnvelope {
  const data = buildFeriaPublishSnapshot(d);
  const flyer = data.flyerImageUrl;
  const hasBlobFlyer = Boolean(d.flyerImageUrl?.startsWith("blob:") || d.flyerImageUrl?.startsWith("data:"));
  return envelopeBase(
    lang,
    { lane: "feria", data },
    {
      primaryImageUrl: flyer,
      imageUrls: flyer ? [flyer] : [],
      hasDraftOnlyVideo: hasBlobFlyer,
    }
  );
}
