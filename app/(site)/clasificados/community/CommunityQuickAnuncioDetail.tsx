"use client";

import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  clasesCostTypeLabel,
  clasesModeLabel,
  clasesPriceFrequencyLabel,
  comunidadEventCostLabel,
  detailPairsToMap,
  isCommunityQuickListing,
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
};

function chip(text: string) {
  if (!text.trim()) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-[#111111]">
      {text}
    </span>
  );
}

export function CommunityQuickAnuncioDetail({ lang, category, detailPairs, city, isFree, priceLabel }: Props) {
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

  const rows: { label: string; value: string }[] = [];

  if (category === "clases") {
    const cat =
      pairs["Leonix:classCategory"] === "otro"
        ? pairs["Leonix:classCategoryCustom"] || pairs["Leonix:classCategory"]
        : pairs["Leonix:classCategory"];
    rows.push({ label: L ? "Tipo de clase" : "Class type", value: cat || "—" });
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
  } else {
    const cat =
      pairs["Leonix:eventCategory"] === "otro"
        ? pairs["Leonix:eventCategoryCustom"] || pairs["Leonix:eventCategory"]
        : pairs["Leonix:eventCategory"];
    rows.push({ label: L ? "Tipo de evento" : "Event type", value: cat || "—" });
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

  return (
    <div className="mt-6 rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] p-6 ring-1 ring-[#C9B46A]/25">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#111111]/80">
        {category === "clases" ? (L ? "Detalle de la clase" : "Class details") : L ? "Detalle del evento" : "Event details"}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {chip(category === "clases" ? (L ? "Clases" : "Classes") : L ? "Comunidad" : "Community")}
        {!isFree && priceLabel ? chip(priceLabel) : isFree ? chip(L ? "Gratis" : "Free") : null}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#5C564E]">{r.label}</dt>
            <dd className="mt-1 text-sm text-[#111111] whitespace-pre-wrap break-words">{r.value}</dd>
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
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#5C564E]">{L ? "Redes" : "Social"}</p>
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
