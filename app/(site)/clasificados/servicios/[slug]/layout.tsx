import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { getServiciosPublicListingBySlugForDiscovery } from "../lib/serviciosPublicListingsServer";

export const dynamic = "force-dynamic";

/**
 * Segment layout: `generateMetadata` here receives `[slug]` params reliably for `<title>` / OG.
 * (Page-level metadata for this route was not merging into the document head in production smoke.)
 */
export default function ServiciosSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  /** Tab/OG titles default to ES; the page still respects `?lang=` for rendered copy. */
  const lang: ServiciosLang = "es";

  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (!row) notFound();

  if (row.listing_status === "pending_review") {
    return {
      title: {
        absolute: "Anuncio en revisión · Servicios · Leonix",
      },
    };
  }
  if (row.listing_status === "rejected" || row.listing_status === "suspended") {
    return {
      title: {
        absolute: "Anuncio no disponible · Leonix",
      },
    };
  }

  const wire = { ...row.profile_json };
  wire.identity.leonixVerified = row.leonix_verified === true;
  const profile = resolveServiciosProfile(wire, lang);
  return {
    title: { absolute: `${profile.identity.businessName} · Servicios · Leonix` },
    description: profile.about?.text?.slice(0, 155) ?? undefined,
    openGraph: {
      title: `${profile.identity.businessName} · Servicios`,
      type: "website",
    },
    /** Plain head probe for HTTP smoke (independent of `<title>` streaming quirks). */
    other: { servicios_slug_probe: slug },
  };
}
