"use client";

import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { COMMUNITY_DISCOVERY_REGION } from "../constants/communityRegion";
import {
  clasesCostLabel,
  clasesFrequencyLabel,
  clasesModeLabel,
  comunidadCostLabel,
} from "../copy/communityPublishCopy";
import type {
  ClasesQuickDraft,
  ComunidadQuickDraft,
} from "../types/communityQuickDraft";

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

function formatTimeRange(start: string, end: string): string {
  if (!start && !end) return "—";
  if (start && end) return `${start} – ${end}`;
  return start || end;
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

  const scheduleLines = draft.scheduleRows
    .filter((r) => r.day.trim() || r.time.trim())
    .map((r) => {
      const day = r.day.trim();
      const time = r.time.trim();
      if (day && time) return `${day}: ${time}`;
      return day || time;
    });

  const cityLine =
    [draft.publicCity.trim(), draft.state.trim()].filter(Boolean).join(", ") || "—";

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
            <dd className="mt-0.5 font-semibold">{cityLine}</dd>
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
          {draft.venue.trim() || draft.addressLine1.trim() ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
                {t.venue}
              </dt>
              <dd className="mt-0.5">
                {[draft.venue.trim(), draft.addressLine1.trim()].filter(Boolean).join(" · ") ||
                  "—"}
              </dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.description}
            </dt>
            <dd className="mt-0.5 whitespace-pre-line">{draft.description.trim() || "—"}</dd>
          </div>
        </dl>

        <ContactBlock draft={draft} lang={lang} />

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

  const cityLine =
    [draft.publicCity.trim(), draft.state.trim()].filter(Boolean).join(", ") || "—";

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
            <dd className="mt-0.5 font-semibold">{cityLine}</dd>
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
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.date}
            </dt>
            <dd className="mt-0.5 font-semibold">{formatDate(draft.date, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.time}
            </dt>
            <dd className="mt-0.5 font-semibold">
              {formatTimeRange(draft.startTime, draft.endTime)}
            </dd>
          </div>
          {draft.venue.trim() || draft.addressLine1.trim() ? (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
                {t.venue}
              </dt>
              <dd className="mt-0.5">
                {[draft.venue.trim(), draft.addressLine1.trim()].filter(Boolean).join(" · ") ||
                  "—"}
              </dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">
              {t.description}
            </dt>
            <dd className="mt-0.5 whitespace-pre-line">{draft.description.trim() || "—"}</dd>
          </div>
        </dl>

        <ContactBlock draft={draft} lang={lang} />
      </div>
    </article>
  );
}

function ContactBlock({
  draft,
  lang,
}: {
  draft: { phone: string; whatsapp: string; email: string; website: string };
  lang: Lang;
}) {
  const t = COPY[lang];
  const items: { label: string; value: string }[] = [
    { label: lang === "es" ? "Teléfono" : "Phone", value: draft.phone.trim() },
    { label: "WhatsApp", value: draft.whatsapp.trim() },
    { label: lang === "es" ? "Correo" : "Email", value: draft.email.trim() },
    { label: t.websiteCta, value: draft.website.trim() },
  ].filter((x) => x.value);
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9A948C]">{t.contact}</p>
      <ul className="mt-1 space-y-0.5">
        {items.map((it) => (
          <li key={it.label} className="flex flex-wrap gap-2">
            <span className="font-semibold text-[#5C564E]">{it.label}:</span>
            <span>{it.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
