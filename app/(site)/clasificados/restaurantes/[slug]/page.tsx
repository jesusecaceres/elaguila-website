import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mapRestauranteDraftToShellData } from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { listingJsonToDraft } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import { getRestaurantePublicListingBySlugFromDb } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { ClasificadosPreviewAdCanvas } from "@/app/clasificados/lib/preview/ClasificadosPreviewAdCanvas";
import { RestauranteAdStoryPreview } from "@/app/clasificados/restaurantes/shell/RestauranteAdStoryPreview";
import { RestauranteProfileViewAnalytics } from "@/app/clasificados/restaurantes/components/RestauranteProfileViewAnalytics";
import { fetchRestauranteLinkedOffersForPublicPage } from "@/app/lib/clasificados/restaurantes/restaurantesLinkedOffersQuery";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { RestaurantesShellChrome } from "@/app/clasificados/restaurantes/shell/RestaurantesShellChrome";
import { restauranteCouponsCapabilityActive } from "@/app/clasificados/restaurantes/lib/restauranteCouponCapabilityServer";
import { listRelatedRestaurantesListings } from "@/app/clasificados/restaurantes/lib/restaurantesRelatedListings";
import { RestaurantesRelatedListingsSection } from "@/app/clasificados/restaurantes/components/RestaurantesRelatedListingsSection";
import { restauranteJsonLd } from "../seo/restauranteJsonLd";
import { breadcrumbJsonLd } from "@/app/lib/seo/breadcrumbJsonLd";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

type Lang = "es" | "en";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const row = await getRestaurantePublicListingBySlugFromDb(slug);
  if (!row) {
    return { title: lang === "en" ? "Restaurant · Leonix Classifieds" : "Restaurante · Leonix Clasificados" };
  }
  const name = row.business_name.trim() || (lang === "en" ? "Restaurant" : "Restaurante");
  const summary = row.summary_short?.trim();
  const canonical = `/clasificados/restaurantes/${encodeURIComponent(slug)}`;
  // Package F Build F2, Gate 17 (P1 SEO fix) — category label was previously hardcoded Spanish
  // regardless of `?lang=`; business_name/summary are user-authored content, never translated.
  const categoryLabel = lang === "en" ? "Restaurants" : "Restaurantes";
  return {
    title: `${name} · ${categoryLabel} · Leonix`,
    description: summary?.slice(0, 155),
    // Package F Build F2, Gate 7 (P1 SEO fix) — this page previously set no `alternates`, so it
    // inherited the wrong parent canonical instead of its own slug-scoped one.
    alternates: { canonical },
    openGraph: {
      title: `${name} · ${categoryLabel}`,
      type: "website",
      url: canonical,
    },
  };
}

/**
 * Public open-card detail: `/clasificados/restaurantes/[slug]`
 * Backed by `restaurantes_public_listings.listing_json` → same draft→shell mapping as preview.
 */
