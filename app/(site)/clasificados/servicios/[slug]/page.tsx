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
        <h1 className="text-xl font-bold">{lang === "en" ? "Listing under review" : "Anuncio en revisión"}</h1>
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
  const justPublished = sp.justPublished === "1";
  const persistence = typeof sp.persistence === "string" ? sp.persistence : "";
  const publishLines: string[] = [];
  if (justPublished) {
    if (persistence === "database") {
      publishLines.push(
        lang === "en"
          ? "Listing saved to Leonix. It should appear in Servicios results and search."
          : "Listado guardado en Leonix. Debería aparecer en resultados y búsqueda de Servicios.",
      );
    } else if (persistence === "dev_workspace") {
      publishLines.push(
        lang === "en"
          ? "Test mode: saved to the local dev file (.servicios-dev-publishes.json). Visible in results while `next dev` runs on this machine."
          : "Modo prueba: guardado en archivo local de desarrollo (.servicios-dev-publishes.json). Visible en resultados mientras corre `next dev` en esta máquina.",
      );
    } else if (persistence === "none") {
      publishLines.push(
        lang === "en"
          ? "Saved in this browser only (no database or dev file). Open this profile from the same browser; configure Supabase or run `next dev` with dev publish for shared discovery."
          : "Guardado solo en este navegador (sin base ni archivo dev). Abre este perfil desde el mismo navegador; configura Supabase o usa `next dev` con publicación dev para descubrimiento compartido.",
      );
    } else {
      publishLines.push(lang === "en" ? "Your listing was published." : "Tu listado se publicó.");
    }
  }
  if (videoSkipped) {
    publishLines.push(videoSkippedNotice);
  }
  const pausedMsg =
    paused
      ? lang === "en"
        ? "This listing is paused and may not appear in public search results."
        : "Este anuncio está en pausa y puede no aparecer en los resultados públicos."
      : "";
  const noticeBanner = [pausedMsg, publishLines.join(" ")].filter(Boolean).join("\n\n") || undefined;
  const listingShareUrl = await buildServiciosClasificadosListingShareUrl(slug, lang);
  const engagementKey = serviciosEngagementListingKey(row);
  const persistListingEngagement = Boolean(engagementKey.trim());
  const likeKeys = serviciosLikeCountAliasKeys(row);
  const likeCountMap = await fetchServiciosNetLikeCountsByEngagementKeys(likeKeys);
  const publicLikeCount = serviciosNetLikeCountForPublicRow(row, likeCountMap);
  const leonixAdIdFooter = serviciosPublicFooterLeonixAdId(row.leonix_ad_id);
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
    noticeBanner,
    analyticsListingSlug: slug,
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
