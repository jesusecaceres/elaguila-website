import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { sanitizeHttpUrl } from "@/app/publicar/empleos/shared/publish/empleosPublishSanitize";

import { COMMUNITY_DISCOVERY_REGION } from "../constants/communityRegion";
import type {
  ClasesQuickDraft,
  ComunidadQuickDraft,
  CommunityCommonDraft,
  CommunityPublishConfirmations,
  CommunitySocialLinks,
} from "../types/communityQuickDraft";
import { normalizeSocialUrlForOpen, normalizeWebsiteForOpen } from "../lib/communityWebsiteAndSocial";
import type {
  ClasesQuickPublishSnapshot,
  ComunidadQuickPublishSnapshot,
  CommunityPublishEnvelope,
  CommunityPublishImageRef,
} from "./communityPublishSnapshots";

function mapImagesForPublish(
  items: { url: string; alt: string; isMain?: boolean; attachmentMime?: string }[]
): CommunityPublishImageRef[] {
  const refs: CommunityPublishImageRef[] = [];
  for (const x of items) {
    const u = String(x.url ?? "").trim();
    if (!u) continue;
    if (u.startsWith("blob:") || u.startsWith("data:")) continue;
    const clean = sanitizeHttpUrl(u);
    if (!clean) continue;
    const mime = String(x.attachmentMime ?? "").trim() || undefined;
    refs.push({
      url: clean,
      alt: String(x.alt ?? "").trim(),
      isMain: Boolean(x.isMain),
      ...(mime ? { mimeType: mime } : {}),
    });
  }
  return refs;
}

function snapshotSocialLinks(sl: CommunitySocialLinks): CommunitySocialLinks {
  return {
    facebook: normalizeSocialUrlForOpen(sl.facebook) ?? "",
    instagram: normalizeSocialUrlForOpen(sl.instagram) ?? "",
    tiktok: normalizeSocialUrlForOpen(sl.tiktok) ?? "",
    youtube: normalizeSocialUrlForOpen(sl.youtube) ?? "",
    xTwitter: normalizeSocialUrlForOpen(sl.xTwitter) ?? "",
    linkedin: normalizeSocialUrlForOpen(sl.linkedin) ?? "",
  };
}

function commonSnapshot(d: CommunityCommonDraft): {
  title: string;
  organizer: string;
  category: string;
  categoryCustom?: string;
  description: string;
  images: CommunityPublishImageRef[];
  phone: string;
  whatsapp: string;
  smsPhone: string;
  email: string;
  website: string;
  socialLinks: CommunitySocialLinks;
  primaryCta: CommunityCommonDraft["primaryCta"];
  venue: string;
  addressLine1: string;
  publicCity: string;
  state: string;
  zip: string;
  discoveryRegion: "NorCal";
  publishConfirmations: CommunityPublishConfirmations;
  audience: string;
  registrationRequired: string;
  bringNote: string;
} {
  const images = mapImagesForPublish(d.images);
  const cat = d.category.trim();
  return {
    title: d.title.trim(),
    organizer: d.organizer.trim(),
    category: cat,
    categoryCustom: cat === "otro" ? d.categoryCustom.trim() || undefined : undefined,
    description: d.description.trim(),
    images,
    phone: d.phone.trim(),
    whatsapp: d.whatsapp.trim(),
    smsPhone: d.smsPhone.trim(),
    email: d.email.trim(),
    website: normalizeWebsiteForOpen(d.website) ?? d.website.trim(),
    socialLinks: snapshotSocialLinks(d.socialLinks),
    primaryCta: d.primaryCta,
    venue: d.venue.trim(),
    addressLine1: d.addressLine1.trim(),
    publicCity: (() => {
      const t = d.publicCity.trim();
      return t ? getCanonicalCityName(t) || "" : "";
    })(),
    state: d.state.trim(),
    zip: d.zip.trim(),
    discoveryRegion: COMMUNITY_DISCOVERY_REGION,
    publishConfirmations: { ...d.publishConfirmations },
    audience: d.audience.trim(),
    registrationRequired: d.registrationRequired.trim(),
    bringNote: d.bringNote.trim(),
  };
}

