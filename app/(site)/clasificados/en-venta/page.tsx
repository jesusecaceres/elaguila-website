import { fetchEnVentaPublicListingsForBrowse } from "@/app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse";
import { getMergedEnVentaHubLanding } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { EnVentaHubPageClient } from "./EnVentaHubPageClient";

export const dynamic = "force-dynamic";

export default async function EnVentaHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const [hub, initialLiveListings] = await Promise.all([
    getMergedEnVentaHubLanding(lang),
    fetchEnVentaPublicListingsForBrowse(),
  ]);
  return <EnVentaHubPageClient hub={hub} initialLiveListings={initialLiveListings} />;
}
