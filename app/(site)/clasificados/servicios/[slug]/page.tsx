import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView";
import { ServiciosProfessionalProfileShell } from "@/app/servicios/components/ServiciosProfessionalProfileShell";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { mergeServiciosProfileWithApprovedDbReviews } from "../lib/serviciosDbReviewsMerge";
import { listApprovedServiciosReviewsForSlug } from "../lib/serviciosOpsTablesServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "../lib/serviciosListingLifecycle";
import {
  fetchServiciosNetLikeCountsByEngagementKeys,
  getServiciosPublicListingBySlugForDiscovery,
} from "../lib/serviciosPublicListingsServer";
import { buildServiciosClasificadosListingShareUrl } from "../lib/buildServiciosListingShareUrl";
import {
  serviciosEngagementListingKey,
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
  serviciosPublicFooterLeonixAdId,
} from "../lib/serviciosPublicListingSort";
import type { ServiciosBusinessProfile } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { shouldShowServiciosPublicLeadInquiryForm } from "../lib/serviciosLeadNotifyRecipientServer";
import {
  isServiciosProfessionalTemplate,
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
} from "../lib/serviciosTemplateRouting";
import { ServiciosJustPublishedSuccessBanner } from "@/app/(site)/clasificados/publicar/servicios/components/ServiciosJustPublishedSuccessBanner";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    lang?: string;
    justPublished?: string;
    persistence?: string;
    listingStatus?: string;
    videoSkipped?: string;
  }>;
};

/**
 * Public Servicios profile: Supabase (and dev-workspace file only when dev persistence is enabled).
 * Unknown slugs → 404 (no static sample listings, no browser-localStorage profiles).
 */
