import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { fetchRentasListingForPublicDetail } from "@/app/clasificados/rentas/lib/fetchRentasListingForPublicDetail";
import {
  findRentasDemoListingById,
  getRentasListingDetailExtra,
} from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import { RentasListingDetailClient } from "./RentasListingDetailClient";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const live = await fetchRentasListingForPublicDetail(id, lang);
  const listing = live ?? (process.env.NODE_ENV !== "production" ? findRentasDemoListingById(id) : undefined);
  const canonical = `/clasificados/rentas/listing/${encodeURIComponent(id)}`;
  if (!listing) return { title: "Rentas | Leonix", alternates: { canonical } };
  const title = `${listing.title} — ${listing.rentDisplay} | Leonix`;
  // Package F Build F2, Gate 7 (P1 SEO fix) — this page previously set no `alternates`/`openGraph`
  // at all.
  return {
    title,
    description: listing.addressLine,
    alternates: { canonical },
    openGraph: {
      title,
      description: listing.addressLine,
      url: canonical,
      images: listing.imageUrl ? [{ url: listing.imageUrl }] : undefined,
    },
  };
}

export default async function RentasListingDetailPage(props: Props) {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
  const live = await fetchRentasListingForPublicDetail(id, lang);
  const listing = live ?? (process.env.NODE_ENV !== "production" ? findRentasDemoListingById(id) : undefined);
  if (!listing) notFound();
  const extra = getRentasListingDetailExtra(listing);
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F4EDE3]" />}>
      <RentasListingDetailClient listing={listing} extra={extra} />
    </Suspense>
  );
}
