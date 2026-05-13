"use client";

import Link from "next/link";

import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import { LeonixSaveButton } from "@/app/components/clasificados/analytics/LeonixSaveButton";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  labelClasesSkillLevel,
  labelComunidadAccessibilityKey,
  labelCommunityAudience,
  labelCommunityRegistration,
  resolveClasesCategoryPublicLabel,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
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
  summarizeWeeklySchedule,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

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
};

function chip(text: string) {
  if (!text.trim()) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[#C9B46A]/40 bg-[#FFFCF7] px-3 py-1 text-xs font-semibold text-[#2A2826]">
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
}: Props) {
  const L = lang === "es";
  const pairs = detailPairsToMap(detailPairs);
  if (!isCommunityQuickListing(pairs)) return null;

  const org = pairs["Leonix:organizer"] ?? "";
  const state = pairs["Leonix:state"] ?? "";
  const zip = pairs["Leonix:zip"] ?? "";
  const venue = pairs["Leonix:venue"] ?? "";
  const addr = pairs["Leonix:addressLine1"] ?? "";
  const web = pairs["Leonix:website"] ?? "";
  const sched = summarizeWeeklySchedule(parseWeeklyScheduleJson(pairs["Leonix:weeklyScheduleJson"] ?? ""), lang);
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
    const s0 = pairs["Leonix:eventSessionStart"] ?? "";
    const s1 = pairs["Leonix:eventSessionEnd"] ?? "";
    if (s0 && s1) {
      rows.push({
        label: L ? "Horario puntual" : "One-time hours",
        value: `${s0}–${s1}`,
      });
    }
    const adm = pairs["Leonix:admissionNote"] ?? "";
    if (adm.trim()) rows.push({ label: L ? "Admisión" : "Admission", value: adm });
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

  if (sched) rows.push({ label: L ? "Horario" : "Schedule", value: sched });
  rows.push({ label: L ? "Ciudad" : "City", value: city || "—" });
  if (state || zip) {
    rows.push({
      label: L ? "Estado / CP" : "State / ZIP",
      value: [state, zip].filter(Boolean).join(" ") || "—",
    });
  }
  if (venue.trim()) rows.push({ label: L ? "Lugar" : "Venue", value: venue });
  if (addr.trim()) rows.push({ label: L ? "Dirección" : "Address", value: addr });
  if (org.trim()) rows.push({ label: L ? "Organizador" : "Organizer", value: org });

  const socials: { label: string; href: string }[] = [];
  const fb = pairs["Leonix:socialFacebook"];
  if (fb) socials.push({ label: "Facebook", href: fb });
  const ig = pairs["Leonix:socialInstagram"];
  if (ig) socials.push({ label: "Instagram", href: ig });
  const tt = pairs["Leonix:socialTiktok"];
  if (tt) socials.push({ label: "TikTok", href: tt });
  const yt = pairs["Leonix:socialYoutube"];
  if (yt) socials.push({ label: "YouTube", href: yt });
  const xt = pairs["Leonix:socialXTwitter"];
  if (xt) socials.push({ label: "X", href: xt });
  const li = pairs["Leonix:socialLinkedin"];
  if (li) socials.push({ label: "LinkedIn", href: li });

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

  return (
    <div className="mx-auto mt-6 w-full max-w-4xl rounded-2xl border border-[#C9B46A]/55 bg-[#FCF9F2] p-6 ring-1 ring-[#C9B46A]/25 sm:p-8">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#5C564E]">
        {category === "clases" ? (L ? "Detalle de la clase" : "Class details") : L ? "Detalle del evento" : "Event details"}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {chip(category === "clases" ? (L ? "Clases" : "Classes") : L ? "Comunidad" : "Community")}
        {!isFree && priceLabel ? chip(priceLabel) : isFree ? chip(L ? "Gratis" : "Free") : null}
      </div>

      {listingId ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-[#C9B46A]/60 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5]"
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

      <dl className="mt-5 grid gap-4 text-[15px] leading-snug sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-[#5C564E]">{r.label}</dt>
            <dd className="mt-1 text-[#111111] whitespace-pre-wrap break-words">{r.value}</dd>
          </div>
        ))}
      </dl>
      {web ? (
        <p className="mt-4 text-sm">
          <span className="font-semibold text-[#111111]">{L ? "Sitio web" : "Website"}: </span>
          <Link href={web} className="text-[#2563EB] underline break-all" target="_blank" rel="noopener noreferrer">
            {web}
          </Link>
        </p>
      ) : null}
      {socials.length ? (
        <div className="mt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C564E]">{L ? "Redes" : "Social"}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {socials.map((s) => (
              <li key={s.label}>
                <Link href={s.href} className="text-sm font-semibold text-[#2563EB] underline" target="_blank" rel="noopener noreferrer">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
