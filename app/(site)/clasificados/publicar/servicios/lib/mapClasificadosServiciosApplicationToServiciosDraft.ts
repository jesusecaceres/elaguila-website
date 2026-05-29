import type { ServiciosApplicationDraft } from "@/app/servicios/types/serviciosApplicationDraft";
import type { ServiciosLang, ServiciosQuickFactKind } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosTrustItem } from "@/app/servicios/types/serviciosBusinessProfile";
import { chipLabel, getBusinessTypePreset } from "./businessTypePresets";
import type { ClasificadosServiciosApplicationState, DayKey } from "./clasificadosServiciosApplicationTypes";
import { inferServiceVisualVariant } from "./inferServiceVisualVariant";
import { serviciosQuickFactKindFromPresetChip } from "./serviciosQuickFactKindFromChip";
import { isJunkServiciosQuickFactLabel } from "./serviciosContactVisibility";
import { isValidEmail } from "./leonixContactCtaPriority";
import { parseLanguageOtherLines } from "./languageOtherLines";
import { digitsOnly } from "./serviciosPhoneUi";
import { isProbablyValidWebUrl, normalizeHttpUrl } from "./socialAndUrlHelpers";
import { slugifyServiciosBusinessName } from "./serviciosSlug";
import { clasificadosPromoRowIsActive } from "./clasificadosServiciosPromo";
import { WEEK_DAY_LABELS } from "./defaultClasificadosServiciosState";
import { resolveServiciosPublicCategoryLabel } from "./resolveServiciosPublicCategoryLabel";
import { getBusinessHighlightPreset } from "./businessHighlightPresets";
import { normalizeBusinessHighlightDedupeKey } from "./serviciosCustomBusinessHighlights";
import { normalizeServiceOfferedDedupeKey } from "./serviciosCustomServicesOffered";
import { BUSINESS_HIGHLIGHT_LABEL_MAX } from "./serviciosHighlightCaps";
import { CUSTOM_CHIP_MAX_LENGTH } from "./serviciosSelectionCaps";
import {
  sanitizeCustomPaymentMethodLabels,
  sanitizeServiciosPaymentMethodIds,
} from "@/app/servicios/lib/serviciosPaymentMethodCatalog";
import {
  sanitizeCustomServiciosAmenityLabels,
  sanitizeServiciosAmenityOptionIds,
} from "@/app/servicios/lib/serviciosAmenitiesCatalog";

const JS_DAY_TO_ROW: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const WEEK_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const TRUST_ICONS: ServiciosTrustItem["icon"][] = ["shield", "shieldCheck", "star", "clock", "heart", "check"];

