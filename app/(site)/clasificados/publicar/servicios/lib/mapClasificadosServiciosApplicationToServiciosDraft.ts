import type { ServiciosApplicationDraft } from "@/app/servicios/types/serviciosApplicationDraft";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosTrustItem } from "@/app/servicios/types/serviciosBusinessProfile";
import { chipLabel, getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState, DayKey } from "./clasificadosServiciosApplicationTypes";
import { inferServiceVisualVariant } from "./inferServiceVisualVariant";
import { normalizeHttpUrl } from "./socialAndUrlHelpers";
import { slugifyServiciosBusinessName } from "./serviciosSlug";

const JS_DAY_TO_ROW: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const TRUST_ICONS: ServiciosTrustItem["icon"][] = ["shield", "shieldCheck", "star", "clock", "heart", "check"];

function waMeUrl(raw: string): string | undefined {
  const d = raw.replace(/\D/g, "");
  if (d.length < 8) return undefined;
  return `https://wa.me/${d}`;
}

function trimUrl(raw: string): string {
  return raw.trim();
}

function safeWebsiteForDraft(raw: string): string | undefined {
  const t = trimUrl(raw);
  if (!t) return undefined;
  return normalizeHttpUrl(t);
}

/**
 * Clasificados advertiser state → canonical `ServiciosApplicationDraft` for the shared mapper/resolver/shell.
 */
