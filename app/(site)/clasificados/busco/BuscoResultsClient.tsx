"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { BUSCO_TYPE_OPTIONS } from "@/app/(site)/publicar/busco/shared/buscoTaxonomy";
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
      if (city && !textMatch(String(row.city ?? ""), city)) return false;
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#1E1810] sm:text-xl">{t.pageTitle}</h2>
        <p className="mt-1 text-sm text-[#5C5346]">{t.subtitle}</p>
      </div>

      <form
        className="space-y-3 rounded-2xl border border-[#B8C8EA]/30 bg-[#FFFCF7] p-4"
        action="/clasificados/busco/resultados"
        method="get"
        aria-label={lang === "es" ? "Filtros de solicitudes" : "Request filters"}
      >
        <input type="hidden" name="lang" value={lang} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            {t.search}
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white px-3 py-2 text-sm"
              name="q"
              defaultValue={q}
              placeholder={lang === "es" ? "Título, descripción, tipo…" : "Title, description, type…"}
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            {t.type}
            <select
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white px-3 py-2 text-sm"
              name="tipo"
              defaultValue={tipo}
            >
              <option value="all">{t.allTypes}</option>
              {BUSCO_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "es" ? o.labelEs : o.labelEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            {t.contact}
            <select
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white px-3 py-2 text-sm"
              name="contact"
              defaultValue={contact}
            >
              <option value="all">{t.contactAll}</option>
              <option value="phone">{t.contactPhone}</option>
              <option value="email">{t.contactEmail}</option>
              <option value="any">{t.contactAny}</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            {t.city}
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white px-3 py-2 text-sm"
              name="city"
              defaultValue={city}
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            {t.zone}
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white px-3 py-2 text-sm"
              name="zone"
              defaultValue={zone}
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            {t.budget}
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#B8C8EA]/35 bg-white px-3 py-2 text-sm"
              name="budget"
              defaultValue={budget}
            />
          </label>
        </div>
        <BuscoFilterActions t={t} lang={lang} />
      </form>

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
              <Link
                href={postHref}
                className="mt-5 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95"
              >
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

function BuscoFilterActions({ t, lang }: { t: (typeof COPY)[Lang]; lang: Lang }) {
  const clearHref = appendLangToPath("/clasificados/busco/resultados", lang);
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button
        type="submit"
        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5]"
      >
        {t.apply}
      </button>
      <Link
        href={clearHref}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#B8C8EA]/55 bg-white px-4 py-2 text-sm font-semibold text-[#111111]"
      >
        {t.clear}
      </Link>
    </div>
  );
}
