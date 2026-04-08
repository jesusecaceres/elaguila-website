import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Navbar from "@/app/components/Navbar";

import { ViajesNegocioProfileLayout } from "../../components/ViajesNegocioProfileLayout";
import { getViajesNegocioProfileBySlug, VIAJES_NEGOCIO_SLUGS } from "../../data/viajesNegocioProfileSampleData";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return VIAJES_NEGOCIO_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getViajesNegocioProfileBySlug(slug);
  if (!p) return { title: "Negocio | Leonix Viajes" };
  return {
    title: `${p.businessName} | Leonix Viajes`,
    description: p.tagline,
  };
}

export default async function ClasificadosViajesNegocioPage({ params }: Props) {
  const { slug } = await params;
  const profile = getViajesNegocioProfileBySlug(slug);
  if (!profile) notFound();

  return (
    <div className="min-h-screen bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <Navbar />
      <ViajesNegocioProfileLayout profile={profile} backHref="/clasificados/viajes/resultados" />
    </div>
  );
}
