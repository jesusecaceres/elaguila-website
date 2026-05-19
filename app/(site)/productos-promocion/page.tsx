import type { Metadata } from "next";
import { ProductCatalog } from "./ProductCatalog";

export const dynamic = "force-dynamic";

type Lang = "es" | "en";

function normalizeLang(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  return {
    title:
      lang === "en"
        ? "Promotional Products | Leonix Media"
        : "Productos para Promoción | Leonix Media",
    description:
      lang === "en"
        ? "Business cards, flyers, banners, promotional products and more. Request a quote from Leonix Media."
        : "Tarjetas de presentación, volantes, banners, productos promocionales y más. Solicita una cotización con Leonix Media.",
  };
}

export default async function ProductosPromocionPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);

  return <ProductCatalog lang={lang} />;
}
