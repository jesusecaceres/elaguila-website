import type { Metadata } from "next";
import { SAMPLE_LISTINGS } from "@/app/data/classifieds/sampleListings";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { getServiciosPublicListingBySlugFromDb } from "../lib/serviciosPublicListingsServer";
import { LegacyServiciosSampleProfile } from "./LegacyServiciosSampleProfile";
import { ServiciosPublicSlugClient } from "./ServiciosPublicSlugClient";

function findLegacyServiciosListing(id: string): { id: string; category: string; title?: { es?: string; en?: string } } | null {
  const items = SAMPLE_LISTINGS as readonly { id: string; category: string; title?: { es?: string; en?: string } }[];
  return items.find((x) => x.id === id && x.category === "servicios") ?? null;
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";

  const legacy = findLegacyServiciosListing(id);
  if (legacy) {
    const title = legacy.title?.[lang] ?? legacy.title?.es ?? "Servicio";
    return { title: `${title} · Servicios · Leonix` };
  }

  const row = await getServiciosPublicListingBySlugFromDb(id);
  if (row) {
    const wire = { ...row.profile_json };
    wire.identity.leonixVerified = row.leonix_verified === true;
    const profile = resolveServiciosProfile(wire, lang);
    return {
      title: `${profile.identity.businessName} · Servicios · Leonix`,
      description: profile.about?.text?.slice(0, 155) ?? undefined,
      openGraph: {
        title: `${profile.identity.businessName} · Servicios`,
        type: "website",
      },
    };
  }

  return { title: lang === "en" ? "Servicios · Leonix" : "Servicios · Leonix" };
}

/**
 * Resolves: legacy sample listings → published Servicios shell (Supabase) → local-only publish fallback.
 * Public URL shape: `/clasificados/servicios/[slug-or-id]?lang=es|en`
 */
export default async function ClasificadosServiciosDynamicPage(props: PageProps) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";

  if (findLegacyServiciosListing(id)) {
    return <LegacyServiciosSampleProfile listingId={id} />;
  }

  const row = await getServiciosPublicListingBySlugFromDb(id);
  if (row) {
    const wire = { ...row.profile_json };
    wire.identity.leonixVerified = row.leonix_verified === true;
    const profile = resolveServiciosProfile(wire, lang);
    return (
      <ServiciosProfileView
        profile={profile}
        lang={lang}
        editBackHref={`/clasificados/publicar/servicios?lang=${lang}`}
      />
    );
  }

  return <ServiciosPublicSlugClient slug={id} lang={lang} />;
}
