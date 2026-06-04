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
        : "Productos Promocionales | Leonix Media",
    description:
      lang === "en"
        ? "Custom apparel, calendars, event materials, and branded promotional products for local businesses. Request information from Leonix Media."
        : "Ropa personalizada, calendarios, material para eventos y productos con tu marca para negocios locales. Solicita información con Leonix Media.",
  };
}

export default async function ProductosPromocionPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);

  return <ProductCatalog lang={lang} />;
}
