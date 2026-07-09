import type { ServiciosApplicationDraft, ServiciosApplicationPromoDraft } from "../types/serviciosApplicationDraft";
import type {
  ServiciosAboutBlock,
  ServiciosBusinessProfile,
  ServiciosContactBlock,
  ServiciosCouponWire,
  ServiciosCredentialsWire,
  ServiciosGalleryImage,
  ServiciosGalleryVideo,
  ServiciosHeroBadge,
  ServiciosHeroBlock,
  ServiciosIdentity,
  ServiciosPromoOffer,
  ServiciosQuickFact,
  ServiciosReview,
  ServiciosServiceAreasBlock,
  ServiciosBusinessHighlightItem,
  ServiciosServiceCard,
  ServiciosTrustItem,
} from "../types/serviciosBusinessProfile";
import { MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS } from "./serviciosGalleryVideoCaps";
import type { ServiciosApplicationCouponDraft } from "../types/serviciosApplicationDraft";
import {
  sanitizeCustomPaymentMethodLabels,
  sanitizeServiciosPaymentMethodIds,
} from "./serviciosPaymentMethodCatalog";
import {
  sanitizeCustomServiciosAmenityLabels,
  sanitizeServiciosAmenityOptionIds,
} from "./serviciosAmenitiesCatalog";
import { sanitizeCertificationLabels } from "./serviciosCredentialsCatalog";

function trim(s: string | undefined | null): string {
  return typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "";
}

/**
 * Build hero category line: explicit categoryLine wins; else primaryCategory + subcategory.
 */
export function buildHeroCategoryLineFromDraft(hero: ServiciosApplicationDraft["hero"]): string | undefined {
  const explicit = trim(hero.categoryLine);
  if (explicit) return explicit;
  const a = trim(hero.primaryCategory);
  const b = trim(hero.subcategory);
  if (a && b) return `${a} · ${b}`;
  if (a) return a;
  if (b) return b;
  return undefined;
}

/**
 * Deterministic map: one application field group → one place on the wire profile.
 * Heavy sanitization stays in `resolveServiciosProfile`.
 */
