import { getMergedEnVentaHubLanding } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { EnVentaHubPageClient } from "./EnVentaHubPageClient";

export const dynamic = "force-dynamic";

export default async function EnVentaHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const hub = await getMergedEnVentaHubLanding(lang);
  return <EnVentaHubPageClient hub={hub} />;
}
