"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

import { MascotasPerdidosNoticeCard } from "./MascotasPerdidosNoticeCard";
import { MascotasPerdidosShellLayout } from "./shared/MascotasPerdidosShellLayout";
import { buildMascotasPerdidosNoticeCardModel } from "./shared/mascotasPerdidosCardModel";
import { detailPairsToMap } from "./shared/mascotasPerdidosListingDetailPairs";
import {
  fetchPublishedMascotasPerdidosListings,
  type MascotasPerdidosListingBrowseRow,
} from "./shared/loadMascotasPerdidosListings";
import { mascotasPerdidosCityMatches } from "./shared/mascotasPerdidosCityMatch";
import { buildMascotasPerdidosSearchBlob } from "./shared/mascotasPerdidosSearchText";
import { MascotasResultsCityFilter } from "./MascotasResultsCityFilter";

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

const COPY = {
  es: {
    pageTitle: "Avisos publicados",
    subtitle: "Busca y filtra avisos de mascotas y perdidos en Leonix Clasificados.",
    search: "Buscar",
    type: "Tipo de aviso",
    city: "Ciudad",
    allTypes: "Todos los tipos",
    apply: "Aplicar filtros",
    clear: "Limpiar",
    count: (n: number) => `${n} aviso${n === 1 ? "" : "s"}`,
    emptyTitle: "No hay avisos que coincidan",
    emptyBody: "Prueba otros filtros o publica el primer aviso gratuito en tu zona.",
    ctaPost: "Publicar aviso gratis",
    loadErr: "No se pudieron cargar los avisos.",
    loading: "Cargando avisos…",
  },
  en: {
    pageTitle: "Published notices",
    subtitle: "Search and filter pets & lost & found notices on Leonix Classifieds.",
    search: "Search",
    type: "Notice type",
    city: "City",
    allTypes: "All types",
    apply: "Apply filters",
    clear: "Clear",
    count: (n: number) => `${n} notice${n === 1 ? "" : "s"}`,
    emptyTitle: "No matching notices",
    emptyBody: "Try different filters or post the first free notice in your area.",
    ctaPost: "Post a free notice",
    loadErr: "Could not load notices.",
    loading: "Loading notices…",
  },
} as const;

export function MascotasPerdidosResultsClient() {
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";
  const t = COPY[lang];

  const q = (sp?.get("q") ?? "").trim();
  const tipo = (sp?.get("tipo") ?? "all").trim().toLowerCase();
  const city = (sp?.get("city") ?? "").trim();

  const [rows, setRows] = useState<MascotasPerdidosListingBrowseRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const landingHref = appendLangToPath("/clasificados/mascotas-y-perdidos", lang);
  const postHref = appendLangToPath("/clasificados/publicar/mascotas-y-perdidos", lang);
  const backLabel =
    lang === "es" ? "Volver a Mascotas y Perdidos" : "Back to Pets & Lost & Found";

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    const { rows: data, error } = await fetchPublishedMascotasPerdidosListings(160);
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
      const blob = buildMascotasPerdidosSearchBlob(row, pairs, lang);
      if (!textMatch(blob, q)) return false;
      if (city && !mascotasPerdidosCityMatches(row.city, city)) return false;
      if (tipo !== "all") {
        const slug = (pairs["Leonix:noticeType"] ?? "").trim().toLowerCase();
        if (slug !== tipo) return false;
      }
      return true;
    });
  }, [rows, q, city, tipo, lang]);

  return (
    <MascotasPerdidosShellLayout lang={lang} backHref={landingHref} backLabel={backLabel}>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#1E1810] sm:text-xl">{t.pageTitle}</h2>
          <p className="mt-1 text-sm text-[#5C5346]">{t.subtitle}</p>
        </div>

        <form
          className="space-y-3 rounded-2xl border border-[#C9B46A]/30 bg-[#FFFCF7] p-4"
          action="/clasificados/mascotas-y-perdidos/resultados"
          method="get"
          aria-label={lang === "es" ? "Filtros de avisos" : "Notice filters"}
        >
          <input type="hidden" name="lang" value={lang} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
              {t.search}
              <input
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#C9B46A]/35 bg-white px-3 py-2 text-sm"
                name="q"
                defaultValue={q}
                placeholder={lang === "es" ? "Título, descripción, tipo…" : "Title, description, type…"}
              />
            </label>
            <label className="block text-xs font-semibold text-[#5C5346]">
              {t.type}
              <select
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[#C9B46A]/35 bg-white px-3 py-2 text-sm"
                name="tipo"
                defaultValue={tipo}
              >
                <option value="all">{t.allTypes}</option>
                {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {lang === "es" ? o.labelEs : o.labelEn}
                  </option>
                ))}
              </select>
            </label>
            <MascotasResultsCityFilter lang={lang} label={t.city} defaultValue={city} />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5]"
            >
              {t.apply}
            </button>
            <Link
              href={appendLangToPath("/clasificados/mascotas-y-perdidos/resultados", lang)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-white px-4 py-2 text-sm font-semibold text-[#111111]"
            >
              {t.clear}
            </Link>
          </div>
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
            <p className="text-sm font-semibold text-[#6B5A32]" data-testid="mascotas-perdidos-results-count">
              {t.count(filtered.length)}
            </p>
            {filtered.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-[#C9B46A]/45 bg-[#FFF9ED]/90 px-4 py-10 text-center">
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
              <ul className="grid gap-4" data-testid="mascotas-perdidos-results-list">
                {filtered.map((r) => {
                  const href = appendLangToPath(`/clasificados/anuncio/${r.id}`, lang);
                  const model = buildMascotasPerdidosNoticeCardModel(r, lang, href);
                  return (
                    <li key={r.id} className="min-w-0">
                      <MascotasPerdidosNoticeCard model={model} lang={lang} />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </MascotasPerdidosShellLayout>
  );
}
