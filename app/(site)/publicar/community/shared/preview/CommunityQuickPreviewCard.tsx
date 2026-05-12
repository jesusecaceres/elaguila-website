"use client";

import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";

import { COMMUNITY_DISCOVERY_REGION } from "../constants/communityRegion";
import {
  clasesCostLabel,
  clasesFrequencyLabel,
  clasesModeLabel,
  comunidadCostLabel,
} from "../copy/communityPublishCopy";
import { formatWeeklyScheduleLines, formatTimeForDisplay } from "../lib/communityWeeklySchedule";
import type {
  ClasesQuickDraft,
  ComunidadQuickDraft,
} from "../types/communityQuickDraft";

import { CommunityContactCanvas } from "./CommunityContactCanvas";

function cityStateZipLine(d: { publicCity: string; state: string; zip: string }): string {
  const city = getCanonicalCityName(d.publicCity.trim()) || d.publicCity.trim();
  if (!city) return "";
  const st = d.state.trim() || "CA";
  const z = d.zip.trim();
  return z ? `${city}, ${st} ${z}` : `${city}, ${st}`;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70";

function isNonImageAttachment(url: string, mime?: string): boolean {
  if (mime === "application/pdf") return true;
  if (url.startsWith("data:application/pdf")) return true;
  const base = url.split(/[?#]/)[0]?.toLowerCase() ?? "";
  return base.endsWith(".pdf");
}

function pickMain(
  images: { url: string; alt: string; isMain?: boolean; attachmentMime?: string }[]
): { url: string; alt: string; heroIsFlyerDoc?: boolean } {
  const withUrl = images.filter((x) => String(x.url ?? "").trim());
  if (!withUrl.length) return { url: FALLBACK_IMG, alt: "preview" };
  const main = withUrl.find((x) => x.isMain) ?? withUrl[0];
  const url = main.url;
  if (isNonImageAttachment(url, main.attachmentMime)) {
    return { url: FALLBACK_IMG, alt: main.alt || "preview", heroIsFlyerDoc: true };
  }
  return { url, alt: main.alt || "preview" };
}

const COPY = {
  es: {
    organizer: "Organizado por",
    publicCity: "Ciudad",
    discoveryRegion: "Región de descubrimiento",
    schedule: "Horario",
    mode: "Modalidad",
    cost: "Costo",
    paid: "Pagada",
    free: "Gratis",
    pricePer: "Precio por",
    priceNote: "Nota de precio",
    contact: "Contacto",
    description: "Descripción",
    eventCost: "Costo del evento",
    admission: "Nota de admisión",
    date: "Fecha",
    time: "Hora",
    eventDates: "Fechas del evento",
    eventWeekly: "Días y horarios",
    venue: "Lugar",
    address: "Dirección",
    websiteCta: "Sitio web / registro",
    paidNotice:
      "Esta clase es de pago. La activación de publicación pagada está en preparación.",
  },
  en: {
    organizer: "Organized by",
    publicCity: "City",
    discoveryRegion: "Discovery region",
    schedule: "Schedule",
    mode: "Mode",
    cost: "Cost",
    paid: "Paid",
    free: "Free",
    pricePer: "Price per",
    priceNote: "Price note",
    contact: "Contact",
    description: "Description",
    eventCost: "Event cost",
    admission: "Admission note",
    date: "Date",
    time: "Time",
    eventDates: "Event dates",
    eventWeekly: "Days & times",
    venue: "Venue",
    address: "Address",
    websiteCta: "Website / registration",
    paidNotice: "This is a paid class. Paid publishing activation is in preparation.",
  },
} as const;

function formatDate(iso: string, lang: Lang): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatComunidadEventDateRange(draft: ComunidadQuickDraft, lang: Lang): string {
  const a = draft.date.trim();
  const b = draft.eventEndDate.trim();
  if (!a) return "—";
  if (!b || b === a) return formatDate(a, lang);
  return `${formatDate(a, lang)} - ${formatDate(b, lang)}`;
}

export function ClasesQuickPreviewCard({ draft, lang }: { draft: ClasesQuickDraft; lang: Lang }) {
  const t = COPY[lang];
  const main = pickMain(draft.images);
  const flyerDoc = main.heroIsFlyerDoc;
  const isPaid = draft.classCostType === "pagada";
  const priceSummary = isPaid
    ? [
        draft.priceAmount.trim(),
        draft.priceFrequency
          ? `· ${clasesFrequencyLabel(draft.priceFrequency, lang)}`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : t.free;

  const scheduleLines = formatWeeklyScheduleLines(draft.weeklySchedule, lang);

  const cityZipLine = cityStateZipLine(draft);

  return (
    <article className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-black/10 bg-white text-[#2A2826] shadow-md">
      <div className="relative aspect-[16/9] w-full bg-neutral-100">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isPaid ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
            }`}
          >
            {clasesCostLabel(draft.classCostType, lang)}
          </span>
          <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {clasesModeLabel(draft.mode, lang)}
          </span>
        </div>
        {flyerDoc ? (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
            {lang === "es" ? "Volante PDF (sin vista previa de imagen)" : "PDF flyer (no image preview)"}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <header>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            {draft.title.trim() || "—"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#5C564E]">
            {t.organizer}: {draft.organizer.trim() || "—"}
          </p>
          {draft.category ? (
            <p className="mt-0.5 text-xs uppercase tracking-wide text-[#9A948C]">
              {draft.category === "otro" && draft.categoryCustom.trim()
                ? draft.categoryCustom.trim()
                : draft.category}
            </p>
          ) : null}
        </header>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.publicCity}
            </dt>
            <dd className="mt-0.5 font-semibold">{cityZipLine || "—"}</dd>
            <p className="text-[11px] text-[#9A948C]">
              {t.discoveryRegion}: {COMMUNITY_DISCOVERY_REGION}
            </p>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.cost}
            </dt>
            <dd className="mt-0.5 font-semibold">{priceSummary}</dd>
            {isPaid && draft.priceNote.trim() ? (
              <p className="text-[11px] text-[#5C564E]">
                {t.priceNote}: {draft.priceNote.trim()}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.schedule}
            </dt>
            <dd className="mt-0.5 whitespace-pre-line">
              {scheduleLines.length ? scheduleLines.join("\n") : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.description}
            </dt>
            <dd className="mt-0.5 whitespace-pre-line">{draft.description.trim() || "—"}</dd>
          </div>
        </dl>

        <CommunityContactCanvas draft={draft} lang={lang} />

        {isPaid ? (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50/85 px-3 py-2 text-xs font-medium text-amber-950">
            {t.paidNotice}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ComunidadQuickPreviewCard({
  draft,
  lang,
}: {
  draft: ComunidadQuickDraft;
  lang: Lang;
}) {
  const t = COPY[lang];
  const main = pickMain(draft.images);
  const flyerDoc = main.heroIsFlyerDoc;

  const cityZipLine = cityStateZipLine(draft);

  const weeklyLines = formatWeeklyScheduleLines(draft.weeklySchedule, lang);
  const sessStart = draft.eventSessionStart.trim();
  const sessEnd = draft.eventSessionEnd.trim();
  const scheduleDisplay =
    weeklyLines.length > 0
      ? weeklyLines.join("\n")
      : sessStart && sessEnd
        ? `${formatTimeForDisplay(sessStart, lang)} – ${formatTimeForDisplay(sessEnd, lang)}`
        : "—";

  return (
    <article className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-black/10 bg-white text-[#2A2826] shadow-md">
      <div className="relative aspect-[16/9] w-full bg-neutral-100">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
            {comunidadCostLabel(draft.eventCost, lang)}
          </span>
        </div>
        {flyerDoc ? (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
            {lang === "es" ? "Volante PDF (sin vista previa de imagen)" : "PDF flyer (no image preview)"}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <header>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            {draft.title.trim() || "—"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[#5C564E]">
            {t.organizer}: {draft.organizer.trim() || "—"}
          </p>
          {draft.category ? (
            <p className="mt-0.5 text-xs uppercase tracking-wide text-[#9A948C]">
              {draft.category === "otro" && draft.categoryCustom.trim()
                ? draft.categoryCustom.trim()
                : draft.category}
            </p>
          ) : null}
        </header>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.publicCity}
            </dt>
            <dd className="mt-0.5 font-semibold">{cityZipLine || "—"}</dd>
            <p className="text-[11px] text-[#9A948C]">
              {t.discoveryRegion}: {COMMUNITY_DISCOVERY_REGION}
            </p>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.eventCost}
            </dt>
            <dd className="mt-0.5 font-semibold">{comunidadCostLabel(draft.eventCost, lang)}</dd>
            {draft.admissionNote.trim() ? (
              <p className="text-[11px] text-[#5C564E]">
                {t.admission}: {draft.admissionNote.trim()}
              </p>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.eventDates}
            </dt>
            <dd className="mt-0.5 font-semibold">{formatComunidadEventDateRange(draft, lang)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.eventWeekly}
            </dt>
            <dd className="mt-0.5 whitespace-pre-line">
              {scheduleDisplay}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.description}
            </dt>
            <dd className="mt-0.5 whitespace-pre-line">{draft.description.trim() || "—"}</dd>
          </div>
        </dl>

        <CommunityContactCanvas draft={draft} lang={lang} />
      </div>
    </article>
  );
}
