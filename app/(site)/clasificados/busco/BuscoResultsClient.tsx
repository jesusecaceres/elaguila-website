"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { BUSCO_TYPE_OPTIONS } from "@/app/(site)/publicar/busco/shared/buscoTaxonomy";
import {
  CAT_STD_BTN_PRIMARY,
  CAT_STD_FILTER_INPUT,
  CAT_STD_FILTER_LABEL,
  CAT_STD_FILTER_SELECT,
  CategoryStandardResultsFilterPanel,
} from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsFilterPanel";
import { BuscoShellLayout } from "./shared/BuscoShellLayout";
import { BuscoRequestCard } from "./BuscoRequestCard";
import { buildBuscoRequestCardModel } from "./shared/buscoCardModel";
import { detailPairsToMap } from "./shared/buscoListingDetailPairs";
import { fetchPublishedBuscoListings, type BuscoListingBrowseRow } from "./shared/loadBuscoListings";
import {
  buildBuscoSearchBlob,
  buscoRowHasEmail,
  buscoRowHasPhone,
} from "./shared/buscoSearchText";

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

function buscoLocationSearchBlob(row: BuscoListingBrowseRow, pairs: Record<string, string>): string {
  return [
    row.city,
    pairs["Leonix:state"],
    pairs["Leonix:zip"],
    pairs["Leonix:buscoZone"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const COPY = {
  es: {
    pageTitle: "Solicitudes publicadas",
    subtitle: "Busca y filtra solicitudes locales en Leonix Clasificados.",
    search: "Buscar",
    type: "Tipo de búsqueda",
    city: "Ciudad (contiene)",
    zone: "Zona (contiene)",
    budget: "Presupuesto (contiene)",
    contact: "Contacto",
    contactAll: "Cualquier contacto",
    contactPhone: "Con teléfono / WhatsApp",
    contactEmail: "Con correo",
    contactAny: "Teléfono o correo",
    allTypes: "Todos los tipos",
    apply: "Aplicar filtros",
    clear: "Limpiar",
    count: (n: number) => `${n} solicitud${n === 1 ? "" : "es"}`,
    emptyTitle: "No hay solicitudes que coincidan",
    emptyBody: "Prueba otros filtros o publica la primera solicitud en tu zona.",
    ctaPost: "Publicar solicitud",
    loadErr: "No se pudieron cargar las solicitudes.",
    loading: "Cargando solicitudes…",
  },
  en: {
    pageTitle: "Published requests",
    subtitle: "Search and filter local requests on Leonix Classifieds.",
    search: "Search",
    type: "Request type",
    city: "City (contains)",
    zone: "Zone (contains)",
    budget: "Budget (contains)",
    contact: "Contact",
    contactAll: "Any contact",
    contactPhone: "Phone / WhatsApp",
    contactEmail: "Email",
    contactAny: "Phone or email",
    allTypes: "All types",
    apply: "Apply filters",
    clear: "Clear",
    count: (n: number) => `${n} request${n === 1 ? "" : "s"}`,
    emptyTitle: "No matching requests",
    emptyBody: "Try different filters or post the first request in your area.",
    ctaPost: "Post request",
    loadErr: "Could not load requests.",
    loading: "Loading requests…",
  },
} as const;

export function BuscoResultsClient() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const t = COPY[lang];

  const q = (sp?.get("q") ?? "").trim();
  const tipo = (sp?.get("tipo") ?? "all").trim().toLowerCase();
  const city = (sp?.get("city") ?? "").trim();
  const zone = (sp?.get("zone") ?? "").trim();
  const budget = (sp?.get("budget") ?? "").trim();
  const contact = (sp?.get("contact") ?? "all").trim().toLowerCase();

  const [rows, setRows] = useState<BuscoListingBrowseRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const landingHref = appendLangToPath("/clasificados/busco", lang);
  const postHref = appendLangToPath("/publicar/busco/quick", lang);
  const backLabel = lang === "es" ? "Volver a Busco / Se busca" : "Back to Looking for / Wanted";

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const { rows: data, error } = await fetchPublishedBuscoListings(160);
    if (error) setLoadErr(error);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const pairs = detailPairsToMap(row.detail_pairs);
      const blob = buildBuscoSearchBlob(row, pairs, lang);
      if (!textMatch(blob, q)) return false;
      if (city && !textMatch(buscoLocationSearchBlob(row, pairs), city)) return false;
      if (zone && !textMatch(pairs["Leonix:buscoZone"] ?? "", zone)) return false;
      if (budget && !textMatch(pairs["Leonix:buscoBudget"] ?? "", budget)) return false;

      if (tipo !== "all") {
        const slug = (pairs["Leonix:buscoType"] ?? "").trim().toLowerCase();
        if (slug !== tipo) return false;
      }

      if (contact === "phone" && !buscoRowHasPhone(row, pairs)) return false;
      if (contact === "email" && !buscoRowHasEmail(row, pairs)) return false;
      if (contact === "any" && !buscoRowHasPhone(row, pairs) && !buscoRowHasEmail(row, pairs)) return false;

      return true;
    });
  }, [rows, q, city, zone, budget, tipo, contact, lang]);

  return (
    <BuscoShellLayout lang={lang} backHref={landingHref} backLabel={backLabel}>
      <BuscoResultsInner
        t={t}
        lang={lang}
        loading={loading}
        loadErr={loadErr}
        filtered={filtered}
        q={q}
        tipo={tipo}
        city={city}
        zone={zone}
        budget={budget}
        contact={contact}
        postHref={postHref}
      />
    </BuscoShellLayout>
  );
}

