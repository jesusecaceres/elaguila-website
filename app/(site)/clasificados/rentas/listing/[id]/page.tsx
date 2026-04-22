import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { fetchRentasListingForPublicDetail } from "@/app/clasificados/rentas/lib/fetchRentasListingForPublicDetail";
import {
  findRentasDemoListingById,
  getRentasListingDetailExtra,
} from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import { RentasListingDetailClient } from "./RentasListingDetailClient";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  const live = await fetchRentasListingForPublicDetail(id, lang);
  const listing = live ?? (process.env.NODE_ENV !== "production" ? findRentasDemoListingById(id) : undefined);
  if (!listing) return { title: "Rentas | Leonix" };
  return {
    title: `${listing.title} — ${listing.rentDisplay} | Leonix`,
    description: listing.addressLine,
  };
}

export default async function RentasListingDetailPage(props: Props) {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
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
