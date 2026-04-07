import { notFound } from "next/navigation";
import type { TiendaOrderSource } from "../../../types/orderHandoff";
import type { Lang } from "../../../types/tienda";
import { getRegisteredOrderHandoffRoutes, isRegisteredOrderHandoff } from "../../orderHandoffRegistry";
import { normalizeLang } from "../../../utils/tiendaRouting";
import { TiendaOrderPageClient } from "../../../components/order/TiendaOrderPageClient";

export function generateStaticParams() {
  return getRegisteredOrderHandoffRoutes().map(({ source, slug }) => ({ source, slug }));
}

export default async function TiendaOrderPage(props: {
  params: Promise<{ source: string; slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { source, slug } = await props.params;
  if (!isRegisteredOrderHandoff(source, slug)) notFound();

  const sp = (await props.searchParams) ?? {};
  const lang: Lang = normalizeLang(sp.lang);

  return (
    <TiendaOrderPageClient key={`${source}-${slug}-${lang}`} source={source as TiendaOrderSource} slug={slug} lang={lang} />
  );
}
