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
  isCommunityEventActiveForDiscovery,
  sortComunidadDiscoveryRows,
} from "@/app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration";
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
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import {
  CAT_STD_FILTER_INPUT,
  CAT_STD_FILTER_LABEL,
  CAT_STD_FORM_PANEL,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";
import { categoryStandardUi } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";

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
    const list = rows.filter((row) => {
      const pairs = detailPairsToMap(row.detail_pairs);
      if (category === "comunidad" && !isCommunityEventActiveForDiscovery(pairs)) return false;
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
    return category === "comunidad" ? sortComunidadDiscoveryRows(list) : list;
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
  const ui = categoryStandardUi(lang);
  const resultsAction =
    category === "clases" ? "/clasificados/clases/resultados" : "/clasificados/comunidad/resultados";
  const clearHref = appendLangToPath(resultsAction, lang);
  const publishHref = appendLangToPath(
    category === "clases" ? "/clasificados/publicar/clases" : "/clasificados/publicar/comunidad",
    lang,
  );
  const publishLabel = L
    ? category === "clases"
      ? "Publicar en Clases"
      : "Publicar en Comunidad y Eventos"
    : category === "clases"
      ? "Post in Classes"
      : "Post in Community & Events";

  return (
    <CategoryStandardResultsPageShell>
      <div className="space-y-4">
        <CategoryStandardResultsHeader
          lang={lang}
          title={pageTitle}
          backHref={appendLangToPath(backLandingHref, lang)}
          backLabel={backLandingLabel}
          publishHref={publishHref}
          publishLabel={publishLabel}
          clearHref={clearHref}
          resultCount={loading ? undefined : filtered.length}
        />

          <form action={resultsAction} method="get" className={CAT_STD_FORM_PANEL}>
            <input type="hidden" name="lang" value={lang} />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
              <label className="min-w-0 flex-1">
                <span className="sr-only">{L ? "Buscar" : "Search"}</span>
                <input
                  className="min-h-[2.75rem] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm"
                  name="q"
                  defaultValue={q}
                  placeholder={L ? "Buscar…" : "Search…"}
                />
              </label>
              <label className="min-w-0 lg:w-40">
                <span className="sr-only">{ui.cityZip}</span>
                <input
                  className="min-h-[2.75rem] w-full rounded-lg border border-[#D6C7AD] bg-white px-3 text-sm"
                  name="city"
                  defaultValue={city}
                  placeholder={ui.cityZip}
                />
              </label>
              <button
                type="submit"
                className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] px-6 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
              >
                {ui.search}
              </button>
            </div>

            <details className="group mt-3 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE]/80">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#556B3E] marker:content-none [&::-webkit-details-marker]:hidden">
                {ui.moreFilters}
              </summary>
              <div className="space-y-3 border-t border-[#D6C7AD]/50 px-3 py-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {category === "clases" ? (
                <>
                  <label className={CAT_STD_FILTER_LABEL}>
                    {L ? "Costo" : "Cost"}
                    <select className={CAT_STD_FILTER_INPUT} name="cost" defaultValue={cost}>
                      <option value="all">{L ? "Todos" : "All"}</option>
                      <option value="gratis">{L ? "Gratis" : "Free"}</option>
                      <option value="pagada">{L ? "Pagada" : "Paid"}</option>
                    </select>
                  </label>
                  <label className={CAT_STD_FILTER_LABEL}>
                    {L ? "Modalidad" : "Mode"}
                    <select className={CAT_STD_FILTER_INPUT} name="mode" defaultValue={mode}>
                      <option value="all">{L ? "Todas" : "All"}</option>
                      <option value="presencial">{L ? "Presencial" : "In person"}</option>
                      <option value="enLinea">{L ? "En línea" : "Online"}</option>
                      <option value="hibrida">{L ? "Híbrida" : "Hybrid"}</option>
                    </select>
                  </label>
                </>
              ) : (
                <label className={`${CAT_STD_FILTER_LABEL} sm:col-span-2`}>
                  {L ? "Costo del evento" : "Event cost"}
                  <select className={CAT_STD_FILTER_INPUT} name="eventCost" defaultValue={eventCost}>
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
                <label className={`${CAT_STD_FILTER_LABEL} sm:col-span-2`}>
                  {L ? "Tipo de clase (contiene)" : "Class type (contains)"}
                  <input
                    className={CAT_STD_FILTER_INPUT}
                    name="classType"
                    defaultValue={classType}
                    placeholder={L ? "ej. música, boxeo" : "e.g. music, boxing"}
                  />
                </label>
              ) : (
                <>
                  <label className={`${CAT_STD_FILTER_LABEL} sm:col-span-2`}>
                    {L ? "Tipo de evento (contiene)" : "Event type (contains)"}
                    <input
                      className={CAT_STD_FILTER_INPUT}
                      name="eventType"
                      defaultValue={eventType}
                      placeholder={L ? "ej. voluntariado" : "e.g. volunteer"}
                    />
                  </label>
                  <label className={CAT_STD_FILTER_LABEL}>
                    {L ? "Desde (fecha)" : "From (date)"}
                    <input
                      type="date"
                      className={CAT_STD_FILTER_INPUT}
                      name="dateFrom"
                      defaultValue={dateFrom}
                    />
                  </label>
                  <label className={CAT_STD_FILTER_LABEL}>
                    {L ? "Hasta (fecha)" : "To (date)"}
                    <input
                      type="date"
                      className={CAT_STD_FILTER_INPUT}
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
                <select className={CAT_STD_FILTER_INPUT} name="audience" defaultValue={audienceF}>
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
                  className={CAT_STD_FILTER_INPUT}
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
                  <select className={CAT_STD_FILTER_INPUT} name="level" defaultValue={levelF}>
                    <option value="all">{L ? "Todos" : "All"}</option>
                    {CLASES_SKILL_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {lang === "en" ? o.labelEn : o.labelEs}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className={CAT_STD_FILTER_LABEL}>
                  {L ? "Acceso" : "Access"}
                  <select
                    className={CAT_STD_FILTER_INPUT}
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
              </div>
            </details>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-lg bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721]"
              >
                {L ? "Aplicar filtros" : "Apply filters"}
              </button>
              <Link
                href={clearHref}
                className="rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-2 text-sm font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
              >
                {ui.clearFilters}
              </Link>
              <Link
                href={publishHref}
                className="rounded-lg border border-[#C9A84A]/50 bg-[#FAF6EE] px-4 py-2 text-sm font-semibold text-[#2A4536] hover:bg-[#FBF7EF]"
              >
                {publishLabel}
              </Link>
            </div>
          </form>

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
      </div>
    </CategoryStandardResultsPageShell>
  );
}
