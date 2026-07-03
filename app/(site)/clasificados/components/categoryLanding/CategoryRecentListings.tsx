"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CommunityDiscoveryListingCard } from "@/app/(site)/clasificados/community/CommunityDiscoveryListingCard";
import { buildCommunityDiscoveryCardModel } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { prepareComunidadDiscoveryRows } from "@/app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration";
import {
  fetchPublishedCommunityCategoryListings,
  type CommunityListingBrowseRow,
} from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";

type Props = {
  category: "clases" | "comunidad";
  lang: Lang;
  title: string;
  emptyNote: string;
  errorPrefix: string;
  /** Landing preview cap — full results page shows more. */
  previewLimit?: number;
};

export function CategoryRecentListings({
  category,
  lang,
  title,
  emptyNote,
  errorPrefix,
  previewLimit = 4,
}: Props) {
  const [rows, setRows] = useState<CommunityListingBrowseRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const fetchLimit = category === "comunidad" ? 120 : 8;
    const { rows: data, error } = await fetchPublishedCommunityCategoryListings(category, fetchLimit);
    if (error) {
      setErr(error);
      setRows([]);
    } else {
      setErr(null);
      const withIds = data.filter((r) => r.id);
      const visible =
        category === "comunidad"
          ? prepareComunidadDiscoveryRows(withIds, { limit: previewLimit })
          : withIds.slice(0, previewLimit);
      setRows(visible);
    }
    setLoading(false);
  }, [category, previewLimit]);

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
        className="rounded-2xl border border-[#C9B46A]/22 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/10 sm:px-5"
        aria-busy="true"
        data-testid="community-discovery-landing-recent"
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#3d5a73]/85">{title}</h2>
        <p className="mt-3 text-sm text-[#5C564E]">{lang === "es" ? "Cargando…" : "Loading…"}</p>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section
        className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4 text-sm text-[#111111]/75"
        data-testid="community-discovery-landing-recent"
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#3d5a73]/85">{title}</h2>
        <p className="mt-2">{emptyNote}</p>
      </section>
    );
  }

  const resultsHref = buildCategoryResultsUrl(category, lang);

  return (
    <section
      className="rounded-2xl border border-[#C9B46A]/22 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/10 sm:px-5"
      data-testid="community-discovery-landing-recent"
    >
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">{title}</h2>
      <p className="mt-1 text-xs text-[#5C564E]">
        {lang === "es" ? "Vista previa — afina en Resultados." : "Preview — refine on Results."}
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((r) => {
          const href = appendLangToPath(`/clasificados/anuncio/${r.id}`, lang);
          const model = buildCommunityDiscoveryCardModel(r, category, lang, href);
          return (
            <li key={r.id} className="min-w-0">
              <CommunityDiscoveryListingCard model={model} lang={lang} variant={category} />
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-center sm:text-left">
        <Link href={resultsHref} className="text-sm font-semibold text-[#A67C00] underline underline-offset-2 hover:text-[#8a6810]">
          {lang === "es" ? "Ver todos los anuncios" : "View all listings"}
        </Link>
      </p>
    </section>
  );
}