export function mapServiciosApplicationDraftToBusinessProfile(draft: ServiciosApplicationDraft): ServiciosBusinessProfile {
  const identity: ServiciosIdentity = {
    slug: trim(draft.identity?.slug) || "profile",
    businessName: trim(draft.identity?.businessName),
  };
  if (draft.identity?.leonixVerified === true) {
    identity.leonixVerified = true;
  }

  const hero: ServiciosHeroBlock = {};
  const cat = buildHeroCategoryLineFromDraft(draft.hero);
  if (cat) hero.categoryLine = cat;
  const logoUrl = trim(draft.hero.logoUrl);
  if (logoUrl) hero.logoUrl = logoUrl;
  const logoAlt = trim(draft.hero.logoAlt);
  if (logoAlt) hero.logoAlt = logoAlt;
  const coverImageUrl = trim(draft.hero.coverImageUrl);
  if (coverImageUrl) hero.coverImageUrl = coverImageUrl;
  const coverImageAlt = trim(draft.hero.coverImageAlt);
  if (coverImageAlt) hero.coverImageAlt = coverImageAlt;
  if (draft.hero.rating != null && typeof draft.hero.rating === "number" && !Number.isNaN(draft.hero.rating)) {
    hero.rating = draft.hero.rating;
  }
  if (
    draft.hero.reviewCount != null &&
    typeof draft.hero.reviewCount === "number" &&
    !Number.isNaN(draft.hero.reviewCount)
  ) {
    hero.reviewCount = Math.floor(draft.hero.reviewCount);
  }
  const locationSummary = trim(draft.hero.locationSummary);
  if (locationSummary) hero.locationSummary = locationSummary;
  const stateValue = trim(draft.hero.state);
  if (stateValue) hero.state = stateValue;
  const countryValue = trim(draft.hero.country);
  if (countryValue) hero.country = countryValue;

  const badges = mapHeroBadges(draft.hero.badges);
  if (badges.length) hero.badges = badges;

  const contact: ServiciosContactBlock = {};
  const phone = trim(draft.contact?.phone);
  if (phone) contact.phone = phone;
  const phoneOffice = trim(draft.contact?.phoneOffice);
  if (phoneOffice) contact.phoneOffice = phoneOffice;
  const quoteMessagePhone = trim(draft.contact?.quoteMessagePhone);
  if (quoteMessagePhone) contact.quoteMessagePhone = quoteMessagePhone;
  const email = trim(draft.contact?.email);
  if (email) contact.email = email;
  const websiteUrl = trim(draft.contact?.websiteUrl);
  if (websiteUrl) contact.websiteUrl = websiteUrl;
  const websiteLabel = trim(draft.contact?.websiteLabel);
  if (websiteLabel) contact.websiteLabel = websiteLabel;
  if (draft.contact?.messageEnabled === true) contact.messageEnabled = true;

  const openNow = trim(draft.contact?.hoursOpenNowLabel);
  const today = trim(draft.contact?.hoursTodayLine);
  const weeklyWire = (draft.contact?.weeklyHoursRows ?? [])
    .map((r) => ({
      dayLabel: trim(typeof r?.dayLabel === "string" ? r.dayLabel : ""),
      line: trim(typeof r?.line === "string" ? r.line : ""),
    }))
    .filter((r) => r.dayLabel && r.line);
  if (openNow && today) {
    contact.hours = {
      openNowLabel: openNow,
      todayHoursLine: today,
      ...(weeklyWire.length ? { weeklyRows: weeklyWire } : {}),
    };
  } else if (weeklyWire.length >= 3) {
    contact.hours = { weeklyRows: weeklyWire };
  }

  const primaryCta = trim(draft.contact?.primaryCtaLabel);
  if (primaryCta) contact.primaryCtaLabel = primaryCta;
  const secondaryLabels = (draft.contact?.secondaryCtaLabels ?? [])
    .map((s) => trim(typeof s === "string" ? s : ""))
    .filter(Boolean);
  if (secondaryLabels.length) contact.secondaryCtaLabels = secondaryLabels;
  if (draft.contact?.isFeatured === true) {
    contact.isFeatured = true;
    const fl = trim(draft.contact?.featuredLabel);
    if (fl) contact.featuredLabel = fl;
  }

  const c = draft.contact;
  const socialLinks: NonNullable<ServiciosContactBlock["socialLinks"]> = {};
  const sIg = trim(c?.socialInstagramUrl);
  if (sIg) socialLinks.instagramUrl = sIg;
  const sFb = trim(c?.socialFacebookUrl);
  if (sFb) socialLinks.facebookUrl = sFb;
  const sYt = trim(c?.socialYoutubeUrl);
  if (sYt) socialLinks.youtubeUrl = sYt;
  const sTk = trim(c?.socialTiktokUrl);
  if (sTk) socialLinks.tiktokUrl = sTk;
  const sLi = trim(c?.socialLinkedinUrl);
  if (sLi) socialLinks.linkedinUrl = sLi;
  const sWa = trim(c?.socialWhatsappUrl);
  if (sWa) socialLinks.whatsappUrl = sWa;
  const sWaProfile = trim(c?.socialWhatsappProfileUrl);
  if (sWaProfile) socialLinks.whatsappProfileUrl = sWaProfile;
  const sX = trim(c?.socialXUrl);
  if (sX) socialLinks.xUrl = sX;
  const sSc = trim(c?.socialSnapchatUrl);
  if (sSc) socialLinks.snapchatUrl = sSc;
  const sGb = trim(c?.googleBusinessUrl);
  if (sGb) socialLinks.googleBusinessUrl = sGb;
  if (Object.keys(socialLinks).length > 0) {
    contact.socialLinks = socialLinks;
  }

  const reviewLinks: NonNullable<ServiciosContactBlock["externalReviewLinks"]> = {};
  const gRev = trim(c?.googleReviewsUrl);
  if (gRev) reviewLinks.googleReviewsUrl = gRev;
  const yRev = trim(c?.yelpReviewsUrl);
  if (yRev) reviewLinks.yelpReviewsUrl = yRev;
  if (Object.keys(reviewLinks).length > 0) {
    contact.externalReviewLinks = reviewLinks;
  }

  const extraWire = (c?.extraLinks ?? [])
    .map((row) => {
      const url = trim(typeof row?.url === "string" ? row.url : "");
      if (!url) return null;
      const label = trim(typeof row?.label === "string" ? row.label : "").slice(0, 48);
      return { url, ...(label ? { label } : {}) };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .slice(0, 2);
  if (extraWire.length > 0) {
    contact.extraLinks = extraWire;
  }

  const physStreet = trim(c?.physicalStreet);
  const physSuite = trim(c?.physicalSuite);
  const physCity = trim(c?.physicalCity);
  const physRegion = trim(c?.physicalRegion);
  const physCountry = trim(c?.physicalCountry);
  const physZip = trim(c?.physicalPostalCode);
  if (physStreet) contact.physicalStreet = physStreet;
  if (physSuite) contact.physicalSuite = physSuite;
  if (physCity) contact.physicalCity = physCity;
  if (physRegion) contact.physicalRegion = physRegion;
  if (physCountry) contact.physicalCountry = physCountry;
  if (physZip) contact.physicalPostalCode = physZip;

  const quickFacts = mapQuickFacts(draft.quickFacts);
  const about = mapAbout(draft.about);
  const services = mapServices(draft.services);
  const gallery = mapGallery(draft.gallery);
  const galleryVideos = mapGalleryVideos(draft.galleryVideos);
  const trust = mapTrust(draft.trust);
  const businessHighlights = mapBusinessHighlights(draft.highlights);
  const reviews = mapReviews(draft.reviews);
  const serviceAreas = mapServiceAreas(draft.serviceAreas);
  const promotionsWire = collectPromotionsWire(draft);
  const paymentMethodIds = sanitizeServiciosPaymentMethodIds(draft.paymentMethodIds);
  const customPaymentMethods = sanitizeCustomPaymentMethodLabels(draft.customPaymentMethods);
  const amenityOptionIds = sanitizeServiciosAmenityOptionIds(draft.amenityOptionIds);
  const customAmenityOptions = sanitizeCustomServiciosAmenityLabels(draft.customAmenityOptions);
  const credentials = mapCredentials(draft.credentials);
  const couponsWire = mapCouponsDraftToWire(draft.coupons);
  const couponFlyerUrl = trim(draft.couponFlyer?.imageUrl);
  const couponMoreUrl = trim(draft.couponMoreOffers?.url);
  const couponMoreLabel = trim(draft.couponMoreOffers?.buttonLabel);

  const out: ServiciosBusinessProfile = {
    identity,
    hero,
    contact,
  };

  if (quickFacts.length) out.quickFacts = quickFacts;
  if (about) out.about = about;
  if (services.length) out.services = services;
  if (gallery.length) out.gallery = gallery;
  const featuredIds =
    Array.isArray(draft.featuredGalleryIds) && draft.featuredGalleryIds.length
      ? draft.featuredGalleryIds.map((id) => trim(id)).filter(Boolean).slice(0, 4)
      : [];
  if (featuredIds.length) out.featuredGalleryIds = featuredIds;
  if (galleryVideos.length) out.galleryVideos = galleryVideos;
  if (trust.length) out.trust = trust;
  if (businessHighlights.length) out.businessHighlights = businessHighlights;
  if (reviews.length) out.reviews = reviews;
  if (serviceAreas) out.serviceAreas = serviceAreas;
  if (promotionsWire.length) out.promotions = promotionsWire;
  if (paymentMethodIds.length) out.paymentMethodIds = paymentMethodIds;
  if (customPaymentMethods.length) out.customPaymentMethods = customPaymentMethods;
  if (amenityOptionIds.length) out.amenityOptionIds = amenityOptionIds;
  if (customAmenityOptions.length) out.customAmenityOptions = customAmenityOptions;
  if (credentials) out.credentials = credentials;
  if (couponsWire.length) out.coupons = couponsWire;
  if (couponFlyerUrl) out.couponFlyer = { imageUrl: couponFlyerUrl };
  if (couponMoreUrl) {
    out.couponMoreOffers = {
      url: couponMoreUrl,
      ...(couponMoreLabel ? { buttonLabel: couponMoreLabel.slice(0, 80) } : {}),
    };
  }

  return out;
}

function couponDraftRowHasContent(row: ServiciosApplicationCouponDraft): boolean {
  return Boolean(
    trim(row.title) ||
      trim(row.description) ||
      trim(row.regularPrice) ||
      trim(row.specialPrice) ||
      trim(row.savings) ||
      trim(row.href) ||
      trim(row.imageUrl) ||
      trim(row.couponCode) ||
      trim(row.expirationDate) ||
      trim(row.redemptionNote) ||
      trim(row.ctaLabel),
  );
}

function mapCouponsDraftToWire(raw: ServiciosApplicationDraft["coupons"]): ServiciosCouponWire[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosCouponWire[] = [];
  for (const row of raw.slice(0, 4)) {
    if (!row || typeof row.id !== "string" || !couponDraftRowHasContent(row)) continue;
    const wire: ServiciosCouponWire = {
      id: trim(row.id) || row.id,
      title: trim(row.title),
    };
    const description = trim(row.description);
    if (description) wire.description = description;
    const regularPrice = trim(row.regularPrice);
    if (regularPrice) wire.regularPrice = regularPrice;
    const specialPrice = trim(row.specialPrice);
    if (specialPrice) wire.specialPrice = specialPrice;
    const savings = trim(row.savings);
    if (savings) wire.savings = savings;
    const href = trim(row.href);
    if (href) wire.href = href;
    const imageUrl = trim(row.imageUrl);
    if (imageUrl) wire.imageUrl = imageUrl;
    const couponCode = trim(row.couponCode);
    if (couponCode) wire.couponCode = couponCode;
    const expirationDate = trim(row.expirationDate);
    if (expirationDate) wire.expirationDate = expirationDate;
    const redemptionNote = trim(row.redemptionNote);
    if (redemptionNote) wire.redemptionNote = redemptionNote;
    const ctaLabel = trim(row.ctaLabel);
    if (ctaLabel) wire.ctaLabel = ctaLabel;
    if (wire.title || wire.description || wire.imageUrl || wire.couponCode || wire.expirationDate || wire.redemptionNote || wire.href) {
      out.push(wire);
    }
  }
  return out;
}

function mapCredentials(
  raw: ServiciosApplicationDraft["credentials"],
): ServiciosCredentialsWire | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const hasLicense = raw.hasLicense === true;
  const isInsured = raw.isInsured === true;
  const certifications = sanitizeCertificationLabels(raw.certifications);
  const licenseType = hasLicense ? trim(raw.licenseType) || undefined : undefined;
  const licenseNumber = hasLicense ? trim(raw.licenseNumber) || undefined : undefined;
  const licenseAuthority = hasLicense ? trim(raw.licenseAuthority) || undefined : undefined;
  const licenseExpiration = hasLicense ? trim(raw.licenseExpiration) || undefined : undefined;
  const insuranceType = isInsured ? trim(raw.insuranceType) || undefined : undefined;
  const licenseDocumentUrl = trim(raw.licenseDocumentUrl) || undefined;
  const insuranceDocumentUrl = trim(raw.insuranceDocumentUrl) || undefined;

  const meaningful =
    hasLicense ||
    isInsured ||
    certifications.length > 0 ||
    Boolean(licenseDocumentUrl) ||
    Boolean(insuranceDocumentUrl);
  if (!meaningful) return undefined;

  const out: ServiciosCredentialsWire = {};
  if (hasLicense) out.hasLicense = true;
  if (isInsured) out.isInsured = true;
  if (licenseType) out.licenseType = licenseType;
  if (licenseNumber) out.licenseNumber = licenseNumber;
  if (licenseAuthority) out.licenseAuthority = licenseAuthority;
  if (licenseExpiration) out.licenseExpiration = licenseExpiration;
  if (insuranceType) out.insuranceType = insuranceType;
  if (certifications.length) out.certifications = certifications;
  if (licenseDocumentUrl) out.licenseDocumentUrl = licenseDocumentUrl;
  if (insuranceDocumentUrl) out.insuranceDocumentUrl = insuranceDocumentUrl;
  return out;
}

function mapHeroBadges(raw: ServiciosApplicationDraft["hero"]["badges"]): ServiciosHeroBadge[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosHeroBadge[] = [];
  for (const b of raw) {
    if (!b || typeof b.kind !== "string") continue;
    const label = trim(b.label);
    if (!label) continue;
    out.push({ kind: b.kind, label });
  }
  return out;
}

function mapBusinessHighlights(
  raw: ServiciosApplicationDraft["highlights"],
): ServiciosBusinessHighlightItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosBusinessHighlightItem[] = [];
  for (const row of raw) {
    if (!row || typeof row.id !== "string") continue;
    const label = trim(row.label);
    if (!label) continue;
    out.push({ id: trim(row.id) || row.id, label });
  }
  return out;
}

