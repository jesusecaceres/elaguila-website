"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  detailPairsToMap,
  isCommunityQuickListing,
  parseAccessibilityKeysCsv,
} from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import {
  buildCommunityDiscoveryCardModel,
  buildCommunityDiscoverySearchBlob,
} from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import {
  fetchPublishedCommunityCategoryListings,
  type CommunityListingBrowseRow,
} from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";
import {
  CLASES_SKILL_LEVEL_OPTIONS,
  COMUNIDAD_ACCESSIBILITY_OPTIONS,
  COMMUNITY_AUDIENCE_OPTIONS,
  COMMUNITY_REGISTRATION_OPTIONS,
  labelClasesSkillLevel,
  labelCommunityAudience,
  resolveClasesCategoryPublicLabel,
  resolveComunidadEventTypePublicLabel,
} from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import Navbar from "@/app/components/Navbar";

import { CommunityDiscoveryListingCard } from "./CommunityDiscoveryListingCard";

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
  const audienceF = (sp?.get("audience") ?? "all").trim().toLowerCase();
  const levelF = (sp?.get("level") ?? "all").trim().toLowerCase();
  const registrationF = (sp?.get("registration") ?? "all").trim().toLowerCase();
  const accessibilityF = (sp?.get("accessibility") ?? "all").trim().toLowerCase();

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
      const quick = isCommunityQuickListing(pairs);
      const blob = buildCommunityDiscoverySearchBlob(row, category, pairs, lang);
      if (!textMatch(blob, q)) return false;
      if (city && !(String(row.city ?? "").toLowerCase().includes(city.toLowerCase()))) return false;

      if (!quick) return true;

      const classTypeLine =
        category === "clases" && quick
          ? resolveClasesCategoryPublicLabel(
              pairs["Leonix:classCategory"] ?? "",
              pairs["Leonix:classCategoryCustom"] ?? "",
              lang,
            )
          : "";

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
          const hay = `${String(catRaw ?? "")} ${classTypeLine}`.toLowerCase();
          if (!textMatch(hay, classType)) return false;
        }
        if (audienceF !== "all") {
          const a = (pairs["Leonix:audience"] ?? "").trim().toLowerCase();
          if (a !== audienceF) return false;
        }
        if (levelF !== "all") {
          const lv = (pairs["Leonix:skillLevel"] ?? "").trim().toLowerCase();
          if (lv !== levelF) return false;
        }
        if (registrationF !== "all") {
          const r = (pairs["Leonix:registrationRequired"] ?? "").trim().toLowerCase();
          if (r !== registrationF) return false;
        }
      } else {
        if (eventCost !== "all") {
          const ec = (pairs["Leonix:eventCost"] ?? "").trim().toLowerCase();
          if (ec !== eventCost) return false;
        }
        if (eventType.trim()) {
          const slug = (pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "").trim();
          const catRaw = slug === "otro" ? pairs["Leonix:eventCategoryCustom"] || slug : slug;
          const eventTypeLine = isCommunityQuickListing(pairs)
            ? resolveComunidadEventTypePublicLabel(
                pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "",
                pairs["Leonix:eventCategoryCustom"] ?? "",
                lang,
              )
            : "";
          const hay = `${String(catRaw ?? "")} ${eventTypeLine}`.toLowerCase();
          if (!textMatch(hay, eventType)) return false;
        }
        const isoLike = /^\d{4}-\d{2}-\d{2}/;
        const start = (pairs["Leonix:eventDate"] ?? "").trim();
        const startKey = isoLike.test(start) ? start.slice(0, 10) : "";
        if (dateFrom.trim() && startKey && startKey < dateFrom.trim()) return false;
        if (dateTo.trim() && startKey && startKey > dateTo.trim()) return false;
        if (audienceF !== "all") {
          const a = (pairs["Leonix:audience"] ?? "").trim().toLowerCase();
          if (a !== audienceF) return false;
        }
        if (registrationF !== "all") {
          const r = (pairs["Leonix:registrationRequired"] ?? "").trim().toLowerCase();
          if (r !== registrationF) return false;
        }
        if (accessibilityF !== "all") {
          const keys = parseAccessibilityKeysCsv(pairs["Leonix:accessibility"]);
          if (!keys.includes(accessibilityF)) return false;
        }
      }
      return true;
    });
  }, [
    rows,
    q,
    city,
    cost,
    mode,
    eventCost,
    category,
    classType,
    eventType,
    dateFrom,
    dateTo,
    lang,
    audienceF,
    levelF,
    registrationF,
    accessibilityF,
  ]);

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
                    placeholder={L ? "ej. música, boxeo" : "e.g. music, boxing"}
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
            <div className="grid gap-3 border-t border-black/5 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-xs font-semibold text-[#5C564E]">
                {L ? "Para quién" : "Audience"}
                <select className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" name="audience" defaultValue={audienceF}>
                  <option value="all">{L ? "Todos" : "All"}</option>
                  {COMMUNITY_AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-[#5C564E]">
                {L ? "¿Requiere registro?" : "Registration?"}
                <select
                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                  name="registration"
                  defaultValue={registrationF}
                >
                  <option value="all">{L ? "Todos" : "All"}</option>
                  {COMMUNITY_REGISTRATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "en" ? o.labelEn : o.labelEs}
                    </option>
                  ))}
                </select>
              </label>
              {category === "clases" ? (
                <label className="block text-xs font-semibold text-[#5C564E]">
                  {L ? "Nivel" : "Level"}
                  <select className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" name="level" defaultValue={levelF}>
                    <option value="all">{L ? "Todos" : "All"}</option>
                    {CLASES_SKILL_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {lang === "en" ? o.labelEn : o.labelEs}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="block text-xs font-semibold text-[#5C564E]">
                  {L ? "Acceso" : "Access"}
                  <select
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                    name="accessibility"
                    defaultValue={accessibilityF}
                  >
                    <option value="all">{L ? "Todos" : "All"}</option>
                    {COMUNIDAD_ACCESSIBILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {lang === "en" ? o.labelEn : o.labelEs}
                      </option>
                    ))}
                  </select>
                </label>
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
          <ul className="grid gap-5 sm:grid-cols-1 lg:grid-cols-2" data-testid="community-discovery-results-grid">
            {filtered.map((row) => {
              const href = appendLangToPath(`/clasificados/anuncio/${row.id}`, lang);
              const model = buildCommunityDiscoveryCardModel(row, category, lang, href);
              return (
                <li key={row.id} className="min-w-0">
                  <CommunityDiscoveryListingCard model={model} lang={lang} variant={category} />
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
