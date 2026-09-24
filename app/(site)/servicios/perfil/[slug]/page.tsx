import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getServiciosPublicListingBySlugForDiscovery } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { serviciosSocialCards, serviciosSocialImage } from "@/app/(site)/clasificados/servicios/lib/serviciosSocialMetadata";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

function langQuery(lang: "es" | "en"): string {
  return lang === "en" ? "?lang=en" : "?lang=es";
}

/**
 * Legacy URL — production vitrina is `/clasificados/servicios/[slug]`.
 * Redirect when a live listing exists; otherwise 404 (no demo/sample profile in production SEO).
 */
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (!row || row.listing_status === "rejected" || row.listing_status === "suspended") {
    return {
      ...PREVIEW_NOINDEX_METADATA,
      title: lang === "en" ? "Service not found · Leonix" : "Servicio no encontrado · Leonix",
    };
  }
  const name = row.profile_json?.identity?.businessName?.trim() || "Servicios";
  const about = row.profile_json?.about?.text?.trim();
  const canonicalPath = `/clasificados/servicios/${encodeURIComponent(slug)}`;
  return {
    title: `${name} · Servicios · Leonix`,
    description: about?.slice(0, 155),
    alternates: {
      canonical: `/clasificados/servicios/${encodeURIComponent(slug)}`,
    },
    ...serviciosSocialCards({
      title: `${name} · Servicios`,
      description: about?.slice(0, 155),
      canonicalPath,
      image: serviciosSocialImage(row.profile_json ?? {}),
    }),
  };
}

export default async function ServiciosPerfilLegacyRedirectPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";

  if (!slug || slug.length > 200) notFound();

  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (!row || row.listing_status === "rejected" || row.listing_status === "suspended") {
    notFound();
  }

  redirect(`/clasificados/servicios/${encodeURIComponent(slug)}${langQuery(lang)}`);
}