function mapQuickFacts(raw: ServiciosApplicationDraft["quickFacts"]): ServiciosQuickFact[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosQuickFact[] = [];
  for (const f of raw) {
    if (!f || typeof f.kind !== "string") continue;
    const label = trim(f.label);
    if (!label) continue;
    out.push({ kind: f.kind, label });
  }
  return out;
}

function mapAbout(raw: ServiciosApplicationDraft["about"]): ServiciosAboutBlock | undefined {
  if (!raw) return undefined;
  const text = trim(raw.aboutText);
  const specialtiesLine = trim(raw.specialtiesLine);
  if (!text && !specialtiesLine) return undefined;
  const block: ServiciosAboutBlock = {};
  if (text) block.text = text;
  if (specialtiesLine) block.specialtiesLine = specialtiesLine;
  return block;
}

function mapServices(raw: ServiciosApplicationDraft["services"]): ServiciosServiceCard[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosServiceCard[] = [];
  for (const s of raw) {
    if (!s || typeof s.id !== "string") continue;
    const title = trim(s.title);
    if (!title) continue;
    const imageUrl = trim(s.imageUrl);
    const visualVariant = s.visualVariant;
    if (!imageUrl && !visualVariant) continue;
    const row: ServiciosServiceCard = {
      id: trim(s.id) || s.id,
      title,
      secondaryLine: trim(s.secondaryLine) || "",
      imageAlt: trim(s.imageAlt) || title,
    };
    if (imageUrl) row.imageUrl = imageUrl;
    if (visualVariant) row.visualVariant = visualVariant;
    out.push(row);
  }
  return out;
}