function BuscoResultsInner(props: {
  t: (typeof COPY)[Lang];
  lang: Lang;
  loading: boolean;
  loadErr: string | null;
  filtered: BuscoListingBrowseRow[];
  q: string;
  tipo: string;
  city: string;
  zone: string;
  budget: string;
  contact: string;
  postHref: string;
}) {
  const { t, lang, loading, loadErr, filtered, q, tipo, city, zone, budget, contact, postHref } = props;

  const clearHref = appendLangToPath("/clasificados/busco/results", lang);
  const searchPh = lang === "es" ? "Título, descripción, tipo…" : "Title, description, type…";

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#5C5346]">{t.subtitle}</p>

      <CategoryStandardResultsFilterPanel
        lang={lang}
        action="/clasificados/busco/results"
        defaultQ={q}
        defaultCity={city}
        searchPlaceholder={searchPh}
        clearHref={clearHref}
        applyLabel={t.apply}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={CAT_STD_FILTER_LABEL}>
              {t.type}
              <select className={CAT_STD_FILTER_SELECT} name="tipo" defaultValue={tipo}>
                <option value="all">{t.allTypes}</option>
                {BUSCO_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === "es" ? o.labelEs : o.labelEn}
                  </option>
                ))}
              </select>
            </label>
            <label className={CAT_STD_FILTER_LABEL}>
              {t.contact}
              <select className={CAT_STD_FILTER_SELECT} name="contact" defaultValue={contact}>
                <option value="all">{t.contactAll}</option>
                <option value="phone">{t.contactPhone}</option>
                <option value="email">{t.contactEmail}</option>
                <option value="any">{t.contactAny}</option>
              </select>
            </label>
            <label className={CAT_STD_FILTER_LABEL}>
              {t.zone}
              <input className={CAT_STD_FILTER_INPUT} name="zone" defaultValue={zone} />
            </label>
            <label className={CAT_STD_FILTER_LABEL}>
              {t.budget}
              <input className={CAT_STD_FILTER_INPUT} name="budget" defaultValue={budget} />
            </label>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-[#5C5346]" aria-busy="true">
          {t.loading}
        </p>
      ) : loadErr ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950" role="alert">
          {t.loadErr} {loadErr}
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold text-[#3d5a73]" data-testid="busco-results-count">
            {t.count(filtered.length)}
          </p>
          {filtered.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-[#B8C8EA]/45 bg-[#F8FAFF]/90 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-[#1E1810]">{t.emptyTitle}</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C5346]/90">{t.emptyBody}</p>
              <Link href={postHref} className={`mt-5 ${CAT_STD_BTN_PRIMARY}`}>
                {t.ctaPost}
              </Link>
            </section>
          ) : (
            <ul className="grid gap-4" data-testid="busco-results-list">
              {filtered.map((r) => {
                const href = appendLangToPath(`/clasificados/anuncio/${r.id}`, lang);
                const model = buildBuscoRequestCardModel(r, lang, href);
                return (
                  <li key={r.id} className="min-w-0">
                    <BuscoRequestCard model={model} lang={lang} />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

