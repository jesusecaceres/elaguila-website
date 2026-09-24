import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { ViajesLangSwitch } from "../../components/ViajesLangSwitch";
import { ViajesOfferDetailLayout } from "../../components/ViajesOfferDetailLayout";
import { getViajesOfferDetailBySlug, VIAJES_OFFER_SLUGS } from "../../data/viajesOfferDetailSampleData";
import { getViajesUi } from "../../data/viajesUiCopy";
import { resolveViajesOfferBack } from "../../lib/viajesOfferLink";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { resolveViajesStagedOfferDetailBundle } from "../../lib/resolveViajesOfferDetailFromStagedServer";
import { viajesAllowCuratedDemoCatalog } from "../../lib/viajesPublicInventory";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickLang(sp: Record<string, string | string[] | undefined>): Lang {
  const v = sp.lang;
  const raw = Array.isArray(v) ? v[0] : v;
  return raw === "en" ? "en" : "es";
}

export function generateStaticParams() {
  if (!viajesAllowCuratedDemoCatalog()) return [];
  return VIAJES_OFFER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = pickLang(sp);
  const bundle = await resolveViajesStagedOfferDetailBundle(slug, lang);
  const offer = bundle?.offer ?? (viajesAllowCuratedDemoCatalog() ? getViajesOfferDetailBySlug(slug) : null);
  if (!offer) return { title: "Oferta | Leonix Viajes" };
  const title = `${offer.title} | Leonix Viajes`;
  const description = offer.description.slice(0, 155);
  const canonical = `${LEONIX_SITE_ORIGIN}/clasificados/viajes/oferta/${encodeURIComponent(offer.slug)}?lang=${lang}`;
  const heroImage = offer.heroImageSrc?.trim() || undefined;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: heroImage ? [{ url: heroImage, alt: offer.heroImageAlt || offer.title }] : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

export default async function ClasificadosViajesOfertaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = pickLang(sp);
  const bundle = await resolveViajesStagedOfferDetailBundle(slug, lang);
  const offer = bundle?.offer ?? (viajesAllowCuratedDemoCatalog() ? getViajesOfferDetailBySlug(slug) : null);
  if (!offer) notFound();
  const stagedListingId = bundle?.stagedListingId ?? null;
  const listingLang = bundle?.listingLang ?? null;
  const listingKey = (bundle?.leonix_ad_id ?? "").trim() || offer.slug;
  const ui = getViajesUi(lang);
  const fallback = appendLangToPath("/clasificados/viajes", lang);
  const { href: backHref, label: backLabel } = resolveViajesOfferBack(sp.back, fallback, lang);
  const exploreViajesHref = appendLangToPath("/clasificados/viajes", lang);

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-bg)] px-4 py-2 sm:px-5">
        <div className="mx-auto flex max-w-7xl justify-end">
          <ViajesLangSwitch compact />
        </div>
      </div>
      <ViajesOfferDetailLayout
        offer={offer}
        lang={lang}
        listingLang={listingLang}
        listingKey={listingKey}
        backHref={backHref}
        backLabel={backLabel}
        ui={ui}
        exploreViajesHref={exploreViajesHref}
        stagedListingId={stagedListingId}
        leonixAdId={bundle?.leonix_ad_id ?? null}
      />
    </div>
  );
}
