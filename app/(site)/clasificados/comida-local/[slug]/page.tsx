import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedComidaLocalListingBySlug } from "@/app/lib/clasificados/comida-local/comidaLocalPublicQueries";
import {
  mapComidaLocalRowToDetailVm,
  resolveComidaLocalFoodTypeLabel,
} from "@/app/lib/clasificados/comida-local/mapComidaLocalPublicListing";
import { ComidaLocalPublicDetailClient } from "../components/ComidaLocalPublicDetailClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
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
  const row = await getPublishedComidaLocalListingBySlug(slug);
  if (!row) notFound();

  const vm = mapComidaLocalRowToDetailVm(row);

  return (
    <div className="min-h-screen bg-[#FFFCF7] pb-16">
      <div className="border-b border-[#D4C4A8]/70 bg-[#FDF8F0]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/clasificados/comida-local"
            className="text-sm font-medium text-[#7A1E2C] hover:underline"
          >
            ← Comida Local
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <ComidaLocalPublicDetailClient vm={vm} />
      </div>
    </div>
  );
}
