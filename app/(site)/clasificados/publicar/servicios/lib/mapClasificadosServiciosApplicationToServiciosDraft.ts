import type { ServiciosApplicationDraft } from "@/app/servicios/types/serviciosApplicationDraft";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosTrustItem } from "@/app/servicios/types/serviciosBusinessProfile";
import { chipLabel, getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState, DayKey } from "./clasificadosServiciosApplicationTypes";
import { inferServiceVisualVariant } from "./inferServiceVisualVariant";
import { buildLeonixContactCtaLabels, isValidEmail } from "./leonixContactCtaPriority";
import { parseLanguageOtherLines } from "./languageOtherLines";
import { digitsOnly } from "./serviciosPhoneUi";
import { isProbablyValidWebUrl, normalizeHttpUrl } from "./socialAndUrlHelpers";
import { slugifyServiciosBusinessName } from "./serviciosSlug";
import { WEEK_DAY_LABELS } from "./defaultClasificadosServiciosState";

const JS_DAY_TO_ROW: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const WEEK_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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
  const es = state.languageIds.includes("lang_es");
  const en = state.languageIds.includes("lang_en");
  const otro = state.languageIds.includes("lang_otro");
  if (es) {
    heroBadges.push({ kind: "spanish", label: lang === "en" ? "Spanish" : "Español" });
  }
  if (en) {
    heroBadges.push({ kind: "custom", label: lang === "en" ? "English" : "Inglés" });
  }
  if (otro) {
    const extra = parseLanguageOtherLines(state.languageOtherLines);
    if (extra.length === 0) {
      heroBadges.push({
        kind: "custom",
        label: lang === "en" ? "Other language" : "Otro idioma",
      });
    } else {
      for (const lab of extra) {
        heroBadges.push({ kind: "custom", label: lab.slice(0, 48) });
      }
    }
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

  /**
   * Advertiser-provided testimonials are not collected in the Clasificados application UI for this phase.
   * Do not map `state.testimonials` into preview/publish output — legacy keys may still exist in stored drafts.
   */
  const reviews: NonNullable<ServiciosApplicationDraft["reviews"]> = [];

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

  const leonixCta = buildLeonixContactCtaLabels(state, lang);
  const primaryCtaLabel = leonixCta.primaryCtaLabel;
  const secondaryCtaLabels = leonixCta.secondaryCtaLabels;

  const contact: ServiciosApplicationDraft["contact"] = {
    messageEnabled: state.enableMessage === true,
  };
  if (state.enableCall && state.phone.trim() && digitsOnly(state.phone).length >= 8) {
    contact.phone = state.phone.trim();
  }
  if (state.enableCall && state.phoneOffice.trim() && digitsOnly(state.phoneOffice).length >= 8) {
    contact.phoneOffice = state.phoneOffice.trim();
  }
  if (state.enableEmail && isValidEmail(state.email)) {
    contact.email = state.email.trim();
  }
  if (state.enableWebsite) {
    const w = safeWebsiteForDraft(state.website);
    if (w) contact.websiteUrl = w;
  }
  if (primaryCtaLabel) contact.primaryCtaLabel = primaryCtaLabel;
  if (secondaryCtaLabels.length) contact.secondaryCtaLabels = secondaryCtaLabels;
  if (hoursOpenNowLabel && hoursTodayLine) {
    contact.hoursOpenNowLabel = hoursOpenNowLabel;
    contact.hoursTodayLine = hoursTodayLine;
  }

  const weeklyHoursRows: { dayLabel: string; line: string }[] = [];
  for (const day of WEEK_ORDER) {
    const row = state.hours.find((h) => h.day === day);
    if (!row) continue;
    const dayLabel = WEEK_DAY_LABELS[day][lang];
    const line =
      row.closed === true
        ? lang === "en"
          ? "Closed"
          : "Cerrado"
        : `${row.open} – ${row.close}`;
    weeklyHoursRows.push({ dayLabel, line });
  }
  if (weeklyHoursRows.length === WEEK_ORDER.length) {
    contact.weeklyHoursRows = weeklyHoursRows;
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
    const biz = trimUrl(state.whatsappBusinessUrl);
    if (wa) {
      contact.socialWhatsappUrl = wa;
    } else if (biz && isProbablyValidWebUrl(biz)) {
      contact.socialWhatsappUrl = normalizeHttpUrl(biz);
    }
  }

  const physStreet = state.physicalStreet.trim();
  const physSuite = state.physicalSuite.trim();
  const physCity = state.physicalAddressCity.trim();
  const physRegion = state.physicalRegion.trim();
  const physZip = state.physicalPostalCode.trim();
  if (physStreet) contact.physicalStreet = physStreet;
  if (physSuite) contact.physicalSuite = physSuite;
  if (physCity) contact.physicalCity = physCity;
  if (physRegion) contact.physicalRegion = physRegion;
  if (physZip) contact.physicalPostalCode = physZip;

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
