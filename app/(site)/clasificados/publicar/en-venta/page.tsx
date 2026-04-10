import { getMergedEnVentaPublishHub } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { EnVentaPublishHubClient } from "./EnVentaPublishHubClient";

export const dynamic = "force-dynamic";

export default async function EnVentaPublishHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const hub = await getMergedEnVentaPublishHub(lang);
  return <EnVentaPublishHubClient hub={hub} />;
}