export function mapClasificadosServiciosApplicationToServiciosDraft(
  state: ClasificadosServiciosApplicationState,
  lang: ServiciosLang,
): ServiciosApplicationDraft {
  const preset = getBusinessTypePreset(state.businessTypeId);
  const businessName = state.businessName.trim();
  const slug = slugifyServiciosBusinessName(businessName || "borrador");

  const categoryLine = preset ? (lang === "en" ? preset.labelEn : preset.labelEs) : undefined;

  const locationParts = [state.city.trim(), state.serviceAreaNotes.trim()].filter(Boolean);
  const locationSummary = locationParts.length ? locationParts.join(" · ").slice(0, 220) : undefined;

  const logoAlt = lang === "en" ? "Business logo" : "Logo del negocio";
  const coverAlt = lang === "en" ? "Cover image" : "Imagen de portada";

  const heroBadges: ServiciosApplicationDraft["hero"]["badges"] = [];
  const bi = state.languageIds.includes("lang_bi");
  const es = state.languageIds.includes("lang_es");
  const en = state.languageIds.includes("lang_en");
  if (bi || (es && en)) {
    heroBadges.push({
      kind: "spanish",
      label: lang === "en" ? "Bilingual" : "Bilingüe",
    });
  }
  /* Leonix “Verificado” is not granted from advertiser interest — see resolver + published listings. */

  const services: NonNullable<ServiciosApplicationDraft["services"]> = [];
  if (preset) {
    for (const id of state.selectedServiceIds) {
      const chip = preset.suggestedServices.find((c) => c.id === id);
      if (!chip) continue;
      const title = chipLabel(chip, lang);
      services.push({
        id: `svc_${id}`,
        title,
        secondaryLine: "",
        imageAlt: title,
        visualVariant: inferServiceVisualVariant(chip.id, chip.es, chip.en),
      });
    }
  }
  const customLabel = state.customServiceLabel.trim();
  if (customLabel) {
    const title = customLabel.slice(0, 96);
    services.push({
      id: "svc_custom",
      title,
      secondaryLine: "",
      imageAlt: title,
      visualVariant: inferServiceVisualVariant("custom_otro", title, title),
    });
  }

  const quickFacts: NonNullable<ServiciosApplicationDraft["quickFacts"]> = [];
  if (preset) {
    for (const id of state.selectedQuickFactIds) {
      const chip = preset.quickFacts.find((c) => c.id === id);
      if (!chip) continue;
      quickFacts.push({ kind: "custom", label: chipLabel(chip, lang) });
    }
  }

  const trust: NonNullable<ServiciosApplicationDraft["trust"]> = [];
  if (preset) {
    let ti = 0;
    for (const id of state.selectedReasonIds) {
      const chip = preset.reasonsToChoose.find((c) => c.id === id);
      if (!chip) continue;
      trust.push({
        id: `trust_${id}`,
        label: chipLabel(chip, lang),
        icon: TRUST_ICONS[ti % TRUST_ICONS.length]!,
      });
      ti += 1;
    }
  }

  const reviews: NonNullable<ServiciosApplicationDraft["reviews"]> = [];
  for (const t of state.testimonials) {
    const author = t.authorName.trim();
    const quote = t.quote.trim();
    if (!author || !quote) continue;
    reviews.push({ id: t.id, authorName: author, quote });
  }

  const areaLabels = state.serviceAreaNotes
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let serviceAreas: ServiciosApplicationDraft["serviceAreas"];
  if (areaLabels.length > 0) {
    serviceAreas = {
      items: areaLabels.map((label, i) => ({
        id: `area_${i}`,
        label,
      })),
    };
  } else if (state.city.trim()) {
    serviceAreas = { items: [{ id: "area_city", label: state.city.trim() }] };
  }

  const todayKey = JS_DAY_TO_ROW[new Date().getDay()];
  const todayRow = state.hours.find((h) => h.day === todayKey);
  let hoursOpenNowLabel: string | undefined;
  let hoursTodayLine: string | undefined;
  if (todayRow) {
    hoursOpenNowLabel = lang === "en" ? "Today" : "Hoy";
    hoursTodayLine = todayRow.closed
      ? lang === "en"
        ? "Closed"
        : "Cerrado"
      : `${todayRow.open} – ${todayRow.close}`;
  }

  let primaryCtaLabel: string | undefined;
  if (preset && state.primaryCtaId) {
    const cta = preset.primaryCtaOptions.find((c) => c.id === state.primaryCtaId);
    if (cta) primaryCtaLabel = chipLabel(cta, lang);
  }

  const contact: ServiciosApplicationDraft["contact"] = {
    messageEnabled: state.enableMessage === true,
  };
  if (state.enableCall && state.phone.trim()) {
    contact.phone = state.phone.trim();
  }
  if (state.enableWebsite) {
    const w = safeWebsiteForDraft(state.website);
    if (w) contact.websiteUrl = w;
  }
  if (primaryCtaLabel) contact.primaryCtaLabel = primaryCtaLabel;
  if (hoursOpenNowLabel && hoursTodayLine) {
    contact.hoursOpenNowLabel = hoursOpenNowLabel;
    contact.hoursTodayLine = hoursTodayLine;
  }

  const ig = trimUrl(state.socialInstagram);
  if (ig) contact.socialInstagramUrl = normalizeHttpUrl(ig);
  const fb = trimUrl(state.socialFacebook);
  if (fb) contact.socialFacebookUrl = normalizeHttpUrl(fb);
  const yt = trimUrl(state.socialYoutube);
  if (yt) contact.socialYoutubeUrl = normalizeHttpUrl(yt);
  const tk = trimUrl(state.socialTiktok);
  if (tk) contact.socialTiktokUrl = normalizeHttpUrl(tk);
  const li = trimUrl(state.socialLinkedin);
  if (li) contact.socialLinkedinUrl = normalizeHttpUrl(li);
  if (state.enableWhatsapp) {
    const wa = waMeUrl(state.whatsapp);
    if (wa) contact.socialWhatsappUrl = wa;
  }

  const gallery: NonNullable<ServiciosApplicationDraft["gallery"]> = state.gallery.map((g) => ({
    id: g.id,
    url: g.url.trim(),
    alt: lang === "en" ? "Gallery image" : "Imagen de galería",
  }));

  const galleryIdSet = new Set(gallery.map((g) => g.id));
  const featuredGalleryIds = state.featuredGalleryIds.filter((id) => galleryIdSet.has(id)).slice(0, 4);

  const galleryVideosRaw = state.videos
    .map((v) => ({
      id: v.id,
      url: v.url.trim(),
      isPrimary: v.isPrimary === true,
    }))
    .filter((v) => v.url.length > 0)
    .slice(0, 2);
  galleryVideosRaw.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

  const offerTitle = state.offerTitle.trim();

  const about: ServiciosApplicationDraft["about"] | undefined =
    state.aboutText.trim() || state.specialtiesLine.trim()
      ? {
          aboutText: state.aboutText.trim() || undefined,
          specialtiesLine: state.specialtiesLine.trim() || undefined,
        }
      : undefined;

  const draft: ServiciosApplicationDraft = {
    identity: { slug, businessName },
    hero: {
      categoryLine,
      logoUrl: state.logoUrl.trim() || undefined,
      logoAlt: state.logoUrl.trim() ? logoAlt : undefined,
      coverImageUrl: state.coverUrl.trim() || undefined,
      coverImageAlt: state.coverUrl.trim() ? coverAlt : undefined,
      locationSummary,
      badges: heroBadges.length ? heroBadges : undefined,
    },
    contact,
  };

  if (quickFacts.length) draft.quickFacts = quickFacts;
  if (about && (about.aboutText || about.specialtiesLine)) draft.about = about;
  if (services.length) draft.services = services;
  if (gallery.length) draft.gallery = gallery;
  if (featuredGalleryIds.length) draft.featuredGalleryIds = featuredGalleryIds;
  if (galleryVideosRaw.length) draft.galleryVideos = galleryVideosRaw;
  if (trust.length) draft.trust = trust;
  if (reviews.length) draft.reviews = reviews;
  if (serviceAreas && (serviceAreas.items?.length || serviceAreas.mapImageUrl)) draft.serviceAreas = serviceAreas;
  if (offerTitle) {
    const pa = state.offerPrimaryAsset;
    draft.promo = {
      id: "promo-clasificados",
      headline: offerTitle,
      footnote: state.offerDetails.trim() || undefined,
      href: state.offerLink.trim() ? normalizeHttpUrl(state.offerLink.trim()) : undefined,
      assetImageUrl: state.offerImageUrl.trim() || undefined,
      assetPdfUrl: state.offerPdfUrl.trim() || undefined,
      ...(pa === "link" || pa === "image" || pa === "pdf" ? { primaryAssetKind: pa } : {}),
      ...(state.offerQrLater === true ? { qrIntent: true } : {}),
    };
  }

  return draft;
}
