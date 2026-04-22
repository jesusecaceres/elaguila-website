import { Suspense } from "react";
import type { Metadata } from "next";

import { getEmpleoJobBySlug } from "../data/empleosSampleCatalog";
import { EmpleoPublicDetailClient } from "../EmpleoPublicDetailClient";
import { EmpleosJobPostingJsonLd } from "../components/EmpleosJobPostingJsonLd";
import {
  fetchEmpleosPublishedJobRecords,
  fetchEmpleosPublishedListingRowBySlug,
  rowToJobRecord,
} from "../lib/empleosPublicListingsDbServer";
import { empleosJobPublicAbsoluteUrl } from "../lib/empleosSiteUrl";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const lang = sp.lang === "en" ? "en" : "es";
  const row = await fetchEmpleosPublishedListingRowBySlug(slug);
  if (row) {
    const job = rowToJobRecord(row);
    const ogUrl = empleosJobPublicAbsoluteUrl(slug, lang);
    return {
      title: `${job.title} — ${job.company} | Empleos`,
      description: job.summary,
      alternates: { canonical: `/clasificados/empleos/${slug}` },
      openGraph: {
        url: ogUrl,
        title: `${job.title} — ${job.company}`,
        description: job.summary,
        type: "website",
      },
    };
  }
  const job = getEmpleoJobBySlug(slug);
  if (!job) {
    return {
      title: "Empleo | Leonix Clasificados",
      description: "Vacante, feria o publicación de empleo en Leonix Clasificados.",
      alternates: { canonical: `/clasificados/empleos/${slug}` },
    };
  }
  const ogUrl = empleosJobPublicAbsoluteUrl(slug, lang);
  return {
    title: `${job.title} — ${job.company} | Empleos`,
    description: job.summary,
    alternates: { canonical: `/clasificados/empleos/${slug}` },
    openGraph: {
      url: ogUrl,
      title: `${job.title} — ${job.company}`,
      description: job.summary,
      type: "website",
    },
  };
}

export default async function EmpleoPublicDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const lang = sp.lang === "en" ? "en" : "es";

  const row = await fetchEmpleosPublishedListingRowBySlug(slug);
  const job = row ? rowToJobRecord(row) : getEmpleoJobBySlug(slug) ?? null;
  const relatedExtra = await fetchEmpleosPublishedJobRecords();

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] pt-24" aria-busy="true" />}>
      {job ? <EmpleosJobPostingJsonLd job={job} lang={lang} /> : null}
      <EmpleoPublicDetailClient slug={slug} initialJob={job} relatedExtra={relatedExtra} />
    </Suspense>
  );
}
