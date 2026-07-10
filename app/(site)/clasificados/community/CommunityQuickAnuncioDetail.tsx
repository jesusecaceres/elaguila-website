"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { FiUser } from "react-icons/fi";
import {
  labelClasesSkillLevel,
  labelComunidadAccessibilityKey,
  labelCommunityAudience,
  labelCommunityRegistration,
  resolveClasesCategoryPublicLabel,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { formatTimeForDisplay, getActiveWeeklyScheduleGridItems } from "@/app/publicar/community/shared/lib/communityWeeklySchedule";
import { CommunityWeeklyScheduleAligned } from "@/app/publicar/community/shared/preview/CommunityWeeklyScheduleAligned";
import { trackListingShare } from "@/app/lib/clasificadosAnalytics";
import {
  clasesCostTypeLabel,
  clasesModeLabel,
  clasesPriceFrequencyLabel,
  comunidadEventCostLabel,
  detailPairsToMap,
  isCommunityQuickListing,
  parseAccessibilityKeysCsv,
  parseWeeklyScheduleJson,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { CommunityContactCanvas } from "@/app/(site)/publicar/community/shared/preview/CommunityContactCanvas";

/**
 * Gate C: Format an admission/price string with a $ prefix when it starts with
 * a numeric amount and does not already have a $. Preserves free/donation text.
 *
 * Examples:
 *   "5"           → "$5"
 *   "5.00"        → "$5.00"
 *   "5.00 por persona" → "$5.00 por persona"
 *   "$5.00"       → "$5.00"   (no double-prefix)
 *   "Gratis"      → "Gratis"
 *   "Free"        → "Free"
 */
export function formatAdmissionWithDollar(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (s.startsWith("$")) return s;
  const FREE_WORDS = /^(gratis|free|donaci[oó]n|donation|tbd|por confirmar)/i;
  if (FREE_WORDS.test(s)) return s;
  if (/^\d/.test(s)) return `$${s}`;
  return s;
}

type Props = {
  lang: Lang;
  category: "clases" | "comunidad";
  detailPairs: unknown;
  city: string;
  /** listing.priceLabel already formatted — pass raw is_free + detail for paid line */
  isFree: boolean;
  priceLabel: string;
  listingId?: string;
  ownerUserId?: string | null;
  /** contact_email from DB row (not stored in detail pairs). */
  contactEmail?: string | null;
};

function chip(text: string) {
  if (!text.trim()) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[#A98C2A]/45 bg-[#F4EBD8] px-3 py-1 text-xs font-semibold text-[#3D3428] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
      {text}
    </span>
  );
}

export function CommunityQuickAnuncioDetail({
  lang,
  category,
  detailPairs,
  city,
  isFree,
  priceLabel,
  listingId,
  ownerUserId,
  contactEmail,
}: Props) {
  const L = lang === "es";
  const pairs = detailPairsToMap(detailPairs);
  if (!isCommunityQuickListing(pairs)) return null;

  const org = pairs["Leonix:organizer"] ?? "";
  const state = pairs["Leonix:state"] ?? "";
  const zip = pairs["Leonix:zip"] ?? "";
  const country = pairs["Leonix:country"] ?? "";
  const venue = pairs["Leonix:venue"] ?? "";
  const addr = pairs["Leonix:addressLine1"] ?? "";
  const addr2 = pairs["Leonix:addressLine2"] ?? "";
  const web = pairs["Leonix:website"] ?? "";
  const schedRows = parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"] ?? "");
  const lg = lang === "en" ? "en" : "es";
  const weeklyActive = getActiveWeeklyScheduleGridItems(schedRows, lg).length > 0;
  const sessionStart = pairs["Leonix:eventSessionStart"] ?? "";
  const sessionEnd = pairs["Leonix:eventSessionEnd"] ?? "";
  const showOneTimeSession =
    category === "comunidad" && sessionStart.trim() && sessionEnd.trim() && !weeklyActive;
  const showScheduleBlock = weeklyActive || showOneTimeSession;
  const audience = pairs["Leonix:audience"] ?? "";
  const regReq = pairs["Leonix:registrationRequired"] ?? "";
  const bring = pairs["Leonix:bringNote"] ?? "";

  const rows: { label: string; value: string }[] = [];

  if (category === "clases") {
    const catSlug = pairs["Leonix:classCategory"] ?? "";
    const catCustom = pairs["Leonix:classCategoryCustom"] ?? "";
    rows.push({
      label: L ? "Tipo de clase" : "Class type",
      value: resolveClasesCategoryPublicLabel(catSlug, catCustom, lang),
    });
    rows.push({ label: L ? "Modalidad" : "Mode", value: clasesModeLabel(pairs["Leonix:mode"] ?? "", lang) });
    rows.push({
      label: L ? "Costo" : "Cost",
      value: clasesCostTypeLabel(pairs["Leonix:classCostType"] ?? "", lang),
    });
    if (pairs["Leonix:classCostType"] === "pagada") {
      const amt = pairs["Leonix:priceAmount"] ?? "";
      const fq = pairs["Leonix:priceFrequency"] ?? "";
      const fqL = fq ? clasesPriceFrequencyLabel(fq, lang) : "";
      rows.push({
        label: L ? "Precio" : "Price",
        value: amt ? `${amt} (${fqL})`.trim() : "—",
      });
      const note = pairs["Leonix:priceNote"];
      if (note?.trim()) rows.push({ label: L ? "Nota de precio" : "Price note", value: note });
    }
    const lvl = pairs["Leonix:skillLevel"] ?? "";
    if (lvl.trim()) rows.push({ label: L ? "Nivel" : "Level", value: labelClasesSkillLevel(lvl, lang) });
  } else {
    const catSlug = pairs["Leonix:eventCategory"] ?? "";
    const catCustom = pairs["Leonix:eventCategoryCustom"] ?? "";
    rows.push({
      label: L ? "Tipo de evento" : "Event type",
      value: resolveComunidadEventTypePublicLabel(catSlug, catCustom, lang),
    });
    rows.push({
      label: L ? "Costo del evento" : "Event cost",
      value: comunidadEventCostLabel(pairs["Leonix:eventCost"] ?? "", lang),
    });
    const d0 = pairs["Leonix:eventDate"] ?? "";
    const d1 = pairs["Leonix:eventEndDate"] ?? "";
    if (d0 || d1) {
      rows.push({
        label: L ? "Fechas" : "Dates",
        value: d1 && d1 !== d0 ? `${d0} → ${d1}` : d0 || d1,
      });
    }
    const adm = pairs["Leonix:admissionNote"] ?? "";
    if (adm.trim()) rows.push({ label: L ? "Admisión" : "Admission", value: formatAdmissionWithDollar(adm) });
    const accRaw = pairs["Leonix:accessibility"] ?? "";
    const accKeys = parseAccessibilityKeysCsv(accRaw);
    if (accKeys.length) {
      rows.push({
        label: L ? "Acceso" : "Access",
        value: accKeys.map((k) => labelComunidadAccessibilityKey(k, lang)).join(", "),
      });
    }
  }

  if (audience.trim()) {
    rows.push({ label: L ? "Para quién" : "Audience", value: labelCommunityAudience(audience, lang) });
  }
  if (regReq.trim()) {
    rows.push({
      label: L ? "Registro" : "Registration",
      value: labelCommunityRegistration(regReq, lang),
    });
  }
  if (bring.trim()) {
    rows.push({
      label: L ? "Qué llevar o saber" : "What to bring or know",
      value: bring,
    });
  }

  rows.push({ label: L ? "Ciudad" : "City", value: city || "—" });

  /**
   * Build a minimal Draft-compatible object for CommunityContactCanvas.
   * Phone/WA/SMS are stored as 10-digit strings in detail pairs — pass through
   * directly since usPhoneDigits10 inside the canvas validates length.
   */
  const contactDraft = {
    kind: category as "clases" | "comunidad",
    organizer: org,
    organizerLogoUrl: pairs["Leonix:organizerLogoUrl"] ?? "",
    phone: pairs["Leonix:phoneDigits"] ?? "",
    whatsapp: pairs["Leonix:whatsappDigits"] ?? "",
    smsPhone: pairs["Leonix:smsPhone"] ?? "",
    email: contactEmail?.trim() ?? "",
    website: web,
    socialLinks: {
      facebook: pairs["Leonix:socialFacebook"] ?? "",
      instagram: pairs["Leonix:socialInstagram"] ?? "",
      tiktok: pairs["Leonix:socialTiktok"] ?? "",
      youtube: pairs["Leonix:socialYoutube"] ?? "",
      xTwitter: pairs["Leonix:socialXTwitter"] ?? "",
      linkedin: pairs["Leonix:socialLinkedin"] ?? "",
      snapchat: pairs["Leonix:socialSnapchat"] ?? "",
      pinterest: pairs["Leonix:socialPinterest"] ?? "",
    },
    venue: venue,
    addressLine1: addr,
    addressLine2: addr2,
    publicCity: city,
    state: state,
    zip: zip,
    country: country,
    eventLinks: {
      registrationUrl: pairs["Leonix:registrationUrl"] ?? "",
      ticketsUrl: pairs["Leonix:ticketsUrl"] ?? "",
      donationUrl: pairs["Leonix:donationUrl"] ?? "",
      eventProgramUrl: pairs["Leonix:eventProgramUrl"] ?? "",
      eventGuideUrl: pairs["Leonix:eventGuideUrl"] ?? "",
      vendorListUrl: pairs["Leonix:vendorListUrl"] ?? "",
      foodVendorsUrl: pairs["Leonix:foodVendorsUrl"] ?? "",
      sponsorsUrl: pairs["Leonix:sponsorsUrl"] ?? "",
      customLink1Label: pairs["Leonix:customLink1Label"] ?? "",
      customLink1Url: pairs["Leonix:customLink1Url"] ?? "",
      customLink2Label: pairs["Leonix:customLink2Label"] ?? "",
      customLink2Url: pairs["Leonix:customLink2Url"] ?? "",
    },
    classLinks: {
      registrationUrl: pairs["Leonix:clsRegistrationUrl"] ?? "",
      paymentUrl: pairs["Leonix:clsPaymentUrl"] ?? "",
      ticketsUrl: pairs["Leonix:clsTicketsUrl"] ?? "",
      donationUrl: pairs["Leonix:clsDonationUrl"] ?? "",
      classMaterialsUrl: pairs["Leonix:clsMaterialsUrl"] ?? "",
      syllabusUrl: pairs["Leonix:clsSyllabusUrl"] ?? "",
      classGuideUrl: pairs["Leonix:clsGuideUrl"] ?? "",
      instructorPageUrl: pairs["Leonix:clsInstructorUrl"] ?? "",
      studentPortalUrl: pairs["Leonix:clsStudentPortalUrl"] ?? "",
      vendorsResourcesUrl: pairs["Leonix:clsVendorsUrl"] ?? "",
      foodVendorsUrl: pairs["Leonix:clsFoodVendorsUrl"] ?? "",
      sponsorsUrl: pairs["Leonix:clsSponsorsUrl"] ?? "",
      customLink1Label: pairs["Leonix:clsCustom1Label"] ?? "",
      customLink1Url: pairs["Leonix:clsCustom1Url"] ?? "",
      customLink2Label: pairs["Leonix:clsCustom2Label"] ?? "",
      customLink2Url: pairs["Leonix:clsCustom2Url"] ?? "",
    },
  };

  const shareUrl =
    typeof window !== "undefined" && listingId
      ? `${window.location.origin}/clasificados/anuncio/${listingId}?lang=${lang}`
      : "";

  const onShare = async () => {
    if (!listingId) return;
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      const shareFn = nav && typeof (nav as { share?: unknown }).share === "function" ? (nav as { share: (o: unknown) => Promise<void> }).share : null;
      if (shareFn) {
        await shareFn({ title: document.title, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert(L ? "Enlace copiado" : "Link copied");
      }
      void trackListingShare(listingId, {
        category,
        ownerUserId: ownerUserId ?? undefined,
        eventSource: "detail",
        shareMethod: "community_quick_detail",
      });
    } catch {
      /* ignore */
    }
  };

  /** Cast to satisfy CommunityContactCanvas Draft union — shape is compatible. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasDraft = contactDraft as any;

  return (
    <div className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-[#C9B46A]/55 bg-[#FCF9F2] p-6 ring-1 ring-[#C9B46A]/25 sm:p-8">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5C564E]">
        {category === "clases" ? (L ? "Detalle de la clase" : "Class details") : L ? "Detalle del evento" : "Event details"}
      </h3>
      {org.trim() ? (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#C9B46A]/50 bg-[#F4EBD8]/65 px-3.5 py-3 sm:px-4">
          <FiUser className="mt-0.5 h-5 w-5 shrink-0 text-[#8B7355]" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B5E4E]">{L ? "Organizado por" : "Organized by"}</p>
            <p className="mt-0.5 text-lg font-bold leading-snug tracking-tight text-[#2A2826]">{org.trim()}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {chip(category === "clases" ? (L ? "Clases" : "Classes") : L ? "Comunidad y Eventos" : "Community & Events")}
        {!isFree && priceLabel ? chip(priceLabel) : isFree ? chip(L ? "Gratis" : "Free") : null}
      </div>

      {listingId ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[#C9B46A]/60 bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#2A2826] hover:bg-[#F0E6D2]"
            onClick={() => void onShare()}
          >
            {L ? "Compartir" : "Share"}
          </button>
          <LeonixSaveButton
            listingId={listingId}
            lang={lang}
            category={category}
            ownerUserId={ownerUserId ?? undefined}
            variant="small"
            persistEngagement
          />
          <LeonixLikeButton
            listingId={listingId}
            lang={lang}
            category={category}
            ownerUserId={ownerUserId ?? undefined}
            variant="small"
            persistEngagement
          />
        </div>
      ) : null}

      {showScheduleBlock ? (
        <div className="mt-5 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C564E]">{L ? "Horario" : "Schedule"}</p>
          <div className="mt-2 min-w-0">
            {weeklyActive ? (
              <CommunityWeeklyScheduleAligned rows={schedRows} lang={lang} />
            ) : (
              <dl className="grid grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px] sm:grid-cols-[minmax(0,12.5rem)_1fr]">
                <dt className="min-w-0 font-medium leading-snug text-[#5C564E]">{L ? "Hora" : "Time"}</dt>
                <dd className="min-w-0 font-semibold leading-snug tabular-nums text-[#2A2826]">
                  {formatTimeForDisplay(sessionStart.trim(), lg)} – {formatTimeForDisplay(sessionEnd.trim(), lg)}
                </dd>
              </dl>
            )}
          </div>
        </div>
      ) : null}

      <dl className="mt-5 grid gap-4 text-[15px] leading-snug sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-[#5C564E]">{r.label}</dt>
            <dd className="mt-1 text-[#111111] whitespace-pre-wrap break-words">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* Organizer Business Hub — contact, social, location, trust cue */}
      <CommunityContactCanvas
        draft={canvasDraft}
        lang={lang}
        sectionHtmlId="community-legacy-contact-hub"
      />
    </div>
  );
}
