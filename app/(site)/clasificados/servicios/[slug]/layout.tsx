import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { getServiciosPublicListingBySlugForDiscovery } from "../lib/serviciosPublicListingsServer";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";
import { LEONIX_LANG_COOKIE, normalizeLang } from "@/app/lib/language";

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
  // Package F Build F2, Gate 7 (P1 SEO fix) — this layout previously hardcoded `lang: "es"` for
  // tab/OG titles regardless of the viewer's actual language. Next.js `generateMetadata` for a
  // `layout.tsx` never receives `searchParams` (by design — layouts are shared across sibling
  // routes with different query strings), and this route's `generateMetadata` was moved here from
  // `page.tsx` for a documented production metadata-merging bug (see file header), so we cannot
  // read `?lang=` directly here. Falls back to the same `leonix_lang` cookie the public language
  // picker persists (`writePersistedLangPreference`) — correct for any returning/preference-set
  // visitor, though a first-ever visit via a bare `?lang=en` link with no cookie yet still renders
  // ES metadata (the page body itself still fully respects `?lang=` via its own searchParams).
  const cookieStore = await cookies();
  const lang: ServiciosLang = normalizeLang(cookieStore.get(LEONIX_LANG_COOKIE)?.value) === "en" ? "en" : "es";

  // Globalization Build 04, Gate 18 — this route never set a canonical URL at all (confirmed
  // absent on every branch below); only the legacy `/servicios/perfil/[slug]` redirect shim had
  // one. Real public detail pages must always declare their own canonical.
  const canonical = `/clasificados/servicios/${encodeURIComponent(slug)}`;

  try {
    const row = await getServiciosPublicListingBySlugForDiscovery(slug);
    if (!row) {
      return { title: { absolute: SERVICIOS_METADATA_FALLBACK_TITLE }, alternates: { canonical } };
    }

    // Package F Build F2, Gate 3 (P0 SEO/indexing fix) — these two states previously changed
    // the <title> but never set robots:noindex, so a pending/rejected/suspended Servicios
    // profile was indexable by default.
    if (row.listing_status === "pending_review") {
      return {
        ...PREVIEW_NOINDEX_METADATA,
        title: {
          absolute: "Anuncio en revisión · Servicios · Leonix",
        },
        alternates: { canonical },
      };
    }
    if (row.listing_status === "rejected" || row.listing_status === "suspended") {
      return {
        ...PREVIEW_NOINDEX_METADATA,
        title: {
          absolute: "Anuncio no disponible · Leonix",
        },
        alternates: { canonical },
      };
    }

    const wire = { ...row.profile_json };
    wire.identity.leonixVerified = row.leonix_verified === true;
    const profile = resolveServiciosProfile(wire, lang);
    return {
      title: { absolute: `${profile.identity.businessName} · Servicios · Leonix` },
      description: profile.about?.text?.slice(0, 155) ?? undefined,
      alternates: { canonical },
      openGraph: {
        title: `${profile.identity.businessName} · Servicios`,
        type: "website",
      },
      /** Plain head probe for HTTP smoke (independent of `<title>` streaming quirks). */
      other: { servicios_slug_probe: slug },
    };
  } catch {
    return { title: { absolute: SERVICIOS_METADATA_FALLBACK_TITLE }, alternates: { canonical } };
  }
}
