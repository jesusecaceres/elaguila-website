"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
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
import {
  fetchPublishedCommunityCategoryListings,
  type CommunityListingBrowseRow,
} from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import Navbar from "@/app/components/Navbar";

function firstImageUrl(images: unknown): string | null {
  if (images == null) return null;
  if (Array.isArray(images) && images.length) {
    const x = images[0];
    if (typeof x === "string" && x.trim()) return x.trim();
    if (x && typeof x === "object") {
      const u = (x as { url?: string }).url;
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  }
  return null;
}

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

type Props = {
  category: "clases" | "comunidad";
  pageTitleEs: string;
  pageTitleEn: string;
  backLandingHref: string;
  backLandingLabelEs: string;
  backLandingLabelEn: string;
};

export function CommunityListingsResultsClient({
  category,
  pageTitleEs,
  pageTitleEn,
  backLandingHref,
  backLandingLabelEs,
  backLandingLabelEn,
}: Props) {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const [rows, setRows] = useState<CommunityListingBrowseRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const q = (sp?.get("q") ?? "").trim();
  const city = (sp?.get("city") ?? "").trim();
  const cost = (sp?.get("cost") ?? "all").trim().toLowerCase();
  const mode = (sp?.get("mode") ?? "all").trim().toLowerCase();
  const eventCost = (sp?.get("eventCost") ?? "all").trim().toLowerCase();
  const classType = (sp?.get("classType") ?? "").trim();
  const eventType = (sp?.get("eventType") ?? "").trim();
  const dateFrom = (sp?.get("dateFrom") ?? "").trim();
  const dateTo = (sp?.get("dateTo") ?? "").trim();

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const { rows: data, error } = await fetchPublishedCommunityCategoryListings(category, 160);
    if (error) setLoadErr(error);
    setRows(data);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const pairs = detailPairsToMap(row.detail_pairs);
      if (!isCommunityQuickListing(pairs)) return true;
      const title = String(row.title ?? "");
      const desc = String(row.description ?? "");
      const blob = `${title} ${desc} ${pairs["Leonix:organizer"] ?? ""}`.toLowerCase();
      if (!textMatch(blob, q)) return false;
      if (city && !(String(row.city ?? "").toLowerCase().includes(city.toLowerCase()))) return false;

      if (category === "clases") {
        if (cost !== "all") {
          const ct = (pairs["Leonix:classCostType"] ?? "").trim();
          if (cost === "gratis" && ct !== "gratis") return false;
          if (cost === "pagada" && ct !== "pagada") return false;
        }
        if (mode !== "all") {
          const m = (pairs["Leonix:mode"] ?? "").trim().toLowerCase();
          if (m !== mode.toLowerCase()) return false;
        }
        if (classType.trim()) {
          const catRaw =
            pairs["Leonix:classCategory"] === "otro"
              ? pairs["Leonix:classCategoryCustom"] || pairs["Leonix:classCategory"]
              : pairs["Leonix:classCategory"];
          if (!textMatch(String(catRaw ?? ""), classType)) return false;
        }
      } else {
        if (eventCost !== "all") {
          const ec = (pairs["Leonix:eventCost"] ?? "").trim().toLowerCase();
          if (ec !== eventCost) return false;
        }
        if (eventType.trim()) {
          const catRaw =
            pairs["Leonix:eventCategory"] === "otro"
              ? pairs["Leonix:eventCategoryCustom"] || pairs["Leonix:eventCategory"]
              : pairs["Leonix:eventCategory"];
          if (!textMatch(String(catRaw ?? ""), eventType)) return false;
        }
        const isoLike = /^\d{4}-\d{2}-\d{2}/;
        const start = (pairs["Leonix:eventDate"] ?? "").trim();
        const startKey = isoLike.test(start) ? start.slice(0, 10) : "";
        if (dateFrom.trim() && startKey && startKey < dateFrom.trim()) return false;
        if (dateTo.trim() && startKey && startKey > dateTo.trim()) return false;
      }
      return true;
    });
  }, [rows, q, city, cost, mode, eventCost, category, classType, eventType, dateFrom, dateTo]);

  const L = lang === "es";
  const pageTitle = L ? pageTitleEs : pageTitleEn;
  const backLandingLabel = L ? backLandingLabelEs : backLandingLabelEn;

  return (
    <div className="min-h-screen bg-[#ECEAE7] pb-20 text-[#111111]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-10 pt-24 sm:px-5">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{pageTitle}</h1>
            <p className="mt-1 text-sm text-[#5C564E]">
              {L ? "Anuncios publicados en Leonix Clasificados." : "Listings published on Leonix Clasificados."}
            </p>
          </div>
          <Link
            href={appendLangToPath(backLandingHref, lang)}
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5]"
          >
            ← {backLandingLabel}
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-sm">
          <form
            className="space-y-3"
            action={category === "clases" ? "/clasificados/clases/resultados" : "/clasificados/comunidad/resultados"}
            method="get"
          >
            <input type="hidden" name="lang" value={lang} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-semibold text-[#5C564E]">
                {L ? "Buscar" : "Search"}
                <input className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" name="q" defaultValue={q} />
              </label>
              <label className="block text-xs font-semibold text-[#5C564E]">
                {L ? "Ciudad (contiene)" : "City (contains)"}
                <input className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" name="city" defaultValue={city} />
              </label>
              {category === "clases" ? (
                <>
                  <label className="block text-xs font-semibold text-[#5C564E]">
                    {L ? "Costo" : "Cost"}
                    <select className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" name="cost" defaultValue={cost}>
                      <option value="all">{L ? "Todos" : "All"}</option>
                      <option value="gratis">{L ? "Gratis" : "Free"}</option>
                      <option value="pagada">{L ? "Pagada" : "Paid"}</option>
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-[#5C564E]">
                    {L ? "Modalidad" : "Mode"}
                    <select className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" name="mode" defaultValue={mode}>
                      <option value="all">{L ? "Todas" : "All"}</option>
                      <option value="presencial">{L ? "Presencial" : "In person"}</option>
                      <option value="enLinea">{L ? "En línea" : "Online"}</option>
                      <option value="hibrida">{L ? "Híbrida" : "Hybrid"}</option>
                    </select>
                  </label>
                </>
              ) : (
                <label className="block text-xs font-semibold text-[#5C564E] sm:col-span-2">
                  {L ? "Costo del evento" : "Event cost"}
                  <select
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    name="eventCost"
                    defaultValue={eventCost}
                  >
                    <option value="all">{L ? "Todos" : "All"}</option>
                    <option value="gratis">{L ? "Gratis" : "Free"}</option>
                    <option value="pagado">{L ? "Pagado" : "Paid"}</option>
                    <option value="donacion">{L ? "Donación" : "Donation"}</option>
                    <option value="noConfirmado">{L ? "Por confirmar" : "TBD"}</option>
                  </select>
                </label>
              )}
            </div>
            <div className="grid gap-3 border-t border-black/5 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              {category === "clases" ? (
                <label className="block text-xs font-semibold text-[#5C564E] sm:col-span-2">
                  {L ? "Tipo de clase (contiene)" : "Class type (contains)"}
                  <input
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    name="classType"
                    defaultValue={classType}
                    placeholder={L ? "ej. música, idiomas" : "e.g. music, languages"}
                  />
                </label>
              ) : (
                <>
                  <label className="block text-xs font-semibold text-[#5C564E] sm:col-span-2">
                    {L ? "Tipo de evento (contiene)" : "Event type (contains)"}
                    <input
                      className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      name="eventType"
                      defaultValue={eventType}
                      placeholder={L ? "ej. voluntariado" : "e.g. volunteer"}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#5C564E]">
                    {L ? "Desde (fecha)" : "From (date)"}
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      name="dateFrom"
                      defaultValue={dateFrom}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#5C564E]">
                    {L ? "Hasta (fecha)" : "To (date)"}
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                      name="dateTo"
                      defaultValue={dateTo}
                    />
                  </label>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="rounded-lg bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
                {L ? "Aplicar filtros" : "Apply filters"}
              </button>
              <Link
                href={appendLangToPath(
                  category === "clases" ? "/clasificados/clases/resultados" : "/clasificados/comunidad/resultados",
                  lang,
                )}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5]"
              >
                {L ? "Limpiar" : "Clear"}
              </Link>
            </div>
          </form>
        </div>

        {loadErr ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {loadErr}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#5C564E]" aria-busy="true">
            {L ? "Cargando…" : "Loading…"}
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-black/10 bg-white/90 px-4 py-6 text-sm text-[#5C564E]">
            {L ? "No hay anuncios con estos filtros." : "No listings match these filters."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {filtered.map((row) => {
              const pairs = detailPairsToMap(row.detail_pairs);
              const thumb = firstImageUrl(row.images);
              const org = pairs["Leonix:organizer"] ?? "";
              const schedJson = pairs["Leonix:weeklyScheduleJson"] ?? "";
              const sched = summarizeWeeklySchedule(parseWeeklyScheduleJson(schedJson), lang);
              const href = appendLangToPath(`/clasificados/anuncio/${row.id}`, lang);
              let sub: string;
              if (category === "clases") {
                const cat =
                  pairs["Leonix:classCategory"] === "otro"
                    ? pairs["Leonix:classCategoryCustom"] || pairs["Leonix:classCategory"]
                    : pairs["Leonix:classCategory"];
                const costL = clasesCostTypeLabel(pairs["Leonix:classCostType"] ?? "", lang);
                const modeL = clasesModeLabel(pairs["Leonix:mode"] ?? "", lang);
                let priceLine = costL;
                if (pairs["Leonix:classCostType"] === "pagada") {
                  const amt = pairs["Leonix:priceAmount"] ?? "";
                  const fq = pairs["Leonix:priceFrequency"] ?? "";
                  const fqL = fq ? clasesPriceFrequencyLabel(fq, lang) : "";
                  priceLine = amt ? `${amt} ${fqL}`.trim() : costL;
                }
                sub = [String(cat ?? ""), modeL, priceLine, row.city ?? ""].filter(Boolean).join(" · ");
              } else {
                const cat =
                  pairs["Leonix:eventCategory"] === "otro"
                    ? pairs["Leonix:eventCategoryCustom"] || pairs["Leonix:eventCategory"]
                    : pairs["Leonix:eventCategory"];
                const ec = comunidadEventCostLabel(pairs["Leonix:eventCost"] ?? "", lang);
                const dr = [pairs["Leonix:eventDate"], pairs["Leonix:eventEndDate"]].filter(Boolean).join(" → ");
                sub = [String(cat ?? ""), ec, dr || null, row.city ?? ""].filter(Boolean).join(" · ");
              }
              return (
                <li key={row.id} className="min-w-0">
                  <Link
                    href={href}
                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:border-[#C9B46A]/50"
                  >
                    <div className="relative aspect-[16/10] w-full bg-neutral-100">
                      {thumb ? (
                        <Image src={thumb} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#7A7164]">{L ? "Sin foto" : "No photo"}</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="line-clamp-2 text-sm font-bold text-[#111111]">{row.title ?? "—"}</p>
                      {org ? <p className="text-xs text-[#5C564E]">{org}</p> : null}
                      <p className="line-clamp-2 text-xs text-[#5C564E]">{sub}</p>
                      {sched ? (
                        <p className="line-clamp-2 text-[11px] text-[#3d5a73]">
                          {L ? "Horario: " : "Schedule: "}
                          {sched}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
