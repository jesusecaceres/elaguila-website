import type { Metadata } from "next";

import { fetchPublicOfertaLocalDetailById, fetchPublicOfertaLocalItemsForOfferId, ofertaLocalPublicDetailPath } from "@/app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import {
  OfertasLocalesPublicDetailUnavailable,
  OfertasLocalesPublicDetailView,
} from "../OfertasLocalesPublicDetailView";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  if (!isSupabaseAdminConfigured()) {
    return { title: lang === "en" ? "Local deal" : "Oferta local" };
  }
  const offer = await fetchPublicOfertaLocalDetailById(getAdminSupabase(), id);
  if (!offer) {
    return {
      title: lang === "en" ? "Deal not available" : "Oferta no disponible",
      robots: { index: false, follow: false },
    };
  }
  const title = `${offer.title} · ${offer.businessName}`;
  const description = offer.description || `${offer.businessName} — ${offer.city}`;
  const canonicalPath = ofertaLocalPublicDetailPath(offer.id, lang);
  const canonical = `${LEONIX_SITE_ORIGIN}${canonicalPath}`;
  const heroImage = offer.primaryAssetHref || offer.businessLogoHref || undefined;
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: heroImage ? [{ url: heroImage, alt: offer.title || offer.businessName }] : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

export default async function OfertasLocalesPublicDetailPage(props: PageProps) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);

  if (!isSupabaseAdminConfigured()) {
    return <OfertasLocalesPublicDetailUnavailable lang={lang} />;
  }

  const offer = await fetchPublicOfertaLocalDetailById(getAdminSupabase(), id);
  if (!offer) {
    return <OfertasLocalesPublicDetailUnavailable lang={lang} />;
  }

  const items = await fetchPublicOfertaLocalItemsForOfferId(getAdminSupabase(), id, lang);

  return <OfertasLocalesPublicDetailView lang={lang} offer={offer} items={items} />;
}
