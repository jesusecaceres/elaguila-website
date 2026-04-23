import type { Metadata } from "next";
import { LEONIX_MEDIA_SITE_NAME, leonixPageTitle } from "@/app/lib/leonixBrand";

export const metadata: Metadata = {
  /**
   * Intentionally omit a static `title` here: a string title in this segment prevented leaf
   * routes (e.g. Servicios `[slug]` `generateMetadata` `title.absolute`) from appearing in `<title>`.
   * Child routes under `/clasificados/*` should set their own titles; the hub is a client page
   * and inherits the root default browser title when none is set.
   */
  description:
    "Clasificados bilingües en Leonix Media: empleos, rentas, autos, servicios, bienes raíces y más — descubrimiento local bajo Leonix Global LLC.",
  keywords: [
    "Leonix Media",
    "clasificados",
    "anuncios",
    "rentas",
    "empleos",
    "autos",
    "servicios",
    "San José",
    "Northern California",
    "Bay Area",
  ],
  alternates: {
    canonical: "/clasificados",
  },
  twitter: {
    card: "summary_large_image",
    title: leonixPageTitle("Clasificados"),
    description:
      "Clasificados y anuncios locales en Leonix Media — visibilidad empresarial y comunidad en un solo lugar.",
  },
  openGraph: {
    title: leonixPageTitle("Clasificados"),
    description:
      "Explora anuncios locales y oportunidades en Leonix Media — plataforma bilingüe de descubrimiento y negocios.",
    url: "/clasificados",
    siteName: LEONIX_MEDIA_SITE_NAME,
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
