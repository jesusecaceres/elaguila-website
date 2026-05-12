import type { Metadata } from "next";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { getServiciosPublicListingBySlugForDiscovery } from "../lib/serviciosPublicListingsServer";

export const dynamic = "force-dynamic";

const SERVICIOS_METADATA_FALLBACK_TITLE = "Servicios · Leonix Clasificados";

/**
 * Segment layout: `generateMetadata` here receives `[slug]` params reliably for `<title>` / OG.
 * (Page-level metadata for this route was not merging into the document head in production smoke.)
 *
 * **Never call `notFound()` here:** a transient/secondary read failure during metadata generation
 * would incorrectly 404 the entire segment even when `[slug]/page.tsx` can resolve the listing.
 */
export default function ServiciosSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  /** Tab/OG titles default to ES; the page still respects `?lang=` for rendered copy. */
  const lang: ServiciosLang = "es";

  try {
    const row = await getServiciosPublicListingBySlugForDiscovery(slug);
    if (!row) {
      return { title: { absolute: SERVICIOS_METADATA_FALLBACK_TITLE } };
    }

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
  } catch {
    return { title: { absolute: SERVICIOS_METADATA_FALLBACK_TITLE } };
  }
}
