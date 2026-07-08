"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LEONIX_LANDING_SECTION } from "@/app/(site)/clasificados/components/categoryStandardV2/constants";

import { MascotasPerdidosNoticeCard } from "./MascotasPerdidosNoticeCard";
import { buildMascotasPerdidosNoticeCardModel } from "./shared/mascotasPerdidosCardModel";
import {
  fetchPublishedMascotasPerdidosListings,
  type MascotasPerdidosListingBrowseRow,
} from "./shared/loadMascotasPerdidosListings";

type Props = {
  lang: Lang;
  title: string;
  emptyNote: string;
  errorPrefix: string;
};

const LANDING_PREVIEW_LIMIT = 4;
const SECTION_PAD = "px-4 py-4 sm:px-5 sm:py-5";

export function MascotasPerdidosLandingRecentListings({ lang, title, emptyNote, errorPrefix }: Props) {
  const [rows, setRows] = useState<MascotasPerdidosListingBrowseRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { rows: data, error } = await fetchPublishedMascotasPerdidosListings(6);
    if (error) {
      setErr(error);
      setRows([]);
    } else {
      setErr(null);
      setRows(data.filter((r) => r.id).slice(0, LANDING_PREVIEW_LIMIT));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <section className="rounded-xl border border-red-200/70 bg-red-50/90 px-4 py-3.5 text-sm text-red-950">
        <p className="font-semibold">{errorPrefix}</p>
        <p className="mt-1 opacity-90">{err}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={LEONIX_LANDING_SECTION} aria-busy="true" data-testid="mascotas-perdidos-landing-recent">
        <div className={SECTION_PAD}>
          <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
          <p className="mt-2 text-sm text-[#5C5346]">{lang === "es" ? "Cargando…" : "Loading…"}</p>
        </div>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className={LEONIX_LANDING_SECTION} data-testid="mascotas-perdidos-landing-recent-empty">
        <div className={`${SECTION_PAD} text-center sm:text-left`}>
          <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#5C5346] sm:mx-0">{emptyNote}</p>
        </div>
      </section>
    );
  }

  const resultsHref = appendLangToPath("/clasificados/mascotas-y-perdidos/resultados", lang);

  return (
    <section className={LEONIX_LANDING_SECTION} data-testid="mascotas-perdidos-landing-recent">
      <div className={SECTION_PAD}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
          <Link
            href={resultsHref}
            className="shrink-0 text-sm font-semibold text-[#6B5A32] underline underline-offset-2 hover:text-[#3D3428]"
          >
            {lang === "es" ? "Ver todos los avisos →" : "View all notices →"}
          </Link>
        </div>
        <ul className="mt-3 grid gap-3">
          {rows.map((r) => {
            const href = appendLangToPath(`/clasificados/anuncio/${r.id}`, lang);
            const model = buildMascotasPerdidosNoticeCardModel(r, lang, href);
            return (
              <li key={r.id} className="min-w-0">
                <MascotasPerdidosNoticeCard model={model} lang={lang} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