function serviciosHasQuoteDestination(state: ClasificadosServiciosApplicationState): boolean {
  if (digitsOnly(state.quoteMessagePhone).length >= 8) return true;
  if (
    state.enableWhatsapp &&
    (digitsOnly(state.whatsapp).length >= 8 ||
      (state.whatsappBusinessUrl.trim().length > 0 && isProbablyValidWebUrl(state.whatsappBusinessUrl)))
  ) {
    return true;
  }
  if (state.enableEmail && isValidEmail(state.email)) return true;
  return false;
}

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

  const categoryLine = resolveServiciosPublicCategoryLabel(state, lang);

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
  const titleKeys = new Set<string>();
  if (preset) {
    for (const id of state.selectedServiceIds) {
      const chip = preset.suggestedServices.find((c) => c.id === id);
      if (!chip) continue;
      const title = chipLabel(chip, lang);
      const key = normalizeServiceOfferedDedupeKey(title);
      if (titleKeys.has(key)) continue;
      titleKeys.add(key);
      services.push({
        id: `svc_${id}`,
        title,
        secondaryLine: "",
        imageAlt: title,
        visualVariant: inferServiceVisualVariant(chip.id, chip.es, chip.en),
      });
    }
  }
  for (const raw of state.customServicesOffered ?? []) {
    if (typeof raw !== "string") continue;
    const title = raw.trim().slice(0, CUSTOM_CHIP_MAX_LENGTH);
    if (!title) continue;
    const key = normalizeServiceOfferedDedupeKey(title);
    if (titleKeys.has(key)) continue;
    titleKeys.add(key);
    services.push({
      id: `custom_offer_${services.length}`,
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
      quickFacts.push({
        kind: serviciosQuickFactKindFromPresetChip(chip, lang),
        label: chipLabel(chip, lang),
      });
    }
  }
  if (state.customQuickFactIncluded && state.customQuickFactLabel.trim() && !isJunkServiciosQuickFactLabel(state.customQuickFactLabel)) {
    const lab = state.customQuickFactLabel.trim().slice(0, 28);
    const low = lab.toLowerCase();
    let kind: ServiciosQuickFactKind = "custom";
    if (/emergencia|emergency|urgencias/i.test(low)) kind = "emergency";
    else if (/móvil|mobile/i.test(low)) kind = "mobile_service";
    else if (/bilingüe|bilingual/i.test(low)) kind = "bilingual";
    quickFacts.push({ kind, label: lab });
  }

  const trust: NonNullable<ServiciosApplicationDraft["trust"]> = [];
  let ti = 0;
  if (preset) {
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
  if (state.customReasonIncluded && state.customReasonLabel.trim()) {
    trust.push({
      id: "custom_reason",
      label: state.customReasonLabel.trim().slice(0, 28),
      icon: TRUST_ICONS[ti % TRUST_ICONS.length]!,
    });
    ti += 1;
  }

  const highlights: NonNullable<ServiciosApplicationDraft["highlights"]> = [];
  const highlightKeys = new Set<string>();
  for (const hid of state.selectedBusinessHighlightIds) {
    const chip = getBusinessHighlightPreset(hid);
    if (!chip) continue;
    const label = chipLabel(chip, lang);
    const key = normalizeBusinessHighlightDedupeKey(label);
    if (highlightKeys.has(key)) continue;
    highlightKeys.add(key);
    highlights.push({ id: `bh_preset_${hid}`, label });
  }
  for (const raw of state.customBusinessHighlights ?? []) {
    if (typeof raw !== "string") continue;
    const label = raw.trim().slice(0, BUSINESS_HIGHLIGHT_LABEL_MAX);
    if (!label) continue;
    const key = normalizeBusinessHighlightDedupeKey(label);
    if (highlightKeys.has(key)) continue;
    highlightKeys.add(key);
    highlights.push({ id: `bh_custom_${highlights.length}`, label });
  }

  const reviews: NonNullable<ServiciosApplicationDraft["reviews"]> = [];
  for (const row of state.testimonials ?? []) {
    const author = row.authorName?.trim();
    const quote = row.quote?.trim();
    if (!author || author.length < 2 || !quote || quote.length < 8) continue;
    reviews.push({
      id: row.id?.trim() || `t_${reviews.length}`,
      authorName: author.slice(0, 120),
      quote: quote.slice(0, 800),
    });
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
  const qm = state.quoteMessagePhone.trim();
  if (qm && digitsOnly(qm).length >= 8) {
    contact.quoteMessagePhone = qm;
  }
  if (serviciosHasQuoteDestination(state)) {
    contact.primaryCtaLabel = lang === "en" ? "Request quote" : "Pedir cotización";
  }
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
  if (ig && isProbablyValidWebUrl(ig)) contact.socialInstagramUrl = normalizeHttpUrl(ig);
  const fb = trimUrl(state.socialFacebook);
  if (fb && isProbablyValidWebUrl(fb)) contact.socialFacebookUrl = normalizeHttpUrl(fb);
  const yt = trimUrl(state.socialYoutube);
  if (yt && isProbablyValidWebUrl(yt)) contact.socialYoutubeUrl = normalizeHttpUrl(yt);
  const tk = trimUrl(state.socialTiktok);
  if (tk && isProbablyValidWebUrl(tk)) contact.socialTiktokUrl = normalizeHttpUrl(tk);
  const li = trimUrl(state.socialLinkedin);
  if (li && isProbablyValidWebUrl(li)) contact.socialLinkedinUrl = normalizeHttpUrl(li);
  const sx = trimUrl(state.socialX);
  if (sx && isProbablyValidWebUrl(sx)) contact.socialXUrl = normalizeHttpUrl(sx);
  const sc = trimUrl(state.socialSnapchat);
  if (sc && isProbablyValidWebUrl(sc)) contact.socialSnapchatUrl = normalizeHttpUrl(sc);
  const googleRev = trimUrl(state.googleReviewsUrl);
  if (googleRev && isProbablyValidWebUrl(googleRev)) {
    contact.googleReviewsUrl = normalizeHttpUrl(googleRev);
  }
  const yelpRev = trimUrl(state.yelpReviewsUrl);
  if (yelpRev && isProbablyValidWebUrl(yelpRev)) {
    contact.yelpReviewsUrl = normalizeHttpUrl(yelpRev);
  }
  const extraLinks: NonNullable<ServiciosApplicationDraft["contact"]["extraLinks"]> = [];
  for (const row of [
    { url: state.extraLink1Url, label: state.extraLink1Label },
    { url: state.extraLink2Url, label: state.extraLink2Label },
  ]) {
    const rawUrl = trimUrl(row.url);
    if (!rawUrl || !isProbablyValidWebUrl(rawUrl)) continue;
    const label = row.label.trim().slice(0, 48);
    extraLinks.push({
      url: normalizeHttpUrl(rawUrl),
      ...(label ? { label } : {}),
    });
    if (extraLinks.length >= 2) break;
  }
  if (extraLinks.length > 0) contact.extraLinks = extraLinks;
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
    .map((v) => {
      const row: {
        id: string;
        url: string;
        isPrimary: boolean;
        muxPlaybackId?: string;
        muxAssetId?: string;
        muxThumbnailUrl?: string;
        muxPublishSkipReason?: string;
      } = {
        id: v.id,
        url: v.url.trim(),
        isPrimary: v.isPrimary === true,
      };
      const mp = v.muxPlaybackId?.trim();
      if (mp) row.muxPlaybackId = mp;
      const ma = v.muxAssetId?.trim();
      if (ma) row.muxAssetId = ma;
      const th = v.muxThumbnailUrl?.trim();
      if (th) row.muxThumbnailUrl = th;
      const sk = v.muxSkipReason?.trim();
      if (sk) row.muxPublishSkipReason = sk.slice(0, 480);
      return row;
    })
    .filter((v) => v.url.length > 0)
    .slice(0, 2);
  galleryVideosRaw.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

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
  if (highlights.length) draft.highlights = highlights;
  if (reviews.length) draft.reviews = reviews;
  if (serviceAreas && (serviceAreas.items?.length || serviceAreas.mapImageUrl)) draft.serviceAreas = serviceAreas;
  const draftPromos: NonNullable<ServiciosApplicationDraft["promotions"]> = [];
  for (let i = 0; i < state.promotions.length; i++) {
    const r = state.promotions[i]!;
    if (!clasificadosPromoRowIsActive(r)) continue;
    const hrefRaw = r.link.trim();
    draftPromos.push({
      id: `clasificados-promo-${i}`,
      headline: r.title.trim(),
      footnote: r.details.trim() || undefined,
      ...(hrefRaw ? { href: normalizeHttpUrl(hrefRaw) } : {}),
      ...(r.imageUrl.trim() ? { assetImageUrl: r.imageUrl.trim() } : {}),
      ...(r.pdfUrl.trim() ? { assetPdfUrl: r.pdfUrl.trim() } : {}),
      ...(r.qrLater === true ? { qrIntent: true } : {}),
    });
  }
  if (draftPromos.length) draft.promotions = draftPromos;

  const paymentIds = sanitizeServiciosPaymentMethodIds(state.paymentMethodIds);
  const customPay = sanitizeCustomPaymentMethodLabels(state.customPaymentMethods);
  if (paymentIds.length) draft.paymentMethodIds = paymentIds;
  if (customPay.length) draft.customPaymentMethods = customPay;

  const amenityIds = sanitizeServiciosAmenityOptionIds(state.amenityOptionIds);
  const customAmenities = sanitizeCustomServiciosAmenityLabels(state.customAmenityOptions);
  if (amenityIds.length) draft.amenityOptionIds = amenityIds;
  if (customAmenities.length) draft.customAmenityOptions = customAmenities;

  const credHasLicense = state.hasLicense === true;
  const credIsInsured = state.isInsured === true;
  const credCertList = state.certifications.length ? [...state.certifications] : [];
  const cred: NonNullable<ServiciosApplicationDraft["credentials"]> = {};
  if (credHasLicense) cred.hasLicense = true;
  if (credIsInsured) cred.isInsured = true;
  if (credHasLicense && state.licenseType.trim()) cred.licenseType = state.licenseType.trim();
  if (credHasLicense && state.licenseNumber.trim()) cred.licenseNumber = state.licenseNumber.trim();
  if (credHasLicense && state.licenseAuthority.trim()) cred.licenseAuthority = state.licenseAuthority.trim();
  if (credHasLicense && state.licenseExpiration.trim()) cred.licenseExpiration = state.licenseExpiration.trim();
  if (credIsInsured && state.insuranceType.trim()) cred.insuranceType = state.insuranceType.trim();
  if (credCertList.length) cred.certifications = credCertList;
  if (state.licenseDocumentUrl.trim()) cred.licenseDocumentUrl = state.licenseDocumentUrl.trim();
  if (state.insuranceDocumentUrl.trim()) cred.insuranceDocumentUrl = state.insuranceDocumentUrl.trim();
  const credMeaningful =
    credHasLicense ||
    credIsInsured ||
    credCertList.length > 0 ||
    Boolean(state.licenseDocumentUrl.trim()) ||
    Boolean(state.insuranceDocumentUrl.trim());
  if (credMeaningful) draft.credentials = cred;

  return draft;
}
