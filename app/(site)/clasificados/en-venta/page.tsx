import { getMergedEnVentaHubLanding } from "@/app/lib/clasificados/enVentaCategoryContentServer";
import { navCopyLang, normalizeLang } from "@/app/lib/language";
import { EnVentaHubPageClient } from "./EnVentaHubPageClient";

export const dynamic = "force-dynamic";

export default async function EnVentaHubPage(props: { searchParams?: Promise<{ lang?: string }> }) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);
  const copyLang = navCopyLang(routeLang);
  const hub = await getMergedEnVentaHubLanding(copyLang);
  return <EnVentaHubPageClient hub={hub} />;
}
