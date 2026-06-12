import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedComidaLocalListingBySlug } from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import {
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

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const row = await getPublishedComidaLocalListingBySlug(slug);
  if (!row) {
    return { title: "Ficha no encontrada | Comida Local | Leonix" };
  }
  const food = resolveComidaLocalFoodTypeLabel(row);
  const city = row.city_display?.trim() || row.city_canonical?.trim() || "";
  const title = `${row.business_name.trim()} | Comida Local | Leonix`;
  const description = [food, city, row.que_vendes?.trim()].filter(Boolean).join(" · ").slice(0, 160);

  return {
    title,
    description: description || "Ficha de vendedor local de comida en Leonix Clasificados.",
    alternates: { canonical: `/clasificados/comida-local/${encodeURIComponent(row.slug)}` },
  };
}

export default async function ComidaLocalPublicDetailPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const row = await getPublishedComidaLocalListingBySlug(slug);
  if (!row) notFound();

  const vm = mapComidaLocalRowToDetailVm(row);
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
        <ComidaLocalPublicDetailClient vm={vm} />
      </div>
    </div>
  );
}
