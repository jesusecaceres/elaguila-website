import type { Metadata } from "next";
import { enVentaPublicLabel } from "../shared/constants/enVentaPublicLabels";

export function buildEnVentaHubMetadata(lang: "es" | "en"): Metadata {
  const title =
    lang === "es"
      ? `${enVentaPublicLabel("es")} — Leonix Clasificados`
      : `${enVentaPublicLabel("en")} — Leonix Classifieds`;
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
