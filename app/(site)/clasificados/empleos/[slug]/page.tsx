import { Suspense } from "react";
import type { Metadata } from "next";
import { getEmpleoJobBySlug } from "../data/empleosSampleCatalog";
import { EmpleoPublicDetailClient } from "../EmpleoPublicDetailClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = getEmpleoJobBySlug(slug);
  if (!job) {
    return {
      title: "Empleo | Leonix Clasificados",
      description: "Vacante, feria o publicación de empleo en Leonix Clasificados.",
      alternates: { canonical: `/clasificados/empleos/${slug}` },
    };
  }
  return {
    title: `${job.title} — ${job.company} | Empleos`,
    description: job.summary,
    alternates: { canonical: `/clasificados/empleos/${slug}` },
  };
}

export default async function EmpleoPublicDetailPage({ params }: Props) {
  const { slug } = await params;
  const catalogJob = getEmpleoJobBySlug(slug) ?? null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] pt-24" aria-busy="true" />}>
      <EmpleoPublicDetailClient slug={slug} initialCatalogJob={catalogJob} />
    </Suspense>
  );
}
