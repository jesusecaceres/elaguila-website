"use client";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { FiUser } from "react-icons/fi";
import {
  labelCommunityAudience,
  labelCommunityRegistration,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { formatTimeForDisplay, getActiveWeeklyScheduleGridItems } from "@/app/publicar/community/shared/lib/communityWeeklySchedule";
import { CommunityWeeklyScheduleAligned } from "@/app/publicar/community/shared/preview/CommunityWeeklyScheduleAligned";
import { trackListingShare } from "@/app/lib/clasificadosAnalytics";
import { trackCommunityLikeToggle } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";
import { trackListingSaveToggleAuthed } from "@/app/lib/analytics/client/listingEngagementRecorder";
import {
  detailPairsToMap,
  isCommunityQuickListing,
  parseWeeklyScheduleJson,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { CommunityContactCanvas } from "@/app/(site)/publicar/community/shared/preview/CommunityContactCanvas";
import { buildComunidadContactCanvasModel } from "@/app/(site)/publicar/comunidad/lib/buildComunidadContactCanvasModel";
import { buildClasesContactCanvasModel } from "@/app/(site)/publicar/clases/lib/buildClasesContactCanvasModel";
import type { ClasesQuickDraft, ComunidadQuickDraft } from "@/app/(site)/publicar/community/shared/types/communityQuickDraft";
import { buildComunidadLegacyDetail } from "@/app/(site)/clasificados/comunidad/shared/comunidadLegacyDetailAdapter";
import { buildClasesLegacyDetail } from "@/app/(site)/clasificados/clases/shared/clasesLegacyDetailAdapter";

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

  const categoryDetail =
    category === "clases"
      ? buildClasesLegacyDetail(pairs, lang)
      : buildComunidadLegacyDetail(pairs, lang, formatAdmissionWithDollar);

  const rows: { label: string; value: string }[] = [...categoryDetail.rows];

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
  const contactCanvasModel =
    category === "clases"
      ? buildClasesContactCanvasModel(canvasDraft as ClasesQuickDraft, lang)
      : buildComunidadContactCanvasModel(canvasDraft as ComunidadQuickDraft, lang);

  return (
    <div className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-[#C9B46A]/55 bg-[#FCF9F2] p-6 ring-1 ring-[#C9B46A]/25 sm:p-8">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5C564E]">
        {categoryDetail.sectionTitle}
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
        {chip(categoryDetail.categoryChipLabel)}
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
            recordSaveEvent={(isSave) =>
              trackListingSaveToggleAuthed(
                { sourceTable: "listings", sourceId: listingId, category },
                isSave,
                { eventSource: "detail" },
              )
            }
          />
          <LeonixLikeButton
            listingId={listingId}
            lang={lang}
            category={category}
            ownerUserId={ownerUserId ?? undefined}
            variant="small"
            persistEngagement
            recordLikeEvent={(isLike) =>
              trackCommunityLikeToggle({ listingUuid: listingId, category }, isLike)
            }
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
        model={contactCanvasModel}
      />
    </div>
  );
}
