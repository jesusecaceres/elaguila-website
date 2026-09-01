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
import { normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { RecentlyViewedAndReportMount } from "@/app/clasificados/components/RecentlyViewedAndReportMount";

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

  const vm = mapComidaLocalRowToDetailVm(row, lang === "en" ? "en" : "es");
  const hubHref = replaceLangInHref("/clasificados/comida-local", lang);

  return (
    <div className={CL_PAGE}>
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
        <ComidaLocalPublicDetailClient vm={vm} lang={lang === "en" ? "en" : "es"} />
        <RecentlyViewedAndReportMount listingId={row.id} lang={lang === "en" ? "en" : "es"} />
      </div>
    </div>
  );
}
