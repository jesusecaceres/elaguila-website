"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

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
      setRows(data.filter((r) => r.id));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (err) {
    return (
      <section className="rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-4 text-sm text-red-950">
        <p className="font-semibold">{errorPrefix}</p>
        <p className="mt-1 opacity-90">{err}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className="rounded-2xl border border-[#C9B46A]/25 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/12 sm:px-5"
        aria-busy="true"
        data-testid="mascotas-perdidos-landing-recent"
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B5A32]/85">{title}</h2>
        <p className="mt-3 text-sm text-[#5C5346]">{lang === "es" ? "Cargando…" : "Loading…"}</p>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section
        className="rounded-2xl border border-dashed border-[#C9B46A]/45 bg-[#FFF9ED]/90 px-4 py-6 text-center sm:px-6"
        data-testid="mascotas-perdidos-landing-recent-empty"
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B5A32]/85">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C5346]/90">{emptyNote}</p>
      </section>
    );
  }

  const resultsHref = appendLangToPath("/clasificados/mascotas-y-perdidos/resultados", lang);

  return (
    <section
      className="rounded-2xl border border-[#C9B46A]/25 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/12 sm:px-5"
      data-testid="mascotas-perdidos-landing-recent"
    >
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B5A32]/85">{title}</h2>
      <ul className="mt-4 grid gap-4">
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
      <p className="mt-4 text-center sm:text-left">
        <Link
          href={resultsHref}
          className="text-sm font-semibold text-[#6B5A32] underline underline-offset-2 hover:text-[#3D3428]"
        >
          {lang === "es" ? "Ver todos los avisos" : "View all notices"}
        </Link>
      </p>
    </section>
  );
}