export default async function RestaurantePublicDetailPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const lang: Lang = sp.lang === "en" ? "en" : "es";
  const row = await getRestaurantePublicListingBySlugFromDb(slug);
  if (!row) notFound();

  const draft = listingJsonToDraft(row.listing_json);
  const shellData = mapRestauranteDraftToShellData(draft, { lang });

  const [linkedOffers, couponsIncluded, related] = await Promise.all([
    isSupabaseAdminConfigured()
      ? fetchRestauranteLinkedOffersForPublicPage(getAdminSupabase(), row.id, lang)
      : Promise.resolve([]),
    restauranteCouponsCapabilityActive(row.id),
    // Gate RESTAURANTES-2 — related published listings, from the same canonical published reader
    // the results page uses. This route only ever renders a `status = "published"` row (the reader
    // above 404s otherwise), so no extra visibility guard is needed here.
    listRelatedRestaurantesListings(row),
  ]);

  // Gate E.2.2 (preserved) — public coupon module visibility is live commercial truth only, never
  // the legacy `listing_json.couponUpgradeEnabled` flag baked into `shellData` by the (unmodified,
  // pure) mapper.
  //
  // Gate RESTAURANTES-1 — that truth is now the INCLUDED `coupons_offers` capability of the $399
  // base package, resolved through the canonical plan resolver, instead of a live entitlement row
  // for the RETIRED `restaurantes_offers_addon` key. Nothing grants that retired key from a base
  // payment, so every new $399 restaurant had its coupons permanently hidden here. Historical $79
  // add-on holders still resolve, via the policy's own legacy-add-on branch. Fails closed on any
  // lookup problem, exactly as the previous reader did. Stored coupon content is never touched —
  // only what gets rendered.
  const shellForPublic = {
    ...shellData,
    id: row.id,
    coupons: couponsIncluded ? shellData.coupons : undefined,
    couponFlyer: couponsIncluded ? shellData.couponFlyer : undefined,
    couponMoreOffers: couponsIncluded ? shellData.couponMoreOffers : undefined,
  };

  const jsonLd = restauranteJsonLd({
    name: shellData.businessName,
    description: row.summary_short?.trim() || undefined,
    // Gate RESTAURANTES-1 — absolute canonical. schema.org `url` is resolved by consumers without
    // page context, so the previous relative path was an unusable entity URL. This is the same
    // value `generateMetadata` above declares as `alternates.canonical`, built from the existing
    // `LEONIX_SITE_ORIGIN` helper (same doctrine applied to Servicios in Gate SERVICIOS-1).
    url: `${LEONIX_SITE_ORIGIN}/clasificados/restaurantes/${encodeURIComponent(slug)}`,
    imageUrl: shellData.heroImageUrl,
    telephone: shellData.contact?.phoneDisplay,
    addressText: [shellData.contact?.addressLine1, shellData.contact?.addressLine2].filter(Boolean).join(", ") || undefined,
    websiteUrl: shellData.contact?.websiteHref,
  });

  // Globalization Build 04, Gate 16 — mirrors the visible breadcrumb nav in RestaurantesShellChrome
  // (Clasificados / Restaurantes / this business) as real structured data; no step this page
  // doesn't already show.
  const breadcrumb = breadcrumbJsonLd([
    { name: lang === "en" ? "Classifieds" : "Clasificados", path: `/clasificados?lang=${lang}` },
    { name: lang === "en" ? "Restaurants" : "Restaurantes", path: `/clasificados/restaurantes?lang=${lang}` },
    { name: shellData.businessName, path: `/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=${lang}` },
  ]);

  return (
    <RestaurantesShellChrome lang={lang}>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="mx-auto max-w-[1280px] space-y-3 px-4 pt-4 md:px-5 lg:px-6">
        <p className="text-xs text-[color:var(--lx-muted)]">
          {lang === "en" ? "Listed on Leonix Classifieds" : "Listado publicado en Leonix Clasificados"} ·{" "}
          <Link
            href={`/clasificados/restaurantes/resultados?lang=${lang}`}
            className="font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 hover:text-[color:var(--lx-gold)]"
          >
            {lang === "en" ? "See more restaurants" : "Ver más restaurantes"}
          </Link>
        </p>
        <ClasificadosPreviewAdCanvas className="overflow-hidden">
          <RestauranteProfileViewAnalytics
            listingSlug={slug}
            listingSourceId={row.id}
            leonixAdId={row.leonix_ad_id}
          />
          <RestauranteAdStoryPreview
            data={shellForPublic}
            listingId={(row.leonix_ad_id ?? "").trim() || row.id}
            listingSourceId={row.id}
            listingSlug={slug}
            lang={lang}
            analyticsOwnerUserId={row.owner_user_id}
            persistListingEngagement
            linkedOffers={linkedOffers}
          />
        </ClasificadosPreviewAdCanvas>
        {row.leonix_ad_id ? (
          <p className="pb-6 pt-1 text-xs text-[color:var(--lx-muted)]">
            Leonix Ad ID # {row.leonix_ad_id}
          </p>
        ) : null}
      </div>
      {/* Gate RESTAURANTES-2 — Related Listings, derived from real published rows by shared
          cuisine/type + city (see restaurantesRelatedListings.ts). Reuses the results card. */}
      <RestaurantesRelatedListingsSection
        rows={related.rows}
        matchedByCuisine={related.matchedByCuisine}
        lang={lang}
        browseHref={`/clasificados/restaurantes/resultados?lang=${lang}`}
      />
    </RestaurantesShellChrome>
  );
}
