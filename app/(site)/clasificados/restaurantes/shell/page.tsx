import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEMO_RESTAURANT_DETAIL_SHELL } from "./demoRestaurantDetailShell";
import { RestauranteAdStoryPreview } from "./RestauranteAdStoryPreview";
import { RestaurantesShellChrome } from "./RestaurantesShellChrome";

export const metadata: Metadata = {
  title: "Restaurantes — Vista previa del anuncio (shell)",
  description:
    "Shell de escritorio para detalle de restaurante en Leonix Clasificados: vitrina premium y centro de acción.",
  robots: { index: false, follow: false },
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

/** Design shell only — not public production inventory. */
export default function RestaurantesDetailShellPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/clasificados/restaurantes");
  }

  return (
    <RestaurantesShellChrome lang="es">
      <div className="mx-auto max-w-[1280px] px-4 pb-2 pt-3 md:px-5">
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-950 dark:text-amber-100">
          Vista de demostración del shell de diseño (datos fijos). No es un listado publicado; las fichas reales viven en{" "}
          <code className="rounded bg-black/10 px-1">/clasificados/restaurantes/[slug]</code>.
        </p>
      </div>
      <RestauranteAdStoryPreview
        data={DEMO_RESTAURANT_DETAIL_SHELL}
        listingId="demo-shell"
        lang="es"
        persistListingEngagement={false}
      />
    </RestaurantesShellChrome>
  );
}