export default async function ClasificadosServiciosDynamicPage(props: PageProps) {
  const { slug } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang: ServiciosLang = sp.lang === "en" ? "en" : "es";

  const row = await getServiciosPublicListingBySlugForDiscovery(slug);
  if (!row) notFound();

  const q = `lang=${lang}`;
  const videoSkipped = sp.videoSkipped === "1";
  const videoSkippedNotice =
    lang === "en"
      ? "Some videos were too large and were not published. The listing was published with compatible media."
      : "Algunos videos eran demasiado grandes y no se publicaron. El anuncio se publicó con los medios compatibles.";
  if (row.listing_status === "pending_review") {
    const justPublished = sp.justPublished === "1";
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-4 py-16 text-center text-[#1E1810]">
        <h1 className="text-xl font-bold">{lang === "en" ? "Profile under review" : "Perfil en revisión"}</h1>
        <p className="text-sm text-[#5C5346]">
          {justPublished
            ? lang === "en"
              ? "Received — thank you. Leonix will review before this appears in public Servicios search."
              : "Recibido — gracias. Leonix revisará antes de que aparezca en la búsqueda pública de Servicios."
            : lang === "en"
              ? "Leonix is reviewing this showcase before it appears in public search. You can track status from your dashboard."
              : "Leonix está revisando esta vitrina antes de mostrarla en la búsqueda pública. Puedes ver el estado en tu panel."}
        </p>
        {videoSkipped ? <p className="text-sm text-amber-900">{videoSkippedNotice}</p> : null}
        <Link href={`/dashboard/servicios?${q}`} className="text-sm font-bold text-[#3B66AD] underline">
          {lang === "en" ? "Open dashboard" : "Abrir panel"}
        </Link>
      </div>
    );
  }
  if (row.listing_status === "rejected" || row.listing_status === "suspended") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-4 py-16 text-center text-[#1E1810]">
        <h1 className="text-xl font-bold">{lang === "en" ? "Listing unavailable" : "Anuncio no disponible"}</h1>
        <p className="text-sm text-[#5C5346]">
          {lang === "en"
            ? "This profile is not available on Leonix right now. If you are the provider, check your dashboard or contact support."
            : "Este perfil no está disponible en Leonix en este momento. Si eres el proveedor, revisa tu panel o contacta a soporte."}
        </p>
        <Link href={`/clasificados/servicios/resultados?${q}`} className="text-sm font-bold text-[#3B66AD] underline">
          {lang === "en" ? "Browse Servicios" : "Explorar Servicios"}
        </Link>
      </div>
    );
  }

  const paused = row.listing_status === "paused_unpublished";
  const isPublishedLive = row.listing_status === SERVICIOS_LISTING_STATUS_PUBLISHED && !paused;
  const dbApproved = isPublishedLive ? await listApprovedServiciosReviewsForSlug(slug) : [];
  const wireMerged = mergeServiciosProfileWithApprovedDbReviews({ ...row.profile_json }, dbApproved);
  wireMerged.identity = { ...wireMerged.identity, leonixVerified: row.leonix_verified === true };
  const profile = resolveServiciosProfile(wireMerged, lang);
  const leonixAdIdFooter = serviciosPublicFooterLeonixAdId(row.leonix_ad_id);
  const justPublished = sp.justPublished === "1";
  const persistence = typeof sp.persistence === "string" ? sp.persistence : "";
  const pausedMsg =
    paused
      ? lang === "en"
        ? "This profile is paused and may not appear in public search results."
        : "Este perfil está en pausa y puede no aparecer en los resultados públicos."
      : "";
  const noticeBanner = pausedMsg || undefined;
  const justPublishedPanel =
    justPublished && isPublishedLive ? (
      <ServiciosJustPublishedSuccessBanner
        lang={lang}
        slug={slug}
        leonixAdId={leonixAdIdFooter}
        persistence={persistence || undefined}
        videoSkippedNotice={videoSkipped ? videoSkippedNotice : null}
        discoveryResultsHref={`/clasificados/servicios/resultados?lang=${lang}`}
      />
    ) : null;
  const listingShareUrl = await buildServiciosClasificadosListingShareUrl(slug, lang);
  const engagementKey = serviciosEngagementListingKey(row);
  const persistListingEngagement = Boolean(engagementKey.trim());
  const likeKeys = serviciosLikeCountAliasKeys(row);
  const likeCountMap = await fetchServiciosNetLikeCountsByEngagementKeys(likeKeys);
  const publicLikeCount = serviciosNetLikeCountForPublicRow(row, likeCountMap);
  const showPublicLeadInquiryForm =
    isPublishedLive &&
    (await shouldShowServiciosPublicLeadInquiryForm(row.profile_json as ServiciosBusinessProfile, row.owner_user_id ?? null));
  const directContactFasterResponseHint = isPublishedLive && !showPublicLeadInquiryForm;

  const listingTemplate = resolveServiciosListingTemplate({
    businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
    internalGroup: row.internal_group,
    categoryLabel: profile.hero.categoryLine,
  });

  const profileShellProps = {
    profile,
    lang,
    editBackHref: justPublished ? `/clasificados/publicar/servicios?lang=${lang}` : undefined,
    justPublishedPanel,
    noticeBanner,
    analyticsListingSlug: slug,
    listingSourceId: row.id,
    engagementListingId: engagementKey,
    engagementOwnerUserId: row.owner_user_id ?? null,
    persistListingEngagement,
    publicLikeCount,
    listingShareUrl,
    leonixAdIdFooter,
    showPublicLeadInquiryForm,
    directContactFasterResponseHint,
    serviciosDiscoveryResultsHref: isPublishedLive
      ? `/clasificados/servicios/resultados?lang=${lang}`
      : undefined,
  } as const;

  return (
    <>
      {/*
        Hidden SSR anchor for QA/smoke: ensures slug + business name appear as plain text in the HTML
        response even when the main profile shell is streamed behind Suspense boundaries.
      */}
      <div className="hidden" aria-hidden data-servicios-ssr-anchor="1">
        {slug} · {profile.identity.businessName}
      </div>
      {isServiciosProfessionalTemplate(listingTemplate) ? (
        <ServiciosProfessionalProfileShell {...profileShellProps} template={listingTemplate} />
      ) : (
        <ServiciosProfileView {...profileShellProps} />
      )}
    </>
  );
}
