import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedComidaLocalListingBySlug } from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import {
  mapComidaLocalRowToCardVm,
  mapComidaLocalRowToDetailVm,
  resolveComidaLocalFoodTypeLabel,
} from "@/app/lib/clasificados/comida-local/mapComidaLocalPublicListing";
import {
  CL_CONTAINER_NARROW,
  CL_EYEBROW,
  CL_HEADER_BAR,
  CL_PAGE,
} from "../components/comidaLocalCustomerStyles";
import { ComidaLocalPublicDetailClient } from "../components/ComidaLocalPublicDetailClient";
import { ComidaLocalRelatedListingsSection } from "../components/ComidaLocalRelatedListingsSection";
import { listRelatedComidaLocalListings } from "../lib/comidaLocalRelatedListings";
import { comidaLocalJsonLd } from "../seo/comidaLocalJsonLd";
import { breadcrumbJsonLd } from "@/app/lib/seo/breadcrumbJsonLd";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";
import { normalizeLang, replaceLangInHref } from "@/app/lib/language";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const row = await getPublishedComidaLocalListingBySlug(slug);
  if (!row) {
    return {
      title:
        lang === "en" ? "Listing not found | Local Food | Leonix" : "Ficha no encontrada | Comida Local | Leonix",
    };
  }
  const food = resolveComidaLocalFoodTypeLabel(row, lang === "en" ? "en" : "es");
  const city = row.city_display?.trim() || row.city_canonical?.trim() || "";
  const categoryLabel = lang === "en" ? "Local Food" : "Comida Local";
  const title = `${row.business_name.trim()} | ${categoryLabel} | Leonix`;
  const description = [food, city, row.que_vendes?.trim()].filter(Boolean).join(" · ").slice(0, 160);
  const fallbackDescription =
    lang === "en"
      ? "Local food seller profile on Leonix Classifieds."
      : "Ficha de vendedor local de comida en Leonix Clasificados.";
  const canonical = `/clasificados/comida-local/${encodeURIComponent(row.slug)}`;
  const mainImageSrc = mapComidaLocalRowToCardVm(row).mainImageSrc;

  return {
    title,
    description: description || fallbackDescription,
    alternates: { canonical },
    // Package F Build F2, Gate 7 (P1 SEO fix) — no Open Graph previously; title/description were
    // also hardcoded Spanish regardless of `?lang=`.
    openGraph: {
      title,
      description: description || fallbackDescription,
      url: canonical,
      images: mainImageSrc ? [{ url: mainImageSrc }] : undefined,
    },
  };
}

export default async function ComidaLocalPublicDetailPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const row = await getPublishedComidaLocalListingBySlug(slug);
  if (!row) notFound();

  const pageLang = lang === "en" ? "en" : "es";
  const vm = mapComidaLocalRowToDetailVm(row, pageLang);
  const hubHref = replaceLangInHref("/clasificados/comida-local", lang);
  const related = await listRelatedComidaLocalListings(row);

  // Gate COMIDA-LOCAL-2 — real structured data from published values only.
  //
  // `vm.businessAddressLine` is already empty unless the owner opted in via `showAddressPublicly`
  // (the single privacy gate in `mapComidaLocalDraftToPreviewVm`), so a private home address can
  // never reach `address` here. `vm.locationNote` — the 24h Find Me Today value — is deliberately
  // NOT passed: `schema.org/address` has no expiry semantics, so a temporary corner published as a
  // permanent address would outlive its own freshness window in every consumer that caches it.
  //
  // `sameAs` comes from the VM's already-normalized social actions (real host-validated URLs),
  // never from raw draft text. No rating is emitted — the builder has no parameter for one.
  const canonicalUrl = `${LEONIX_SITE_ORIGIN}/clasificados/comida-local/${encodeURIComponent(row.slug.trim())}`;
  const jsonLd = comidaLocalJsonLd({
    name: vm.businessName,
    description: vm.queVendes ? vm.queVendes.slice(0, 300) : undefined,
    url: canonicalUrl,
    imageUrl: vm.mainImage?.src,
    telephone: row.phone?.trim() || undefined,
    addressText: vm.businessAddressLine || undefined,
    areaServed: row.city_display?.trim() || row.city_canonical?.trim() || undefined,
    servesCuisine: vm.foodTypeChips[0]?.label || undefined,
    priceRange: vm.priceLevelLabel || undefined,
    sameAs: vm.contactActions.filter((a) => a.variant === "social").map((a) => a.href),
  });

  // Mirrors the visible trail this page actually shows (Clasificados / Comida Local / this seller)
  // as real structured data; no step the page does not render.
  const breadcrumb = breadcrumbJsonLd([
    { name: pageLang === "en" ? "Classifieds" : "Clasificados", path: `/clasificados?lang=${pageLang}` },
    { name: pageLang === "en" ? "Local Food" : "Comida Local", path: `/clasificados/comida-local?lang=${pageLang}` },
    {
      name: vm.businessName,
      path: `/clasificados/comida-local/${encodeURIComponent(row.slug.trim())}?lang=${pageLang}`,
    },
  ]);

  return (
    <div className={CL_PAGE}>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className={CL_HEADER_BAR}>
        <div className={`${CL_CONTAINER_NARROW} flex flex-wrap items-center justify-between gap-2 py-3.5`}>
          <Link
            href={hubHref}
            className="text-sm font-medium text-[#7A1E2C] hover:underline"
          >
            ← Comida Local
          </Link>
          <p className={CL_EYEBROW}>Ficha pública</p>
        </div>
      </div>

      <div className={`${CL_CONTAINER_NARROW} py-6 sm:py-8`}>
        <ComidaLocalPublicDetailClient vm={vm} lang={pageLang} />
        <ComidaLocalRelatedListingsSection
          rows={related.rows}
          matchedByFood={related.matchedByFood}
          lang={pageLang}
          browseHref={hubHref}
        />
      </div>
    </div>
  );
}
