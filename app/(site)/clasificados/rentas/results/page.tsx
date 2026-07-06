import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchRentasPublicListingsForBrowse } from "@/app/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse";
import { rentasPublicIncludeDemoPool } from "@/app/clasificados/rentas/lib/rentasPublicInventoryMode";
import { RentasResultsShell } from "./components/RentasResultsShell";
import { RentasResultsClient } from "./RentasResultsClient";

export const metadata: Metadata = {
  title: "Rentas — Resultados | Leonix Clasificados",
  description: "Listados de rentas (cuadrícula en construcción; separado de vista previa de publicación).",
};

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ lang?: string }> };

function RentasResultsLoadingShell() {
  return (
    <RentasResultsShell>
      <div
        className="min-h-[40vh] animate-pulse rounded-xl bg-[#FAF7F2]/80"
        aria-busy="true"
        aria-label="Cargando resultados de rentas"
      />
    </RentasResultsShell>
  );
}

async function RentasResultsWithData({ lang }: { lang: "es" | "en" }) {
  const initialLiveListings = await fetchRentasPublicListingsForBrowse(lang);
  return (
    <RentasResultsClient initialLiveListings={initialLiveListings} includeDemoPool={rentasPublicIncludeDemoPool()} />
  );
}

export default async function RentasResultsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  return (
    <Suspense fallback={<RentasResultsLoadingShell />}>
      <RentasResultsWithData lang={lang} />
    </Suspense>
  );
}
