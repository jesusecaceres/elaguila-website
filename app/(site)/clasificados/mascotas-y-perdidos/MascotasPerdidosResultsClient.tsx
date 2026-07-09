"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { MascotasPerdidosNoticeCard } from "./MascotasPerdidosNoticeCard";
import { MascotasResultsSearchPanel } from "./MascotasResultsSearchPanel";
import {
  CAT_STD_REFINE_EYEBROW,
  CAT_STD_RESULTS_REFINE_PANEL,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";
import { MascotasPerdidosShellLayout } from "./shared/MascotasPerdidosShellLayout";
import { buildMascotasPerdidosNoticeCardModel } from "./shared/mascotasPerdidosCardModel";
import { detailPairsToMap } from "./shared/mascotasPerdidosListingDetailPairs";
import {
  fetchPublishedMascotasPerdidosListings,
  type MascotasPerdidosListingBrowseRow,
} from "./shared/loadMascotasPerdidosListings";
import { mascotasPerdidosCityMatches } from "./shared/mascotasPerdidosCityMatch";
import { buildMascotasPerdidosSearchBlob } from "./shared/mascotasPerdidosSearchText";

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
  const state = (sp?.get("state") ?? "").trim();
  const zip = (sp?.get("zip") ?? "").trim();
  const country = (sp?.get("country") ?? "").trim();
  const lastSeenArea = (sp?.get("lastSeenArea") ?? "").trim();
  const hasPhoto = (sp?.get("hasPhoto") ?? "").trim() === "1";

  const [rows, setRows] = useState<MascotasPerdidosListingBrowseRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const landingHref = appendLangToPath("/clasificados/mascotas-y-perdidos", lang);
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
      if (lastSeenArea && !textMatch(pairs["Leonix:lastSeenLocation"] ?? "", lastSeenArea)) return false;
      if (hasPhoto) {
        const imgs = row.images;
        const hasImg = Array.isArray(imgs) && imgs.length > 0;
        if (!hasImg) return false;
      }
      if (tipo !== "all") {
        const slug = (pairs["Leonix:noticeType"] ?? "").trim().toLowerCase();
        if (slug !== tipo) return false;
      }
      return true;
    });
  }, [rows, q, city, state, zip, country, tipo, lastSeenArea, hasPhoto, lang]);

  const refineEyebrow = lang === "es" ? "Afina tu búsqueda" : "Refine your search";
  const clearHref = appendLangToPath("/clasificados/mascotas-y-perdidos/results", lang);

  return (
    <MascotasPerdidosShellLayout lang={lang} backHref={landingHref} backLabel={backLabel}>
      <div className="space-y-5">
        <p className="text-sm text-[#5C5346]">{t.subtitle}</p>

        <section className={CAT_STD_RESULTS_REFINE_PANEL} aria-label={refineEyebrow}>
          <p className={CAT_STD_REFINE_EYEBROW}>{refineEyebrow}</p>
          <div className="mt-2">
            <MascotasResultsSearchPanel lang={lang} clearHref={clearHref} />
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
            <p className="text-sm font-semibold text-[#6B5A32]" data-testid="mascotas-perdidos-results-count">
              {t.count(filtered.length)}
            </p>
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-[#D6C7AD]/60 bg-[#FFFCF7]/95 px-4 py-5 text-sm leading-relaxed text-[#5C5346]">
                {t.emptyTitle}. {t.emptyBody}
              </p>
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
