"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LEONIX_LANDING_SECTION } from "@/app/(site)/clasificados/components/categoryStandardV2/constants";
import { CommunityDiscoveryListingCard } from "@/app/(site)/clasificados/community/CommunityDiscoveryListingCard";
import { buildCommunityDiscoveryCardModel } from "@/app/(site)/clasificados/community/shared/communityDiscoveryListingCardModel";
import { prepareComunidadDiscoveryRows } from "@/app/(site)/clasificados/community/shared/communityEventDiscoveryExpiration";
import {
  fetchPublishedCommunityCategoryListings,
  type CommunityListingBrowseRow,
} from "@/app/(site)/clasificados/community/shared/communityListingsBrowseClient";

type Props = {
  lang: Lang;
  title: string;
  emptyNote: string;
  errorPrefix: string;
  previewLimit?: number;
};

const SECTION_PAD = "px-4 py-4 sm:px-5 sm:py-5";

export function ComunidadLandingRecentListings({
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
    const { rows: data, error } = await fetchPublishedCommunityCategoryListings("comunidad", 120);
    if (error) {
      setErr(error);
      setRows([]);
    } else {
      setErr(null);
      const withIds = data.filter((r) => r.id);
      setRows(prepareComunidadDiscoveryRows(withIds, { limit: previewLimit }));
    }
    setLoading(false);
  }, [previewLimit]);

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
      <section className={LEONIX_LANDING_SECTION} aria-busy="true" data-testid="comunidad-landing-recent">
        <div className={SECTION_PAD}>
          <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
          <p className="mt-2 text-sm text-[#5C564E]">{lang === "es" ? "Cargando…" : "Loading…"}</p>
        </div>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className={LEONIX_LANDING_SECTION} data-testid="comunidad-landing-recent-empty">
        <div className={`${SECTION_PAD} text-center sm:text-left`}>
          <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#5C564E] sm:mx-0">{emptyNote}</p>
        </div>
      </section>
    );
  }

  const resultsHref = buildCategoryResultsUrl("comunidad", lang);

  return (
    <section className={LEONIX_LANDING_SECTION} data-testid="comunidad-landing-recent">
      <div className={SECTION_PAD}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{title}</h2>
            <p className="mt-0.5 text-xs text-[#5C564E]">
              {lang === "es" ? "Vista previa — afina en Resultados." : "Preview — refine on Results."}
            </p>
          </div>
          <Link
            href={resultsHref}
            className="shrink-0 text-sm font-semibold text-[#556B3E] underline underline-offset-2 hover:text-[#7A1E2C]"
          >
            {lang === "es" ? "Ver todos →" : "View all →"}
          </Link>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => {
            const href = appendLangToPath(`/clasificados/anuncio/${r.id}`, lang);
            const model = buildCommunityDiscoveryCardModel(r, "comunidad", lang, href);
            return (
              <li key={r.id} className="min-w-0">
                <CommunityDiscoveryListingCard model={model} lang={lang} variant="comunidad" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
