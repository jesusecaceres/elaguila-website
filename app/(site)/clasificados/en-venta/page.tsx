import { EN_VENTA_LANDING_PREVIEW_LIMIT } from "@/app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect";
import { fetchEnVentaPublicListingsForBrowse } from "@/app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse";
import { getMergedEnVentaHubLanding } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { EnVentaHubPageClient } from "./EnVentaHubPageClient";

export const dynamic = "force-dynamic";

export default async function EnVentaHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);
  const copyLang = navCopyLang(routeLang);
  const [hub, initialLiveListings] = await Promise.all([
    getMergedEnVentaHubLanding(copyLang),
    fetchEnVentaPublicListingsForBrowse({ limit: EN_VENTA_LANDING_PREVIEW_LIMIT }),
  ]);
  return <EnVentaHubPageClient hub={hub} initialLiveListings={initialLiveListings} />;
}
