import type { Metadata } from "next";
import { LEONIX_MEDIA_SITE_NAME, leonixPageTitle } from "@/app/lib/leonixBrand";

export const metadata: Metadata = {
  title: "Clasificados",
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
