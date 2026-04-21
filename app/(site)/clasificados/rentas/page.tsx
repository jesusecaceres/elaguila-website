import type { Metadata } from "next";
import { fetchRentasPublicListingsForBrowse } from "@/app/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse";
import { rentasPublicIncludeDemoPool } from "@/app/clasificados/rentas/lib/rentasPublicInventoryMode";
import { RentasLandingHub } from "./RentasLandingHub";

export const metadata: Metadata = {
  title: "Rentas | Leonix Clasificados",
  description: "Explora rentas, publica como particular o negocio, y entra a resultados en ruta dedicada.",
};

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<{ lang?: string }> };

export default async function RentasCategoryPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  const initialLiveListings = await fetchRentasPublicListingsForBrowse(lang);
  return (
    <RentasLandingHub initialLiveListings={initialLiveListings} includeDemoPool={rentasPublicIncludeDemoPool()} />
  );
}
