import type { Metadata } from "next";
import { ProductCatalog } from "./ProductCatalog";
import { normalizeLang } from "@/app/lib/language";
import { getProductosPromocionPageCopy } from "@/app/lib/leonix/productosPromocionPageCopy";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);
  const copy = getProductosPromocionPageCopy(routeLang);
  return {
    title: `${copy.heroTitle} | Leonix Media`,
    description: copy.heroSubtitle,
  };
}

export default async function ProductosPromocionPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);

  return <ProductCatalog routeLang={routeLang} />;
}
