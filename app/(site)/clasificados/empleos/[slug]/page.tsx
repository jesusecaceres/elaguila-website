import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEmpleoJobBySlug } from "../data/empleosSampleCatalog";
import { EmpleoPublicDetailClient } from "../EmpleoPublicDetailClient";
import { EmpleosPublicLaneDetailClient } from "../EmpleosPublicLaneDetailClient";
import { EmpleosJobPostingJsonLd } from "../components/EmpleosJobPostingJsonLd";
import {
  fetchEmpleosPublishedJobRecords,
  fetchEmpleosPublishedListingRowBySlug,
  rowToJobRecord,
  type EmpleosListingSnapshotJson,
} from "../lib/empleosPublicListingsDbServer";
import { empleosOmitMarketingSeedCatalog } from "../lib/empleosPublicCatalogPolicy";
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
  const canonicalAbs = empleosJobPublicAbsoluteUrl(slug, lang);
  const omitSeed = empleosOmitMarketingSeedCatalog();
  const row = await fetchEmpleosPublishedListingRowBySlug(slug);
  if (row) {
    const job = rowToJobRecord(row);
    return {
      title: `${job.title} — ${job.company} | Empleos`,
      description: job.summary,
      alternates: { canonical: canonicalAbs },
      openGraph: {
        url: canonicalAbs,
        title: `${job.title} — ${job.company}`,
        description: job.summary,
        type: "website",
      },
    };
  }
  if (omitSeed) {
    return {
      title: "Empleo | Leonix Clasificados",
      description: "Vacante, feria o publicación de empleo en Leonix Clasificados.",
      alternates: { canonical: canonicalAbs },
    };
  }
  const job = getEmpleoJobBySlug(slug);
  if (!job) {
    return {
      title: "Empleo | Leonix Clasificados",
      description: "Vacante, feria o publicación de empleo en Leonix Clasificados.",
      alternates: { canonical: canonicalAbs },
    };
  }
  return {
    title: `${job.title} — ${job.company} | Empleos`,
    description: job.summary,
    alternates: { canonical: canonicalAbs },
    openGraph: {
      url: canonicalAbs,
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

  const omitSeed = empleosOmitMarketingSeedCatalog();
  const row = await fetchEmpleosPublishedListingRowBySlug(slug);
  if (omitSeed && !row) {
    notFound();
  }
  const job = row ? rowToJobRecord(row) : getEmpleoJobBySlug(slug) ?? null;
  const relatedExtra = await fetchEmpleosPublishedJobRecords();
  const snap = row?.listing_snapshot as EmpleosListingSnapshotJson | undefined;
  const envelope = snap?.envelope ?? null;
  const useLaneShell = Boolean(row && job && (job.publicationLane || envelope?.lane));

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] pt-24" aria-busy="true" />}>
      {row && job ? <EmpleosJobPostingJsonLd job={job} lang={lang} /> : null}
      {useLaneShell && job ? (
        <EmpleosPublicLaneDetailClient
          slug={slug}
          job={job}
          envelope={envelope}
          relatedExtra={relatedExtra}
          omitMarketingSeedCatalog={omitSeed}
          trackPublicViewsForSlug={row ? slug : null}
        />
      ) : (
        <EmpleoPublicDetailClient
          slug={slug}
          initialJob={job}
          relatedExtra={relatedExtra}
          omitMarketingSeedCatalog={omitSeed}
          trackPublicViewsForSlug={row ? slug : null}
        />
      )}
    </Suspense>
  );
}
