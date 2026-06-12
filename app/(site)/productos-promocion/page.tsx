import type { Metadata } from "next";
import { ProductCatalog } from "./ProductCatalog";
import { normalizeLang } from "@/app/lib/language";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);
  const copyLang = routeLang === "es" ? "es" : "en";
  return {
    title:
      copyLang === "en"
        ? "Promotional Products | Leonix Media"
        : "Productos para Promoción | Leonix Media",
    description:
      copyLang === "en"
        ? "Business cards, flyers, banners, promotional products and more. Request a quote from Leonix Media."
        : "Tarjetas de presentación, volantes, banners, productos promocionales y más. Solicita una cotización con Leonix Media.",
  };
}

export default async function ProductosPromocionPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const routeLang = normalizeLang(sp.lang);

  return <ProductCatalog routeLang={routeLang} />;
}
