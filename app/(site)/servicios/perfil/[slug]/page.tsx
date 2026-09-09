import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getServiciosPublicListingBySlugForDiscovery } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

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
  // Globalization Build D-F6 — bare `?lang=` ternary didn't handle Next's `string[]` searchParams
  // shape; kept as a same-request pass-through redirect (no stored-preference lookup needed here).
  const lang = resolveClasificadosPublishLangFromSearchParams(sp).copyLang;
  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (!row || row.listing_status === "rejected" || row.listing_status === "suspended") {
    return {
      ...PREVIEW_NOINDEX_METADATA,
      title: lang === "en" ? "Service not found · Leonix" : "Servicio no encontrado · Leonix",
    };
  }
  const name = row.profile_json?.identity?.businessName?.trim() || "Servicios";
  const about = row.profile_json?.about?.text?.trim();
  return {
    title: `${name} · Servicios · Leonix`,
    description: about?.slice(0, 155),
    alternates: {
      canonical: `/clasificados/servicios/${encodeURIComponent(slug)}`,
    },
    openGraph: {
      title: `${name} · Servicios`,
      type: "website",
      url: `/clasificados/servicios/${encodeURIComponent(slug)}`,
    },
  };
}

export default async function ServiciosPerfilLegacyRedirectPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  // Globalization Build D-F6 — bare `?lang=` ternary didn't handle Next's `string[]` searchParams
  // shape; kept as a same-request pass-through redirect (no stored-preference lookup needed here).
  const lang = resolveClasificadosPublishLangFromSearchParams(sp).copyLang;

  if (!slug || slug.length > 200) notFound();

  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (!row || row.listing_status === "rejected" || row.listing_status === "suspended") {
    notFound();
  }

  redirect(`/clasificados/servicios/${encodeURIComponent(slug)}${langQuery(lang)}`);
}
