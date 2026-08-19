import type { Metadata } from "next";
import { PublicPillarJsonLd } from "@/app/components/PublicPillarJsonLd";
import { ProductCatalog } from "./ProductCatalog";
import { normalizeLang } from "@/app/lib/language";
import { buildPublicPillarMetadata } from "@/app/lib/leonix/publicPillarSeo";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  return buildPublicPillarMetadata("productos-promocion", normalizeLang(sp.lang));
}

export default async function ProductosPromocionPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);

  return (
    <>
      <PublicPillarJsonLd id="productos-promocion" lang={routeLang} />
      <ProductCatalog routeLang={routeLang} />
    </>
  );
}