function mapGallery(raw: ServiciosApplicationDraft["gallery"]): ServiciosGalleryImage[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosGalleryImage[] = [];
  for (const g of raw) {
    if (!g || typeof g.id !== "string") continue;
    const url = trim(g.url);
    if (!url) continue;
    out.push({
      id: trim(g.id) || g.id,
      url,
      alt: trim(g.alt) || "",
    });
  }
  return out;
}

function mapGalleryVideos(raw: ServiciosApplicationDraft["galleryVideos"]): ServiciosGalleryVideo[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosGalleryVideo[] = [];
  for (const v of raw) {
    if (!v || typeof v.id !== "string") continue;
    const url = trim(v.url);
    if (!url) continue;
    const row: ServiciosGalleryVideo = {
      id: trim(v.id) || v.id,
      url,
      isPrimary: v.isPrimary === true,
    };
    const mp = trim((v as { muxPlaybackId?: string }).muxPlaybackId);
    if (mp) row.muxPlaybackId = mp;
    const ma = trim((v as { muxAssetId?: string }).muxAssetId);
    if (ma) row.muxAssetId = ma;
    const th = trim((v as { muxThumbnailUrl?: string }).muxThumbnailUrl);
    if (th) row.posterUrl = th;
    const skip = trim((v as { muxPublishSkipReason?: string }).muxPublishSkipReason);
    if (skip) row.muxPublishSkipReason = skip.slice(0, 480);
    out.push(row);
    if (out.length >= MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS) break;
  }
  const primary = out.filter((x) => x.isPrimary);
  const rest = out.filter((x) => !x.isPrimary);
  return [...primary, ...rest];
}

