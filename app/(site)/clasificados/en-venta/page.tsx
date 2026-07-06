import { Suspense } from "react";
import { EN_VENTA_LANDING_PREVIEW_LIMIT } from "@/app/(site)/clasificados/en-venta/lib/enVentaListingPublicSelect";
import { fetchEnVentaPublicListingsForBrowse } from "@/app/lib/clasificados/en-venta/fetchEnVentaPublicListingsForBrowse";
import { getMergedEnVentaHubLanding } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import type { EnVentaHubLandingResolved } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { EnVentaHubPageClient } from "./EnVentaHubPageClient";

export const dynamic = "force-dynamic";

async function EnVentaHubListingsLoader({ hub }: { hub: EnVentaHubLandingResolved }) {
  const initialLiveListings = await fetchEnVentaPublicListingsForBrowse({
    limit: EN_VENTA_LANDING_PREVIEW_LIMIT,
  });
  return <EnVentaHubPageClient hub={hub} initialLiveListings={initialLiveListings} />;
}

export default async function EnVentaHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);
  const copyLang = navCopyLang(routeLang);
  const hub = await getMergedEnVentaHubLanding(copyLang);
  return (
    <Suspense fallback={<EnVentaHubPageClient hub={hub} initialLiveListings={[]} />}>
      <EnVentaHubListingsLoader hub={hub} />
    </Suspense>
  );
}
