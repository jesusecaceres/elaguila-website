import type { Metadata } from "next";

export function buildEnVentaHubMetadata(lang: "es" | "en"): Metadata {
  const title = lang === "es" ? "En Venta — Leonix Clasificados" : "For Sale — Leonix Classifieds";
  const description =
    lang === "es"
      ? "Compra y vende artículos locales: electrónica, hogar, muebles y más."
      : "Buy and sell local items: electronics, home, furniture, and more.";
  return {
    title,
    description,
    alternates: { canonical: "/clasificados/en-venta" },
  };
}