function mapTrust(raw: ServiciosApplicationDraft["trust"]): ServiciosTrustItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosTrustItem[] = [];
  for (const t of raw) {
    if (!t || typeof t.id !== "string") continue;
    const label = trim(t.label);
    if (!label) continue;
    out.push({
      id: trim(t.id) || t.id,
      label,
      icon: t.icon,
    });
  }
  return out;
}

function mapReviews(raw: ServiciosApplicationDraft["reviews"]): ServiciosReview[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiciosReview[] = [];
  for (const r of raw) {
    if (!r || typeof r.id !== "string") continue;
    const authorName = trim(r.authorName);
    const quote = trim(r.quote);
    if (!authorName || !quote) continue;
    const row: ServiciosReview = {
      id: trim(r.id) || r.id,
      authorName,
      quote,
    };
    const av = trim(r.avatarUrl);
    if (av) row.avatarUrl = av;
    out.push(row);
  }
  return out;
}

function mapServiceAreas(raw: ServiciosApplicationDraft["serviceAreas"]): ServiciosServiceAreasBlock | undefined {
  if (!raw) return undefined;
  const mapImageUrl = trim(raw.mapImageUrl);
  const items: ServiciosServiceAreasBlock["items"] = [];
  if (Array.isArray(raw.items)) {
    for (const a of raw.items) {
      if (!a || typeof a.id !== "string") continue;
      const label = trim(a.label);
      if (!label) continue;
      items.push({
        id: trim(a.id) || a.id,
        label,
        kind: a.kind,
      });
    }
  }
  if (!items.length && !mapImageUrl) return undefined;
  const block: ServiciosServiceAreasBlock = {};
  if (items.length) block.items = items;
  if (mapImageUrl) block.mapImageUrl = mapImageUrl;
  return block;
}

