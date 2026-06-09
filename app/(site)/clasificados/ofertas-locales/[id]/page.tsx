import type { Metadata } from "next";

import { fetchPublicOfertaLocalDetailById } from "@/app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import {
  OfertasLocalesPublicDetailUnavailable,
  OfertasLocalesPublicDetailView,
} from "../OfertasLocalesPublicDetailView";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";
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
  return {
    title: `${offer.title} · ${offer.businessName}`,
    description: offer.description || `${offer.businessName} — ${offer.city}`,
    robots: { index: true, follow: true },
  };
}

export default async function OfertasLocalesPublicDetailPage(props: PageProps) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";

  if (!isSupabaseAdminConfigured()) {
    return <OfertasLocalesPublicDetailUnavailable lang={lang} />;
  }

  const offer = await fetchPublicOfertaLocalDetailById(getAdminSupabase(), id);
  if (!offer) {
    return <OfertasLocalesPublicDetailUnavailable lang={lang} />;
  }

  return <OfertasLocalesPublicDetailView lang={lang} offer={offer} />;
}
