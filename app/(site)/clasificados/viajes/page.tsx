import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";

import type { ViajesBusinessResult } from "./data/viajesResultsSampleData";
import { ViajesLandingPage } from "./components/ViajesLandingPage";
import { fetchViajesPublicBrowseRowsMerged } from "./lib/viajesPublicBrowseRowsServer";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("viajes", normalizeLang(sp.lang));
}

export default async function ClasificadosViajesPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const { rows } = await fetchViajesPublicBrowseRowsMerged();
  const initialBusinessRows = rows.filter((r): r is ViajesBusinessResult => r.kind === "business");

  return (
    <>
      <PublicPillarJsonLd id="viajes" lang={lang} />
      <Suspense
        fallback={
          <div
            className="min-h-screen bg-gradient-to-b from-[#f0e6d8] via-[#f5ebe0] to-[#fffcf7]"
            aria-busy="true"
          />
        }
      >
        <ViajesLandingPage initialBusinessRows={initialBusinessRows} />
      </Suspense>
    </>
  );
}
