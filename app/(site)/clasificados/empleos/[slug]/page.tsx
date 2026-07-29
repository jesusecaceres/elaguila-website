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
import { resolveEmpleosPublicationLane } from "../lib/empleosLaneResolve";
import { resolveClasificadosPublishLangFromSearchParams } from "@/app/lib/clasificados/clasificadosPublishLang";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);
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
  const { copyLang: lang } = resolveClasificadosPublishLangFromSearchParams(sp);

  const omitSeed = empleosOmitMarketingSeedCatalog();
  const row = await fetchEmpleosPublishedListingRowBySlug(slug);
  if (omitSeed && !row) {
    notFound();
  }
  const job = row ? rowToJobRecord(row) : getEmpleoJobBySlug(slug) ?? null;
  const relatedExtra = await fetchEmpleosPublishedJobRecords();
  const snap = row?.listing_snapshot as EmpleosListingSnapshotJson | undefined;
  const envelope = snap?.envelope ?? null;
  // Gate I.5.4C — resolve through the shared deterministic resolver instead of a bare
  // publicationLane/envelope-lane check, so a row whose JSON snapshot omits lane data still
  // routes correctly via the canonical `lane` DB column (see empleosLaneResolve.ts).
  const resolvedLane =
    row && job
      ? resolveEmpleosPublicationLane({
          jobPublicationLane: job.publicationLane,
          envelopeLane: envelope?.lane,
          rowLane: row.lane,
          feriaDateLine: job.feriaDateLine,
          feriaTimeLine: job.feriaTimeLine,
          feriaVenue: job.feriaVenue,
        })
      : "unknown";
  const useLaneShell = Boolean(row && job && resolvedLane !== "unknown");
  if (row && job && resolvedLane === "unknown") {
    // Internal diagnostic only (server logs) — never shown to the visitor, no PII.
    console.warn("[empleos] lane unresolved for published listing; using legacy fallback shell", {
      listingId: row.id,
      slug,
    });
  }
  const engagementListingKey = row ? ((row.leonix_ad_id ?? "").trim() || row.id) : null;
  const persistListingEngagement = Boolean(row);
  const listingSourceId = row?.id ?? null;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2] pt-24" aria-busy="true" />}>
      {row && job ? <EmpleosJobPostingJsonLd job={job} lang={lang} /> : null}
      {useLaneShell && job ? (
        <EmpleosPublicLaneDetailClient
          slug={slug}
          leonixAdId={row?.leonix_ad_id ?? null}
          listingSourceId={listingSourceId}
          listingLang={row?.lang ?? null}
          job={job}
          envelope={envelope}
          relatedExtra={relatedExtra}
          omitMarketingSeedCatalog={omitSeed}
          trackPublicViewsForSlug={row ? slug : null}
          engagementListingKey={engagementListingKey}
          engagementOwnerUserId={row?.owner_user_id ?? null}
          persistListingEngagement={persistListingEngagement}
        />
      ) : (
        <EmpleoPublicDetailClient
          slug={slug}
          leonixAdId={row?.leonix_ad_id ?? null}
          listingSourceId={listingSourceId}
          listingLang={row?.lang ?? null}
          initialJob={job}
          relatedExtra={relatedExtra}
          omitMarketingSeedCatalog={omitSeed}
          trackPublicViewsForSlug={row ? slug : null}
          engagementListingKey={engagementListingKey}
          engagementOwnerUserId={row?.owner_user_id ?? null}
          persistListingEngagement={persistListingEngagement}
        />
      )}
    </Suspense>
  );
}
