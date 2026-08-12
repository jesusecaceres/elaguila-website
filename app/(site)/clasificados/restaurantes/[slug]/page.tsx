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
import { RESTAURANTES_COUPON_ADDON_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { fetchAddonEntitlementsForListings } from "@/app/lib/listingPlans/addonEntitlementReader";
import { restauranteJsonLd } from "../seo/restauranteJsonLd";

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

  const [linkedOffers, couponEntitlements] = await Promise.all([
    isSupabaseAdminConfigured()
      ? fetchRestauranteLinkedOffersForPublicPage(getAdminSupabase(), row.id, lang)
      : Promise.resolve([]),
    fetchAddonEntitlementsForListings({
      category: "restaurantes",
      packageKey: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
      listingIds: [row.id],
    }),
  ]);

  // Gate E.2.2 — public coupon module visibility is live entitlement truth only, never the
  // legacy `listing_json.couponUpgradeEnabled` flag baked into `shellData` by the (unmodified,
  // pure) mapper. On any lookup failure, `fetchAddonEntitlementsForListings` already fails
  // closed to `not_purchased` (see addonEntitlementReader.ts), so this stays hidden rather than
  // throwing or exposing the base listing to risk. Stored coupon content itself is never
  // touched here — only what gets rendered.
  const couponAddonActive = couponEntitlements.get(row.id)?.status === "active";
  const shellForPublic = {
    ...shellData,
    id: row.id,
    coupons: couponAddonActive ? shellData.coupons : undefined,
    couponFlyer: couponAddonActive ? shellData.couponFlyer : undefined,
    couponMoreOffers: couponAddonActive ? shellData.couponMoreOffers : undefined,
  };

  const jsonLd = restauranteJsonLd({
    name: shellData.businessName,
    description: row.summary_short?.trim() || undefined,
    url: `/clasificados/restaurantes/${encodeURIComponent(slug)}`,
    imageUrl: shellData.heroImageUrl,
    telephone: shellData.contact?.phoneDisplay,
    addressText: [shellData.contact?.addressLine1, shellData.contact?.addressLine2].filter(Boolean).join(", ") || undefined,
    websiteUrl: shellData.contact?.websiteHref,
    ratingAverage: shellData.trustRating?.average,
    ratingCount: shellData.trustRating?.count,
  });

  return (
    <RestaurantesShellChrome lang={lang}>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
    </RestaurantesShellChrome>
  );
}
