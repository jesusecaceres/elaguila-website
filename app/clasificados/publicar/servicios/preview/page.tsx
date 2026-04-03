import type { Metadata } from "next";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { getServiciosWireProfileFromSample } from "@/app/servicios/data/demoServiciosBusinessProfile";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Clasificados-facing **output preview** for Servicios (premium business showcase).
 * Uses the same shell as `/servicios/perfil/[slug]`: draft sample → wire profile → `resolveServiciosProfile` → `ServiciosProfileView`.
 * Application form wiring comes in a later phase.
 */

type PageProps = {
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";
  const wire = getServiciosWireProfileFromSample("expert", lang);
  const profile = resolveServiciosProfile(wire);
  const title = `${profile.identity.businessName} · Vista previa · Leonix Servicios`;
  return {
    title,
    description:
      profile.about?.text?.slice(0, 155) ??
      "Vista previa del perfil de negocio en Leonix Servicios (Clasificados).",
    alternates: {
      canonical: "/clasificados/publicar/servicios/preview",
    },
    openGraph: {
      title,
      type: "website",
      url: "/clasificados/publicar/servicios/preview",
    },
  };
}

export default async function ClasificadosServiciosPreviewPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";
  const wire = getServiciosWireProfileFromSample("expert", lang);
  const profile = resolveServiciosProfile(wire);

  return <ServiciosProfileView profile={profile} lang={lang} />;
}
