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
    fetchEnVentaPublicListingsForBrowse(),
  ]);
  return (
    <div className="pt-[calc(2.75rem+env(safe-area-inset-top,0px))] sm:pt-0">
      <EnVentaHubPageClient hub={hub} initialLiveListings={initialLiveListings} />
    </div>
  );
}
