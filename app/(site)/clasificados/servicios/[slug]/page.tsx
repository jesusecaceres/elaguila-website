import type { Metadata } from "next";
import { SAMPLE_LISTINGS } from "@/app/data/classifieds/sampleListings";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { getServiciosPublicListingBySlugForDiscovery } from "../lib/serviciosPublicListingsServer";
import { LegacyServiciosSampleProfile } from "./LegacyServiciosSampleProfile";
import { ServiciosPublicSlugClient } from "./ServiciosPublicSlugClient";

function findLegacyServiciosListing(id: string): { id: string; category: string; title?: { es?: string; en?: string } } | null {
  const items = SAMPLE_LISTINGS as readonly { id: string; category: string; title?: { es?: string; en?: string } }[];
  return items.find((x) => x.id === id && x.category === "servicios") ?? null;
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string; justPublished?: string; persistence?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";

  const legacy = findLegacyServiciosListing(slug);
  if (legacy) {
    const title = legacy.title?.[lang] ?? legacy.title?.es ?? "Servicio";
    return { title: `${title} · Servicios · Leonix` };
  }

  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
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
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";

  if (findLegacyServiciosListing(slug)) {
    return <LegacyServiciosSampleProfile listingId={slug} />;
  }

  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (row) {
    const wire = { ...row.profile_json };
    wire.identity.leonixVerified = row.leonix_verified === true;
    const profile = resolveServiciosProfile(wire, lang);
    const paused = row.listing_status === "paused_unpublished";
    const justPublished = sp.justPublished === "1";
    const persistence = typeof sp.persistence === "string" ? sp.persistence : "";
    const publishLines: string[] = [];
    if (justPublished) {
      if (persistence === "database") {
        publishLines.push(
          lang === "en"
            ? "Listing saved to Leonix. It should appear in Servicios results and search."
            : "Listado guardado en Leonix. Debería aparecer en resultados y búsqueda de Servicios.",
        );
      } else if (persistence === "dev_workspace") {
        publishLines.push(
          lang === "en"
            ? "Test mode: saved to the local dev file (.servicios-dev-publishes.json). Visible in results while `next dev` runs on this machine."
            : "Modo prueba: guardado en archivo local de desarrollo (.servicios-dev-publishes.json). Visible en resultados mientras corre `next dev` en esta máquina.",
        );
      } else if (persistence === "none") {
        publishLines.push(
          lang === "en"
            ? "Saved in this browser only (no database or dev file). Open this profile from the same browser; configure Supabase or run `next dev` with dev publish for shared discovery."
            : "Guardado solo en este navegador (sin base ni archivo dev). Abre este perfil desde el mismo navegador; configura Supabase o usa `next dev` con publicación dev para descubrimiento compartido.",
        );
      } else {
        publishLines.push(lang === "en" ? "Your listing was published." : "Tu listado se publicó.");
      }
    }
    const pausedMsg =
      paused
        ? lang === "en"
          ? "This listing is paused and may not appear in public search results."
          : "Este anuncio está en pausa y puede no aparecer en los resultados públicos."
        : "";
    const noticeBanner = [pausedMsg, publishLines.join(" ")].filter(Boolean).join("\n\n") || undefined;

    return (
      <ServiciosProfileView
        profile={profile}
        lang={lang}
        editBackHref={`/clasificados/publicar/servicios?lang=${lang}`}
        noticeBanner={noticeBanner}
      />
    );
  }

  return <ServiciosPublicSlugClient slug={slug} lang={lang} />;
}
