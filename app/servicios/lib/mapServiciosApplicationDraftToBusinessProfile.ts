import type { ServiciosApplicationDraft } from "../types/serviciosApplicationDraft";
import type {
  ServiciosAboutBlock,
  ServiciosBusinessProfile,
  ServiciosContactBlock,
  ServiciosGalleryImage,
  ServiciosGalleryVideo,
  ServiciosHeroBadge,
  ServiciosHeroBlock,
  ServiciosIdentity,
  ServiciosPromoOffer,
  ServiciosQuickFact,
  ServiciosReview,
  ServiciosServiceAreasBlock,
  ServiciosServiceCard,
  ServiciosTrustItem,
} from "../types/serviciosBusinessProfile";

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

  const badges = mapHeroBadges(draft.hero.badges);
  if (badges.length) hero.badges = badges;

  const contact: ServiciosContactBlock = {};
  const phone = trim(draft.contact?.phone);
  if (phone) contact.phone = phone;
  const websiteUrl = trim(draft.contact?.websiteUrl);
  if (websiteUrl) contact.websiteUrl = websiteUrl;
  const websiteLabel = trim(draft.contact?.websiteLabel);
  if (websiteLabel) contact.websiteLabel = websiteLabel;
  if (draft.contact?.messageEnabled === true) contact.messageEnabled = true;

  const openNow = trim(draft.contact?.hoursOpenNowLabel);
  const today = trim(draft.contact?.hoursTodayLine);
  if (openNow && today) {
    contact.hours = { openNowLabel: openNow, todayHoursLine: today };
  }

  const primaryCta = trim(draft.contact?.primaryCtaLabel);
  if (primaryCta) contact.primaryCtaLabel = primaryCta;
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
  if (Object.keys(socialLinks).length > 0) {
    contact.socialLinks = socialLinks;
  }

  const quickFacts = mapQuickFacts(draft.quickFacts);
  const about = mapAbout(draft.about);
  const services = mapServices(draft.services);
  const gallery = mapGallery(draft.gallery);
  const galleryVideos = mapGalleryVideos(draft.galleryVideos);
  const trust = mapTrust(draft.trust);
  const reviews = mapReviews(draft.reviews);
  const serviceAreas = mapServiceAreas(draft.serviceAreas);
  const promo = mapPromo(draft.promo);

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
  if (reviews.length) out.reviews = reviews;
  if (serviceAreas) out.serviceAreas = serviceAreas;
  if (promo) out.promo = promo;

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
    out.push({
      id: trim(v.id) || v.id,
      url,
      isPrimary: v.isPrimary === true,
    });
    if (out.length >= 2) break;
  }
  return out;
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

function mapPromo(raw: ServiciosApplicationDraft["promo"]): ServiciosPromoOffer | undefined {
  if (!raw) return undefined;
  const headline = trim(raw.headline);
  if (!headline) return undefined;
  const id = trim(raw.id) || "promo";
  const footnote = trim(raw.footnote);
  const href = trim(raw.href);
  const assetImageUrl = trim(raw.assetImageUrl);
  const assetPdfUrl = trim(raw.assetPdfUrl);
  const promo: ServiciosPromoOffer = { id, headline };
  if (footnote) promo.footnote = footnote;
  if (href) promo.href = href;
  if (assetImageUrl) promo.assetImageUrl = assetImageUrl;
  if (assetPdfUrl) promo.assetPdfUrl = assetPdfUrl;
  return promo;
}