function promoDraftRowIsActive(raw: ServiciosApplicationPromoDraft): boolean {
  return Boolean(
    trim(raw.headline) ||
      trim(raw.footnote) ||
      trim(raw.href) ||
      trim(raw.assetImageUrl) ||
      trim(raw.assetPdfUrl),
  );
}

function mapPromoDraftToWire(raw: ServiciosApplicationPromoDraft): ServiciosPromoOffer | undefined {
  if (!raw || typeof raw.id !== "string") return undefined;
  if (!promoDraftRowIsActive(raw)) return undefined;
  const id = trim(raw.id) || "promo";
  const headline = trim(raw.headline);
  const footnote = trim(raw.footnote);
  const href = trim(raw.href);
  const assetImageUrl = trim(raw.assetImageUrl);
  const assetPdfUrl = trim(raw.assetPdfUrl);
  const promo: ServiciosPromoOffer = { id, headline: headline || "" };
  if (footnote) promo.footnote = footnote;
  if (href) promo.href = href;
  if (assetImageUrl) promo.assetImageUrl = assetImageUrl;
  if (assetPdfUrl) promo.assetPdfUrl = assetPdfUrl;
  return promo;
}

function collectPromotionsWire(draft: ServiciosApplicationDraft): ServiciosPromoOffer[] {
  const list: ServiciosApplicationPromoDraft[] = [];
  if (Array.isArray(draft.promotions) && draft.promotions.length > 0) {
    for (const p of draft.promotions.slice(0, 4)) {
      if (p && typeof p === "object" && typeof p.id === "string") list.push(p);
    }
  } else if (draft.promo && typeof draft.promo.id === "string") {
    list.push(draft.promo);
  }
  const out: ServiciosPromoOffer[] = [];
  for (const p of list) {
    const w = mapPromoDraftToWire(p);
    if (w) out.push(w);
  }
  return out.slice(0, 4);
}
