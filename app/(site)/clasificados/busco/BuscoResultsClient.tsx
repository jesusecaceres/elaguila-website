"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { BuscoShellLayout } from "./shared/BuscoShellLayout";
import { BuscoRequestCard } from "./BuscoRequestCard";
import { BuscoResultsSearchPanel } from "./BuscoResultsSearchPanel";
import { buildBuscoRequestCardModel } from "./shared/buscoCardModel";
import { detailPairsToMap } from "./shared/buscoListingDetailPairs";
import { fetchPublishedBuscoListings, type BuscoListingBrowseRow } from "./shared/loadBuscoListings";
import {
  buildBuscoSearchBlob,
  buscoRowHasEmail,
  buscoRowHasPhone,
} from "./shared/buscoSearchText";
import { lightweightLocationMatchesFilter } from "@/app/(site)/clasificados/components/categoryStandard/lightweightBrowseLocation";
import {
  CAT_STD_REFINE_EYEBROW,
  CAT_STD_RESULTS_REFINE_PANEL,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

function buscoLocationRow(row: BuscoListingBrowseRow, pairs: Record<string, string>) {
  return {
    city: row.city,
    state: pairs["Leonix:state"],
    zip: pairs["Leonix:zip"],
    country: pairs["Leonix:buscoCountry"] ?? pairs["Leonix:country"],
  };
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
  const state = (sp?.get("state") ?? "").trim();
  const zip = (sp?.get("zip") ?? "").trim();
  const country = (sp?.get("country") ?? "").trim();
  const zone = (sp?.get("zone") ?? "").trim();
  const budget = (sp?.get("budget") ?? "").trim();
  const contact = (sp?.get("contact") ?? "all").trim().toLowerCase();

  const [rows, setRows] = useState<BuscoListingBrowseRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const landingHref = appendLangToPath("/clasificados/busco", lang);
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
      if (
        !lightweightLocationMatchesFilter(buscoLocationRow(row, pairs), { city, state, zip, country })
      ) {
        return false;
      }
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
  }, [rows, q, city, state, zip, country, zone, budget, tipo, contact, lang]);

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
        clearHref={appendLangToPath("/clasificados/busco/results", lang)}
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
  clearHref: string;
}) {
  const { t, lang, loading, loadErr, filtered, clearHref } = props;

  const refineEyebrow = lang === "es" ? "Afina tu búsqueda" : "Refine your search";

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#5C5346]">{t.subtitle}</p>

      <section className={CAT_STD_RESULTS_REFINE_PANEL} aria-label={refineEyebrow}>
        <p className={CAT_STD_REFINE_EYEBROW}>{refineEyebrow}</p>
        <div className="mt-2">
          <BuscoResultsSearchPanel lang={lang} clearHref={clearHref} />
        </div>
      </section>

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
            <p className="rounded-xl border border-[#D6C7AD]/60 bg-[#FFFCF7]/95 px-4 py-5 text-sm leading-relaxed text-[#5C5346]">
              {t.emptyTitle}. {t.emptyBody}
            </p>
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