function draftSkippedBlobImages(d: { images: { url: string }[] }): boolean {
  return d.images.some((x) => {
    const u = String(x.url ?? "").trim();
    return u.startsWith("blob:") || u.startsWith("data:");
  });
}

export function buildClasesQuickPublishSnapshot(d: ClasesQuickDraft): ClasesQuickPublishSnapshot {
  const base = commonSnapshot(d);
  const isPaid = d.classCostType === "pagada";
  return {
    ...base,
    kind: "clases",
    classCostType: d.classCostType,
    priceAmount: isPaid ? d.priceAmount.trim() : "",
    priceFrequency: isPaid ? d.priceFrequency : "",
    priceNote: d.priceNote.trim(),
    mode: d.mode,
    weeklySchedule: d.weeklySchedule.map((r) => ({
      day: r.day,
      closed: r.closed,
      open: r.open.trim(),
      close: r.close.trim(),
    })),
    skillLevel: d.skillLevel.trim(),
  };
}

export function buildComunidadQuickPublishSnapshot(
  d: ComunidadQuickDraft
): ComunidadQuickPublishSnapshot {
  const base = commonSnapshot(d);
  return {
    ...base,
    kind: "comunidad",
    eventCost: d.eventCost,
    admissionNote: d.admissionNote.trim(),
    date: d.date.trim(),
    eventEndDate: d.eventEndDate.trim(),
    eventSessionStart: d.eventSessionStart.trim(),
    eventSessionEnd: d.eventSessionEnd.trim(),
    weeklySchedule: d.weeklySchedule.map((r) => ({
      day: r.day,
      closed: r.closed,
      open: r.open.trim(),
      close: r.close.trim(),
    })),
    accessibilityKeys: [...d.accessibilityKeys],
  };
}

function envelopeBase(
  category: "clases" | "comunidad",
  lang: Lang,
  payload: CommunityPublishEnvelope["payload"],
  mediaReferences: CommunityPublishEnvelope["mediaReferences"],
  payment: CommunityPublishEnvelope["payment"]
): CommunityPublishEnvelope {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    category,
    lane: "quick",
    language: lang,
    listingStatus: "ready_for_publish",
    listingId: null,
    ownerId: null,
    createdAt: null,
    updatedAt: now,
    publishedAt: null,
    payload,
    mediaReferences,
    payment,
  };
}

export function buildClasesQuickPublishEnvelope(
  d: ClasesQuickDraft,
  lang: Lang
): CommunityPublishEnvelope {
  const data = buildClasesQuickPublishSnapshot(d);
  const primary = data.images.find((x) => x.isMain)?.url ?? data.images[0]?.url ?? null;
  const requiresAdvertiserPayment = d.classCostType === "pagada";
  return envelopeBase(
    "clases",
    lang,
    { lane: "quick", data },
    {
      primaryImageUrl: primary,
      imageUrls: data.images.map((r) => r.url),
      hasDraftOnlyMedia: draftSkippedBlobImages(d),
    },
    {
      requiresAdvertiserPayment,
      status: requiresAdvertiserPayment ? "paid_class_pending" : "none",
    }
  );
}

export function buildComunidadQuickPublishEnvelope(
  d: ComunidadQuickDraft,
  lang: Lang
): CommunityPublishEnvelope {
  const data = buildComunidadQuickPublishSnapshot(d);
  const primary = data.images.find((x) => x.isMain)?.url ?? data.images[0]?.url ?? null;
  return envelopeBase(
    "comunidad",
    lang,
    { lane: "quick", data },
    {
      primaryImageUrl: primary,
      imageUrls: data.images.map((r) => r.url),
      hasDraftOnlyMedia: draftSkippedBlobImages(d),
    },
    { requiresAdvertiserPayment: false, status: "none" }
  );
}
