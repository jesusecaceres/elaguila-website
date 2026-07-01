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
import { syncLegacyPayField, syncPublishPayField } from "../lib/empleosPayDisplay";
import { joinScheduleRowsForPublish } from "../lib/empleosScheduleDisplay";

function joinQuickScheduleForPublish(d: EmpleosQuickDraft): string {
  const joined = joinScheduleRowsForPublish(d.scheduleRows);
  if (joined) return joined;
  return d.schedule.trim();
}

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

function mapVideoUrlsForPublish(items: unknown, legacyUrl?: string): string[] {
  return Array.from(
    new Set(
      [
        ...(Array.isArray(items) ? items : []),
        legacyUrl,
      ]
        .map((u) => String(u ?? "").trim())
        .map((u) => sanitizeHttpUrl(u))
        .filter((u): u is string => Boolean(u)),
    ),
  ).slice(0, 4);
}

export function buildQuickPublishSnapshot(d: EmpleosQuickDraft): EmpleosQuickPublishSnapshot {
  const refs = mapImagesForPublish(d.images);
  const logo = sanitizeHttpUrl(d.logoUrl);
  const vids = mapVideoUrlsForPublish(d.videoUrls, d.videoUrl);
  const vid = vids[0] ?? null;
  const scheduleJoined = joinQuickScheduleForPublish(d);
  const schedRows = d.scheduleRows
    .filter((r) => String(r.day ?? "").trim() || String(r.startTime ?? "").trim() || String(r.shift ?? "").trim() || String(r.note ?? "").trim())
    .map((r) => ({
      day: String(r.day ?? "").trim(),
      dayCustom: String(r.dayCustom ?? "").trim() || undefined,
      shift: String(r.shift ?? "").trim(),
      startTime: String(r.startTime ?? "").trim() || undefined,
      endTime: String(r.endTime ?? "").trim() || undefined,
      note: String(r.note ?? "").trim() || undefined,
    }));
  const payComposed = syncPublishPayField({
    pay: d.pay,
    payAmount: d.payAmount,
    payUnit: d.payUnit,
    payUnitCustom: d.payUnitCustom,
    payNote: d.payNote,
  });
  const catSlug = d.categorySlug.trim();
  const catCustom = catSlug === "otro" ? d.categoryCustom.trim() : "";
  return {
    title: d.title.trim(),
    businessName: d.businessName.trim(),
    categorySlug: catSlug || "oficina",
    categoryCustom: catCustom || undefined,
    experienceLevel: d.experienceLevel,
    workModality: d.workModality,
    city: d.city.trim(),
    state: d.state.trim(),
    jobType: d.jobType === "otro" && d.jobTypeCustom.trim() ? d.jobTypeCustom.trim() : d.jobType.trim(),
    schedule: scheduleJoined,
    scheduleRows: schedRows.length ? schedRows : undefined,
    pay: payComposed.trim(),
    payAmount: d.payAmount.trim() || undefined,
    payUnit: d.payUnit.trim() || undefined,
    payUnitCustom: d.payUnitCustom.trim() || undefined,
    payNote: d.payNote.trim() || undefined,
    description: d.description.trim(),
    benefits: d.benefits.map((b) => b.trim()).filter(Boolean),
    screenerQuestions: d.screenerQuestions.map((s) => s.trim()).filter(Boolean).slice(0, 5),
    images: refs,
    logoUrl: logo,
    applyLink: sanitizeHttpUrl(d.applyLink) || undefined,
    phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim(),
    smsPhone: d.smsPhone.trim() || undefined,
    email: d.email.trim(),
    website: d.website.trim(),
    contactPerson: d.contactPerson.trim() || undefined,
    contactTitle: d.contactTitle.trim() || undefined,
    preferredApplyMethod: d.preferredApplyMethod || undefined,
    primaryCta: d.primaryCta,
    addressLine1: d.addressLine1.trim(),
    addressLine2: d.addressLine2.trim() || undefined,
    workspaceName: d.workspaceName.trim() || undefined,
    locationNotes: d.locationNotes.trim() || undefined,
    addressCity: d.addressCity.trim() || d.city.trim(),
    addressState: d.addressState.trim() || d.stateRegion.trim() || d.state.trim(),
    addressZip: d.addressZip.trim() || d.postalCode.trim(),
    stateRegion: d.stateRegion.trim() || d.addressState.trim() || d.state.trim(),
    postalCode: d.postalCode.trim() || d.addressZip.trim(),
    country: d.country.trim(),
    companyLinkedIn: sanitizeHttpUrl(d.companyLinkedIn) || undefined,
    companyFacebook: sanitizeHttpUrl(d.companyFacebook) || undefined,
    companyInstagram: sanitizeHttpUrl(d.companyInstagram) || undefined,
    companyTikTok: sanitizeHttpUrl(d.companyTikTok) || undefined,
    companyYouTube: sanitizeHttpUrl(d.companyYouTube) || undefined,
    companyX: sanitizeHttpUrl(d.companyX) || undefined,
    companySnapchat: sanitizeHttpUrl(d.companySnapchat) || undefined,
    companyOtherLinkLabel: d.companyOtherLinkLabel.trim() || undefined,
    companyOtherLinkUrl: sanitizeHttpUrl(d.companyOtherLinkUrl) || undefined,
    videoUrl: vid,
    videoUrls: vids,
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
    categoryCustom: d.categorySlug.trim() === "otro" ? d.categoryCustom.trim() || undefined : undefined,
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
    employerAddress: d.employerAddress.trim(),
    phone: d.phone.trim(),
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
    addressLine1: d.addressLine1.trim(),
    addressLine2: d.addressLine2.trim(),
    city: d.city.trim(),
    state: d.stateRegion.trim() || d.state.trim(),
    stateRegion: d.stateRegion.trim() || d.state.trim(),
    postalCode: d.postalCode.trim(),
    country: d.country.trim(),
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
        Boolean(d.videoObjectUrl) ||
        skippedBlob ||
        [d.videoUrl, ...(d.videoUrls ?? [])].some((u) => Boolean(String(u ?? "").trim() && !sanitizeHttpUrl(String(u ?? "")))),
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
