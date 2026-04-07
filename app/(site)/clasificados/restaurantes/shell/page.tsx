import type { Metadata } from "next";
import { DEMO_RESTAURANT_DETAIL_SHELL } from "./demoRestaurantDetailShell";
import { RestauranteDetailShell } from "./RestauranteDetailShell";
import { RestaurantesShellChrome } from "./RestaurantesShellChrome";

export const metadata: Metadata = {
  title: "Restaurantes — Vista previa del anuncio (shell)",
  description:
    "Shell de escritorio para detalle de restaurante en Leonix Clasificados: vitrina premium y centro de acción.",
  alternates: {
    canonical: "/clasificados/restaurantes/shell",
  },
  openGraph: {
    title: "Restaurantes — Vista previa del anuncio — LEONIX",
    description:
      "Shell de escritorio para detalle de restaurante en Leonix Clasificados: vitrina premium y centro de acción.",
    url: "/clasificados/restaurantes/shell",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function RestaurantesDetailShellPage() {
  return (
    <RestaurantesShellChrome lang="es">
      <RestauranteDetailShell data={DEMO_RESTAURANT_DETAIL_SHELL} />
    </RestaurantesShellChrome>
  );
}
