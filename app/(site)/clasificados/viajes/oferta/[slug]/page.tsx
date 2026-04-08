import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/app/components/Navbar";

import { ViajesOfferDetailLayout } from "../../components/ViajesOfferDetailLayout";
import { getViajesOfferDetailBySlug, VIAJES_OFFER_SLUGS } from "../../data/viajesOfferDetailSampleData";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VIAJES_OFFER_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const offer = getViajesOfferDetailBySlug(slug);
  if (!offer) return { title: "Oferta | Leonix Viajes" };
  return {
    title: `${offer.title} | Leonix Viajes`,
    description: offer.description.slice(0, 155),
  };
}

export default async function ClasificadosViajesOfertaPage({ params }: Props) {
  const { slug } = await params;
  const offer = getViajesOfferDetailBySlug(slug);
  if (!offer) notFound();

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <ViajesOfferDetailLayout offer={offer} backHref="/clasificados/viajes/resultados" />
    </div>
  );
}
