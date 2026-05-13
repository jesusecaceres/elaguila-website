"use client";

import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { FiUser } from "react-icons/fi";

import {
  clasesCostLabel,
  clasesFrequencyLabel,
  clasesModeLabel,
  comunidadCostLabel,
} from "../copy/communityPublishCopy";
import {
  labelClasesSkillLevel,
  labelComunidadAccessibilityKey,
  labelCommunityAudience,
  labelCommunityRegistration,
  resolveClasesCategoryPublicLabel,
  resolveComunidadEventTypePublicLabel,
} from "../taxonomy/communityTaxonomy";
import { formatTimeForDisplay, getActiveWeeklyScheduleGridItems } from "../lib/communityWeeklySchedule";
import type {
  ClasesQuickDraft,
  ComunidadQuickDraft,
} from "../types/communityQuickDraft";

import { CommunityContactCanvas } from "./CommunityContactCanvas";
import { CommunityWeeklyScheduleAligned } from "./CommunityWeeklyScheduleAligned";

const WARM_CHIP =
  "inline-flex max-w-full items-center rounded-full border border-[#A98C2A]/45 bg-[#F4EBD8] px-3 py-1 text-xs font-semibold text-[#3D3428] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]";

function OrganizerByline({ label, name }: { label: string; name: string }) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#C9B46A]/50 bg-[#F4EBD8]/65 px-3.5 py-3 sm:px-4">
      <FiUser className="mt-0.5 h-5 w-5 shrink-0 text-[#8B7355]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B5E4E]">{label}</p>
        <p className="mt-0.5 text-lg font-bold leading-snug tracking-tight text-[#2A2826]">{name}</p>
      </div>
    </div>
  );
}

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
    audience: "Para quién",
    level: "Nivel",
    registration: "Registro",
    bring: "Qué llevar o saber",
    accessibility: "Acceso",
  },
  en: {
    organizer: "Organized by",
    publicCity: "City",
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
    audience: "Audience",
    level: "Level",
    registration: "Registration",
    bring: "What to bring or know",
    accessibility: "Access",
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

  const cityZipLine = cityStateZipLine(draft);

  return (
    <article className="mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md">
      <div className="relative h-[min(52vh,420px)] w-full bg-[#f4f0e6]">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          className="object-contain object-top"
          sizes="(max-width: 768px) 100vw, 900px"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              isPaid
                ? "border-amber-800/35 bg-[#FFF3E0] text-[#5D4037]"
                : "border-emerald-800/30 bg-[#E8F3EA] text-[#1B4332]"
            }`}
          >
            {clasesCostLabel(draft.classCostType, lang)}
          </span>
          <span className="rounded-full border border-[#5C4A2A]/45 bg-[#3D3428]/92 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FFFCF7]">
            {clasesModeLabel(draft.mode, lang)}
          </span>
        </div>
        {flyerDoc ? (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
            {lang === "es" ? "Volante PDF (sin vista previa de imagen)" : "PDF flyer (no image preview)"}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 p-5 sm:p-7">
        <header>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            {draft.title.trim() || "—"}
          </h1>
          <OrganizerByline label={t.organizer} name={draft.organizer.trim() || "—"} />
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.category ? (
              <span className={WARM_CHIP}>{resolveClasesCategoryPublicLabel(draft.category, draft.categoryCustom, lang)}</span>
            ) : null}
            <span className={WARM_CHIP}>{clasesModeLabel(draft.mode, lang)}</span>
            {draft.audience ? <span className={WARM_CHIP}>{labelCommunityAudience(draft.audience, lang)}</span> : null}
            {draft.skillLevel ? <span className={WARM_CHIP}>{labelClasesSkillLevel(draft.skillLevel, lang)}</span> : null}
            {cityZipLine ? <span className={WARM_CHIP}>{cityZipLine}</span> : null}
          </div>
        </header>

        <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.publicCity}
            </dt>
            <dd className="mt-0.5 font-semibold">{cityZipLine || "—"}</dd>
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
              {t.registration}
            </dt>
            <dd className="mt-0.5 font-semibold">
              {draft.registrationRequired ? labelCommunityRegistration(draft.registrationRequired, lang) : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.schedule}
            </dt>
            <dd className="mt-0.5 min-w-0">
              <CommunityWeeklyScheduleAligned rows={draft.weeklySchedule} lang={lang} />
            </dd>
          </div>
          {draft.bringNote.trim() ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.bring}</dt>
              <dd className="mt-0.5 whitespace-pre-line">{draft.bringNote.trim()}</dd>
            </div>
          ) : null}
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

  const sessStart = draft.eventSessionStart.trim();
  const sessEnd = draft.eventSessionEnd.trim();
  const schedLang = lang === "en" ? "en" : "es";
  const hasWeeklySchedule = getActiveWeeklyScheduleGridItems(draft.weeklySchedule, schedLang).length > 0;
  const dateChip = formatComunidadEventDateRange(draft, lang);
  const comunidadCostIsFree = draft.eventCost === "gratis";

  return (
    <article className="mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md">
      <div className="relative h-[min(52vh,420px)] w-full bg-[#f4f0e6]">
        <Image
          src={main.url}
          alt={main.alt}
          fill
          className="object-contain object-top"
          sizes="(max-width: 768px) 100vw, 900px"
          unoptimized
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
              comunidadCostIsFree
                ? "border-emerald-800/30 bg-[#E8F3EA] text-[#1B4332]"
                : "border-amber-800/35 bg-[#FFF3E0] text-[#5D4037]"
            }`}
          >
            {comunidadCostLabel(draft.eventCost, lang)}
          </span>
        </div>
        {flyerDoc ? (
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white">
            {lang === "es" ? "Volante PDF (sin vista previa de imagen)" : "PDF flyer (no image preview)"}
          </div>
        ) : null}
      </div>
      <div className="space-y-4 p-5 sm:p-7">
        <header>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
            {draft.title.trim() || "—"}
          </h1>
          <OrganizerByline label={t.organizer} name={draft.organizer.trim() || "—"} />
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.category ? (
              <span className={WARM_CHIP}>{resolveComunidadEventTypePublicLabel(draft.category, draft.categoryCustom, lang)}</span>
            ) : null}
            {draft.audience ? <span className={WARM_CHIP}>{labelCommunityAudience(draft.audience, lang)}</span> : null}
            {dateChip !== "—" ? <span className={WARM_CHIP}>{dateChip}</span> : null}
            {draft.accessibilityKeys.length ? (
              <span className={WARM_CHIP}>{draft.accessibilityKeys.map((k) => labelComunidadAccessibilityKey(k, lang)).join(" · ")}</span>
            ) : null}
            {cityZipLine ? <span className={WARM_CHIP}>{cityZipLine}</span> : null}
          </div>
        </header>

        <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.publicCity}
            </dt>
            <dd className="mt-0.5 font-semibold">{cityZipLine || "—"}</dd>
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
              {t.registration}
            </dt>
            <dd className="mt-0.5 font-semibold">
              {draft.registrationRequired ? labelCommunityRegistration(draft.registrationRequired, lang) : "—"}
            </dd>
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
            <dd className="mt-0.5 min-w-0">
              {hasWeeklySchedule ? (
                <CommunityWeeklyScheduleAligned rows={draft.weeklySchedule} lang={lang} />
              ) : sessStart && sessEnd ? (
                <dl className="grid grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px] sm:grid-cols-[minmax(0,12.5rem)_1fr]">
                  <dt className="min-w-0 font-medium leading-snug text-[#5C564E]">{t.time}</dt>
                  <dd className="min-w-0 font-semibold leading-snug tabular-nums text-[#2A2826]">
                    {formatTimeForDisplay(sessStart, schedLang)} – {formatTimeForDisplay(sessEnd, schedLang)}
                  </dd>
                </dl>
              ) : (
                <span className="text-sm text-[#5C564E]">—</span>
              )}
            </dd>
          </div>
          {draft.bringNote.trim() ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.bring}</dt>
              <dd className="mt-0.5 whitespace-pre-line">{draft.bringNote.trim()}</dd>
            </div>
          ) : null}
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
