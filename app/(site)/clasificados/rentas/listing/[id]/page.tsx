import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  findRentasDemoListingById,
  getRentasListingDetailExtra,
} from "@/app/clasificados/rentas/listing/rentasListingDetailModel";
import { RentasListingDetailClient } from "./RentasListingDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { id } = await props.params;
  const listing = findRentasDemoListingById(id);
  if (!listing) return { title: "Rentas | Leonix" };
  return {
    title: `${listing.title} — ${listing.rentDisplay} | Leonix`,
    description: listing.addressLine,
  };
}

export default async function RentasListingDetailPage(props: Props) {
  const { id } = await props.params;
  const listing = findRentasDemoListingById(id);
  if (!listing) notFound();
  const extra = getRentasListingDetailExtra(listing);
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[#F4EDE3]" />}>
      <RentasListingDetailClient listing={listing} extra={extra} />
    </Suspense>
  );
}
