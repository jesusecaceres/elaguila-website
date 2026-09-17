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
import { resolveBusinessToolsAccess } from "@/app/lib/listingPlans/categoryCommercialPlan";
import { applyServiciosPublicOffersVisibility } from "../lib/serviciosPublicOffersVisibility";
import { serviciosJsonLd } from "@/app/servicios/seo/serviciosJsonLd";
import { listRelatedServiciosListings } from "../lib/serviciosRelatedListings";
import { ServiciosRelatedListingsSection } from "../components/ServiciosRelatedListingsSection";
import { LEONIX_SITE_ORIGIN } from "@/app/lib/leonixBrand";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    lang?: string;
    justPublished?: string;
    persistence?: string;
    listingStatus?: string;
    videoSkipped?: string;
    mediaDropped?: string;
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
  // Gate SERVICIOS-1 — the shared media contract dropped media it could not persist. The publish
  // succeeded, so the owner must be told explicitly rather than assume every photo saved.
  const mediaDroppedCount = Number.parseInt(typeof sp.mediaDropped === "string" ? sp.mediaDropped : "", 10);
  const mediaDropped = Number.isFinite(mediaDroppedCount) && mediaDroppedCount > 0 ? mediaDroppedCount : 0;
  const mediaDroppedNotice = mediaDropped
    ? lang === "en"
      ? `${mediaDropped} media file(s) could not be saved and are not on your listing. Open Edit service, add them again, and republish.`
      : `${mediaDropped} archivo(s) multimedia no se pudieron guardar y no están en tu anuncio. Abre Editar servicio, agrégalos de nuevo y vuelve a publicar.`
    : null;
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
        {mediaDroppedNotice ? <p className="text-sm text-amber-900">{mediaDroppedNotice}</p> : null}
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
  // Gate SERVICIOS-2 — related published listings, from the same canonical public reader the
  // results page uses. Only computed for a live public profile.
  const related = isPublishedLive
    ? await listRelatedServiciosListings(row)
    : { rows: [], matchedByTrade: false };
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
        mediaDroppedNotice={mediaDroppedNotice}
        discoveryResultsHref={`/clasificados/servicios/resultados?lang=${lang}`}
      />
    ) : null;
  const canonicalServiciosListingId = row.id?.trim() || "";
  const [listingShareUrl, serviciosOffersAccess] = await Promise.all([
    buildServiciosClasificadosListingShareUrl(slug, lang),
    canonicalServiciosListingId
      ? resolveBusinessToolsAccess({
          category: "servicios",
          listingSource: "servicios_public_listings",
          listingId: canonicalServiciosListingId,
          capability: "coupons_offers",
        }).catch(() => null)
      : Promise.resolve(null),
  ]);
  // Gate E.3.2 — public offer visibility is live entitlement truth only, never content presence
  // baked into `profile` by the (unmodified, pure) resolver. Stored offer content itself is never
  // touched here — only what renders. Fails closed: on any lookup failure offers stay hidden.
  //
  // Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (B4) — the truth used to be an active entitlement for the
  // RETIRED `servicios_offers_addon` key, which nothing grants any more, so a $399 customer's
  // INCLUDED offers never rendered publicly even once saved. The truth is now the included
  // `coupons_offers` capability — the same authority the publish route enforces when saving them —
  // with historical add-on holders still qualifying through the plan policy's legacy branch.
  //
  // Gate SERVICIOS-EDIT-ROUNDTRIP-OFFERS-DISCOVERY-1 (F2) — the visibility rule itself now lives in
  // serviciosPublicOffersVisibility.ts, shared with the "Tiene ofertas" filter so the two agree.
  const serviciosOffersVisible = serviciosOffersAccess?.allowed === true;
  const publicProfile = applyServiciosPublicOffersVisibility(profile, serviciosOffersVisible);
  const engagementKey = serviciosEngagementListingKey(row);
  const persistListingEngagement =
    isPublishedLive && Boolean(engagementKey.trim()) && Boolean((listingShareUrl ?? "").trim());
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
    profile: publicProfile,
    lang,
    editBackHref: justPublished ? `/publicar/servicios?lang=${lang}` : undefined,
    justPublishedPanel,
    noticeBanner,
    analyticsListingSlug: slug,
    listingSourceId: row.id,
    engagementListingId: engagementKey,
    engagementOwnerUserId: row.owner_user_id ?? null,
    showEngagementControls: true,
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

  // Package F Build F2, Gate 15 (P1 SEO fix) — real LocalBusiness structured data; only emitted
  // for published-live profiles (matches this page's own noindex classification elsewhere).
  const jsonLd = isPublishedLive
    ? serviciosJsonLd({
        name: profile.identity.businessName,
        description: profile.about?.text?.slice(0, 300) || undefined,
        // Gate SERVICIOS-2 — absolute canonical detail URL (was a relative path, unusable as a
        // schema.org entity `url`). Same value this route declares as `alternates.canonical`.
        url: `${LEONIX_SITE_ORIGIN}/clasificados/servicios/${encodeURIComponent(slug)}`,
        imageUrl: profile.hero.coverImageUrl,
        telephone: profile.contact.phoneDisplay,
        // Already privacy-gated by `resolveServiciosProfile` (Gate SERVICIOS-1): a listing whose
        // owner turned off `showExactAddress` emits no address here either.
        addressText: profile.contact.physicalAddressDisplay,
        websiteUrl: profile.contact.websiteHref,
        // Real published keyword truth — trade line, city, and the provider's own service titles.
        categoryLabel: profile.hero.categoryLine,
        // City is always public-safe: the address privacy contract governs the exact street line,
        // never the city (`publicCityOrServiceArea` is safe in every branch).
        areaServed: row.city || wireMerged.contact?.physicalCity || profile.hero.locationSummary,
        serviceNames: profile.services.map((s) => s.title),
      })
    : null;

  return (
    <>
      {jsonLd ? (
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
      {/*
        Hidden SSR anchor for QA/smoke: ensures slug + business name appear as plain text in the HTML
        response even when the main profile shell is streamed behind Suspense boundaries.
      */}
      <div className="hidden" aria-hidden data-servicios-ssr-anchor="1">
        {slug} · {profile.identity.businessName}
      </div>
      {isServiciosProfessionalTemplate(listingTemplate) ? (
        <ServiciosProfessionalProfileShell
          {...profileShellProps}
          template={listingTemplate}
          showTopBar={false}
          showMobileSectionNav={false}
        />
      ) : (
        <ServiciosProfileView {...profileShellProps} showTopBar={false} />
      )}
      {/* Gate SERVICIOS-2 — Related Listings, derived from real published rows by shared trade
          family + location (see serviciosRelatedListings.ts). Only on a live public profile: a
          paused/pending vitrina must not advertise competitors, and its own page is noindex. */}
      {isPublishedLive ? (
        <ServiciosRelatedListingsSection
          rows={related.rows}
          matchedByTrade={related.matchedByTrade}
          lang={lang}
          browseHref={`/clasificados/servicios/resultados?lang=${lang}`}
        />
      ) : null}
    </>
  );
}
