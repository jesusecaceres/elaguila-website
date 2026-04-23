import type { Metadata } from "next";
import { listServiciosPublicListingsForDiscovery } from "./lib/serviciosPublicListingsServer";
import { ServiciosLandingPage } from "./landing/ServiciosLandingPage";

/** Marketplace landing must always reflect current `servicios_public_listings` (+ optional dev file). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Servicios · Leonix Clasificados",
  description:
    "Encuentra servicios locales cerca de ti — profesionales de confianza, vitrinas claras y contacto directo en Leonix.",
  alternates: {
    canonical: "/clasificados/servicios",
  },
  openGraph: {
    title: "Servicios · Leonix Clasificados",
    description:
      "Encuentra servicios locales cerca de ti — profesionales de confianza en el Área de la Bahía.",
    url: "/clasificados/servicios",
    siteName: "LEONIX",
    type: "website",
  },
};

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export default async function ClasificadosServiciosLandingPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  /** Larger window so landing “Recientes” (newest-by-time strip) stays representative vs busy directories. */
  const liveRows = await listServiciosPublicListingsForDiscovery(200);
  return <ServiciosLandingPage lang={lang} liveRows={liveRows} />;
}
