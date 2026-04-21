import type { Metadata } from "next";
import { fetchRentasPublicListingsForBrowse } from "@/app/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse";
import { rentasPublicIncludeDemoPool } from "@/app/clasificados/rentas/lib/rentasPublicInventoryMode";
import { RentasResultsClient } from "./RentasResultsClient";

export const metadata: Metadata = {
  title: "Rentas — Resultados | Leonix Clasificados",
  description: "Listados de rentas (cuadrícula en construcción; separado de vista previa de publicación).",
};

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ lang?: string }> };

export default async function RentasResultsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  const initialLiveListings = await fetchRentasPublicListingsForBrowse(lang);
  return (
    <RentasResultsClient initialLiveListings={initialLiveListings} includeDemoPool={rentasPublicIncludeDemoPool()} />
  );
}
