"use client";

import Link from "next/link";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  archiveListingLabel,
  editListingLabel,
  pauseListingLabel,
  publicViewLabel,
  resumeListingLabel,
} from "../lib/dashboardMisAnunciosCategoryTools";
import {
  leonixLiveAnuncioPath,
  parseLeonixListingContract,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import {
  categoryAdPlanDisplayLabel,
  listingPlanFieldLabel,
  listingPlanFootnote,
  resolveCategoryAdPlan,
} from "@/app/lib/listingPlans/categoryAdPlans";
import {
  isListingRepublishWindowActive,
} from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import { BrNegocioListingInventoryActions } from "@/app/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions";
import {
  bienesListingEditHref,
  bienesListingPreviewHref,
  resolveBienesCategoriaFromDetailPairs,
} from "@/app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout";
import {
  isBrInventoryMainListing,
  isBrInventoryProperty,
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  buildListingIdentity,
  resolveAttentionState,
  resolveDashboardActions,
  resolveEligibleGlobalActions,
  resolveOwnerFacingStatus,
  type AttentionSeverity,
  type DashboardAction,
  type GlobalActionDescriptor,
} from "@/app/lib/listingIdentity";
import { buildBienesRaicesEligibilityInput } from "@/app/lib/listingIdentity/bienesRaicesLifecycleAdapter";
import type { DashboardEntitlementBadgePayload } from "../lib/dashboardPackageEntitlementBadges";
import type { Lang } from "@/app/(site)/dashboard/lib/dashboardI18n";
import type { ListingLifecycleResolved } from "@/app/lib/listingLifecycle/listingLifecycleTypes";
import { ListingLifecycleStatusCard } from "./ListingLifecycleStatusCard";
import { ListingRenewalAction } from "./ListingRenewalAction";

type Row = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
  /** Permanent directory id when present — display only. */
  leonix_ad_id?: string | null;
  /** Used for Rentas-specific dashboard lines (e.g. availability from detail_pairs). */
  category?: string | null;
  /** Fallback when `Leonix:branch` is missing on older rows but `category` is rentas. */
  seller_type?: string | null;
  detail_pairs?: unknown;
  republished_at?: unknown;
  is_published?: boolean | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  expires_at?: string | null;
};

function scaffoldEditHref(branch: LeonixClasificadosBranch, categoria: string | null): string {
  const q =
    categoria && (categoria === "residencial" || categoria === "comercial" || categoria === "terreno_lote")
      ? `?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(categoria)}`
      : "";
  if (branch === "bienes_raices_privado") return `/publicar/bienes-raices/privado${q}`;
  if (branch === "bienes_raices_negocio") return `/publicar/bienes-raices${q}`;
  if (branch === "rentas_privado") return `/publicar/rentas/privado${q}`;
  return `/publicar/rentas/negocio${q}`;
}

function rentasDashboardEditHref(input: {
  branch: LeonixClasificadosBranch;
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
}): string {
  const lane = input.branch === "rentas_negocio" ? "negocio" : "privado";
  const params = new URLSearchParams({
    edit: "1",
    source: "dashboard",
    mode: "listing-edit",
    listingId: input.listingId,
    lane,
    lang: input.lang,
    returnTo: `/dashboard/mis-anuncios?cat=rentas&lang=${input.lang}`,
  });
  if (input.leonixAdId?.trim()) params.set("leonixAdId", input.leonixAdId.trim());
  return `/clasificados/publicar/rentas/${lane}?${params.toString()}`;
}

/**
 * Gate D.2/D.2.2 — canonical dashboard actions for a Bienes Raíces Negocio row (parent or
 * child), sourced from `resolveDashboardActions`. `sourceId` is always this row's OWN uuid
 * (never substituted with the parent's).
 *
 * `viewPublic` is safe to consume for both parent and child rows (the registry's `publicRoute`
 * is `identity.sourceId`-only, no role gating, verified byte-identical to the existing
 * `leonixLiveAnuncioPath` fallback — Gate D.2).
 *
 * `edit`/`preview` are only ever populated by the resolver for the parent role — the resolver's
 * own `editSupported`/`previewSupported` checks exclude `bienes_raices_negocio` children — but
 * callers must still gate consumption of those two keys on `!isChild` explicitly rather than
 * relying solely on that internal suppression (Gate D.2.2), since a child's Edit/Preview via the
 * generic dashboard-linked route is confirmed broken (Gate D.2.1: the hydration path re-includes
 * the child as one of its own inventory properties, and the save API's self-referential
 * `br_inventory_parent_listing_id` filter then fails) — this gate must not touch, mask, or
 * appear to repair that pre-existing bug.
 */
function bienesNegocioCanonicalActions(input: {
  row: Row;
  isChild: boolean;
  ownerUserId: string | null | undefined;
  lang: Lang;
  fallbackPublicUrl: string;
}): Map<string, DashboardAction> {
  const owner = input.ownerUserId?.trim();
  if (!owner) return new Map();

  const identityResult = buildListingIdentity({
    sourceTable: "listings",
    sourceId: input.row.id,
    category: "bienes-raices",
    pipeline: "bienes_raices_negocio",
    leonixAdId: input.row.leonix_ad_id ?? "",
    ownerUserId: owner,
    publicUrl: input.fallbackPublicUrl,
    parentSourceId: input.row.br_inventory_parent_listing_id ?? null,
    inventoryGroupId: input.row.br_inventory_group_id ?? null,
    inventoryRole: input.isChild ? "inventory_property" : "main",
  });
  if (!identityResult.ok) return new Map();

  const actions = resolveDashboardActions({
    identity: identityResult.identity,
    lifecycle: { status: input.row.status ?? "active" },
    entitlement: {},
    role: input.isChild ? "inventory_property" : "main",
    ownerVerified: true,
    lang: input.lang,
  });

  return new Map(actions.map((action) => [action.key, action]));
}

/**
 * Gate G.2.2 — small, generic severity-level message (not reason-specific — the global contract's
 * reason list is intentionally not exposed as free text yet, to avoid a premature copy commitment
 * ahead of a real designed attention UI in a later gate).
 */
function brLifecycleAttentionMessage(severity: AttentionSeverity, lang: Lang): string | null {
  if (severity === "urgent") return lang === "es" ? "Requiere atención urgente" : "Requires urgent attention";
  if (severity === "action_required") return lang === "es" ? "Requiere tu atención" : "Needs your attention";
  if (severity === "informational") return lang === "es" ? "Nota informativa" : "Informational note";
  return null;
}

function branchLabel(branch: LeonixClasificadosBranch, lang: Lang): string {
  const es: Record<LeonixClasificadosBranch, string> = {
    bienes_raices_privado: "BR · Privado",
    bienes_raices_negocio: "BR · Negocio",
    rentas_privado: "Rentas · Privado",
    rentas_negocio: "Rentas · Negocio",
  };
  const en: Record<LeonixClasificadosBranch, string> = {
    bienes_raices_privado: "RE · Private",
    bienes_raices_negocio: "RE · Business",
    rentas_privado: "Rentals · Private",
    rentas_negocio: "Rentals · Business",
  };
  return lang === "es" ? es[branch] : en[branch];
}

export function LeonixRealEstateListingManageCard({
  row,
  lang,
  busy,
  priceText,
  dateText,
  viewsTotal,
  messagesTotal,
  onPause,
  onResume,
  onArchive,
  onMarkSold,
  republishPrimaryLabel = null,
  onRepublish,
  republishBusy = false,
  parentLeonixAdIdByListingId = new Map<string, string>(),
  brNegocioInventoryRows,
  packageEntitlementBadge = null,
  lifecycle = null,
  renewalBusy = false,
  onRenew,
  ownerUserId = null,
}: {
  row: Row;
  lang: Lang;
  busy: boolean;
  priceText: string;
  dateText: string;
  viewsTotal: number;
  messagesTotal: number;
  onPause: () => void;
  onResume: () => void;
  onArchive: () => void;
  /** Mark sold — null/undefined hides the CTA. */
  onMarkSold?: () => void;
  /** Move to top / Republish — null hides republish CTA (ineligible or unknown). */
  republishPrimaryLabel?: string | null;
  onRepublish?: () => void;
  republishBusy?: boolean;
  parentLeonixAdIdByListingId?: ReadonlyMap<string, string>;
  brNegocioInventoryRows?: readonly BrPropertyInventoryRowLike[];
  /** Active listing_package_entitlements badge for this exact listing UUID. */
  packageEntitlementBadge?: DashboardEntitlementBadgePayload | null;
  lifecycle?: ListingLifecycleResolved | null;
  renewalBusy?: boolean;
  onRenew?: () => void;
  /** Gate D.2 — page-level authenticated owner id; required to source canonical resolver hrefs. */
  ownerUserId?: string | null;
}) {
  const lx = parseLeonixListingContract(row.detail_pairs);
  const inferredRentasBranch: LeonixClasificadosBranch | null =
    String(row.category ?? "").toLowerCase() === "rentas" && !lx.branch
      ? String(row.seller_type ?? "").toLowerCase() === "business"
        ? "rentas_negocio"
        : "rentas_privado"
      : null;
  const effectiveBranch: LeonixClasificadosBranch | null = lx.branch ?? inferredRentasBranch;
  if (!effectiveBranch) return null;

  const isBr = effectiveBranch === "bienes_raices_privado" || effectiveBranch === "bienes_raices_negocio";

  const rentasRx =
    String(row.category ?? "").toLowerCase() === "rentas" ? parseRentasDetailMachineRead(row.detail_pairs) : null;

  const planDisplay = resolveCategoryAdPlan({
    category: isBr ? "bienes-raices" : "rentas",
    sourceTable: "listings",
    detailPairs: row.detail_pairs,
    sellerType: row.seller_type,
  });
  const planLine = categoryAdPlanDisplayLabel(planDisplay, lang);
  const planField = listingPlanFieldLabel(lang);
  const planFoot = listingPlanFootnote(lang);
  const republishWindowActive = isListingRepublishWindowActive(row.republished_at);
  const st = String(row.status ?? "active").toLowerCase();
  const canPause = st === "active" && row.is_published !== false;
  const canResume = st === "paused" || st === "unpublished";

  // Gate D.2.2 / I.5.7A.1 — explicit parent/child detection for this Bienes Negocio row, mirroring
  // the established pattern in BrNegocioListingInventoryActions.tsx. Gates whether canonical
  // resolver Edit/Preview may be consumed below AND, as of Gate I.5.7A.1, whether the legacy
  // Edit/Preview href builders may be consumed at all: child rows (and any ambiguous non-main BR
  // Negocio role) no longer receive an Edit/Preview href of any kind — see Gate D.2.1/D.2.2's own
  // documented finding that the legacy hydration path re-includes the child as its own inventory
  // property. Only `isBrNegocioMainRow` rows may resolve an Edit/Preview href now.
  const isBrNegocioRow = effectiveBranch === "bienes_raices_negocio" && isBr && isBrNegocioListing(row as BrPropertyInventoryRowLike);
  const isBrNegocioChildRow = isBrNegocioRow && isBrInventoryProperty(row as BrPropertyInventoryRowLike);
  const isBrNegocioMainRow =
    isBrNegocioRow &&
    (isBrInventoryMainListing(row as BrPropertyInventoryRowLike) || (!isBrNegocioChildRow && !row.inventory_role));

  const legacyPublicViewHref =
    (row.category ?? "").toLowerCase() === "rentas"
      ? withRentasLandingLang(rentasListingPublicPath(row.id), lang)
      : leonixLiveAnuncioPath(row.id);

  const canonicalBrActions = isBrNegocioRow
    ? bienesNegocioCanonicalActions({
        row,
        isChild: isBrNegocioChildRow,
        ownerUserId,
        lang,
        fallbackPublicUrl: legacyPublicViewHref,
      })
    : new Map<string, DashboardAction>();

  // Gate G.2.2/G.2.3.5 — global status/attention/lifecycle-action pilot. Bienes Raíces Negocio
  // only (parent and child both), never Rentas or Bienes Raíces Privado. Navigation hrefs are
  // still never supplied to this input (Gate D remains the sole navigation-action source for
  // BR) — only `kind: "lifecycle"` descriptors are ever consumed from `actions` below. This
  // reuses the same `ownerUserId` presence check Gate D.2's `bienesNegocioCanonicalActions`
  // already established for this exact file.
  const brLifecycleContract = isBrNegocioRow
    ? (() => {
        const eligibilityInput = buildBienesRaicesEligibilityInput({
          canonicalListingId: row.id,
          ownerVerified: Boolean(ownerUserId?.trim()),
          internalStatus: row.status,
          isPublished: row.is_published,
          inventoryRole: row.inventory_role,
          now: new Date(),
        });
        return {
          status: resolveOwnerFacingStatus(eligibilityInput),
          attention: resolveAttentionState(eligibilityInput),
          actions: resolveEligibleGlobalActions(eligibilityInput).filter(
            (a): a is GlobalActionDescriptor => a.kind === "lifecycle",
          ),
        };
      })()
    : null;

  // Gate G.2.3.5 — only these four certified lifecycle action keys are ever bound to an existing
  // callback; any other descriptor key (there are none certified yet for BR) is simply never
  // looked up and therefore never rendered. `restore`/`republish` are never certified through
  // this contract for BR (see `bienesRaicesLifecycleAdapter.ts`), so they can never appear here
  // regardless of what `brLifecycleContract.actions` might otherwise contain.
  const brPauseAction = brLifecycleContract?.actions.find((a) => a.key === "pause") ?? null;
  const brResumeAction = brLifecycleContract?.actions.find((a) => a.key === "resume") ?? null;
  const brArchiveAction = brLifecycleContract?.actions.find((a) => a.key === "archive") ?? null;
  const brDiscontinueAction = brLifecycleContract?.actions.find((a) => a.key === "discontinue") ?? null;

  const fsboDashboardEditHref = `/dashboard/mis-anuncios/${encodeURIComponent(row.id)}/editar?lang=${lang}`;
  // Gate I.5.7A.1 — BR Negocio Edit/Preview are only ever resolved for `isBrNegocioMainRow`. A
  // child (or ambiguous non-main) row resolves to `undefined`/`null` instead of falling through to
  // the legacy `bienesListingEditHref`/`bienesListingPreviewHref` builders, which is what
  // previously let a child's own UUID reach the parent-level application hydration path. This does
  // not repair that legacy hydration path (still locked/out of scope) — it simply stops routing
  // BR Negocio child rows into it.
  const brDashboardEditHref =
    effectiveBranch === "bienes_raices_privado" && isBr
      ? fsboDashboardEditHref
      : effectiveBranch === "bienes_raices_negocio" && isBr
      ? isBrNegocioMainRow
        ? canonicalBrActions.get("edit")?.href ??
          bienesListingEditHref({
            lang,
            listingId: row.id,
            leonixAdId: row.leonix_ad_id,
            categoriaPropiedad: resolveBienesCategoriaFromDetailPairs(row.detail_pairs),
          })
        : undefined
      : effectiveBranch === "rentas_privado" || effectiveBranch === "rentas_negocio"
      ? rentasDashboardEditHref({
          branch: effectiveBranch,
          listingId: row.id,
          leonixAdId: row.leonix_ad_id,
          lang,
        })
      : scaffoldEditHref(effectiveBranch, lx.categoriaPropiedad);
  const brDashboardPreviewHref =
    effectiveBranch === "bienes_raices_privado" && isBr
      ? leonixLiveAnuncioPath(row.id)
      : effectiveBranch === "bienes_raices_negocio" && isBr
      ? isBrNegocioMainRow
        ? canonicalBrActions.get("preview")?.href ??
          bienesListingPreviewHref({
            lang,
            listingId: row.id,
            leonixAdId: row.leonix_ad_id,
            categoriaPropiedad: resolveBienesCategoriaFromDetailPairs(row.detail_pairs),
          })
        : undefined
      : null;

  const publicViewHref = isBrNegocioRow ? (canonicalBrActions.get("viewPublic")?.href ?? legacyPublicViewHref) : legacyPublicViewHref;

  return (
    <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-[#1E1810]">{row.title || "—"}</span>
            <span className="rounded-full bg-[#FBF7EF] px-2.5 py-0.5 text-[11px] font-bold text-[#5C4E2E]">
              {branchLabel(effectiveBranch, lang)}
            </span>
            {lx.operation ? (
              <span className="rounded-full border border-[#E8DFD0] px-2 py-0.5 text-[11px] font-semibold text-[#5C5346]">
                {lx.operation === "sale" ? (lang === "es" ? "Venta" : "Sale") : lang === "es" ? "Renta" : "Rent"}
              </span>
            ) : null}
            {lx.categoriaPropiedad ? (
              <span className="text-[11px] font-medium uppercase tracking-wide text-[#7A7164]">{lx.categoriaPropiedad}</span>
            ) : null}
            {canPause ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                {lang === "es" ? "Activo" : "Active"}
              </span>
            ) : canResume ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                {lang === "es" ? "Pausado / no público" : "Paused / hidden"}
              </span>
            ) : st === "removed" ? (
              <span className="rounded-full bg-[#E8DFD0] px-2.5 py-0.5 text-[11px] font-bold text-[#5C5346]">
                {lang === "es" ? "Archivado" : "Archived"}
              </span>
            ) : (
              <span className="rounded-full bg-[#E8DFD0] px-2.5 py-0.5 text-[11px] font-bold text-[#5C5346]">{st}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#5C5346]/90">
            {priceText}
            {(row.city || "").trim() ? ` · ${(row.city ?? "").trim()}` : ""}
            {dateText ? ` · ${dateText}` : ""}
          </p>
          {(row.leonix_ad_id ?? "").trim() ? (
            <p className="mt-1 font-mono text-[11px] text-[#7A7164]">
              {lang === "es" ? "ID Leonix" : "Leonix Ad ID"}: {(row.leonix_ad_id ?? "").trim()}
            </p>
          ) : null}
          {effectiveBranch === "bienes_raices_negocio" && isBrInventoryProperty(row as BrPropertyInventoryRowLike) ? (
            <p className="mt-1 text-xs font-semibold text-[#6E5418]">
              {lang === "es" ? "Propiedad de inventario" : "Inventory property"}
              {row.br_inventory_parent_listing_id
                ? (() => {
                    const pLeonix = parentLeonixAdIdByListingId.get(row.br_inventory_parent_listing_id!);
                    return pLeonix
                      ? ` · ${lang === "es" ? "Conectada a" : "Connected to"} ${pLeonix}`
                      : "";
                  })()
                : null}
            </p>
          ) : null}
          {isBr ? (
            <>
              <p className="mt-2 text-xs text-[#7A7164]">
                {lang === "es"
                  ? "Bienes raíces: el carril patrocinado solo aplica con un entitlement activo de paquete (print/digital). El spotlight editorial de negocios no es subasta por pago."
                  : "Real estate: the sponsored lane only applies with an active package entitlement (print/digital). The business editorial spotlight is not pay-to-win."}
                {republishWindowActive ? (
                  <span className="mt-1 block text-[11px] text-[#7A7164]/85">
                    {lang === "es"
                      ? "Nota: la ventana de visibilidad por republicación no sustituye el entitlement de paquete."
                      : "Note: republish visibility windows do not replace package entitlement."}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-xs text-[#7A7164]">
                <span className="font-semibold text-[#3D3428]">{planField}:</span> {planLine}
              </p>
              {packageEntitlementBadge &&
              (packageEntitlementBadge.grantsDestacado || packageEntitlementBadge.grantsResultsPriority) ? (
                <div className="mt-2 rounded-xl border border-[#C9B46A]/40 bg-[#FFF8E8]/90 px-3 py-2 text-xs text-[#3D3428]">
                  <p className="font-semibold text-[#6E5418]">
                    {packageEntitlementBadge.grantsDestacado
                      ? lang === "es"
                        ? "Colocación Destacado activa"
                        : "Destacado placement active"
                      : lang === "es"
                        ? "Colocación Prioridad (página completa) activa"
                        : "Full-page priority placement active"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#5C5346]">
                    {lang === "es" ? "Paquete" : "Package"}: {packageEntitlementBadge.tier}
                    {packageEntitlementBadge.endsAt
                      ? ` · ${lang === "es" ? "Vence" : "Ends"} ${new Date(packageEntitlementBadge.endsAt).toLocaleDateString(
                          lang === "es" ? "es-US" : "en-US",
                          { dateStyle: "medium" },
                        )}`
                      : ""}
                  </p>
                  {packageEntitlementBadge.startsAt ? (
                    <p className="mt-0.5 text-[11px] text-[#7A7164]">
                      {lang === "es" ? "Inicio" : "Starts"}{" "}
                      {new Date(packageEntitlementBadge.startsAt).toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
                        dateStyle: "medium",
                      })}
                    </p>
                  ) : null}
                </div>
              ) : isBr ? (
                <p className="mt-2 text-[11px] text-[#7A7164]">
                  {lang === "es"
                    ? "Sin colocación print/digital activa en este anuncio."
                    : "No active print/digital placement on this listing."}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-xs text-[#7A7164]">
              <span className="font-semibold text-[#3D3428]">{planField}:</span> {planLine}
              {republishWindowActive ? ` · ${lang === "es" ? "Visibilidad (republicación)" : "Visibility (republish)"}` : ""}
              {republishWindowActive ? (lang === "es" ? " (ventana activa)" : " (active window)") : ""}
            </p>
          )}
          <p className="mt-1 text-[10px] leading-snug text-[#7A7164]/90">{planFoot}</p>
          <p className="mt-1 text-sm text-[#7A7164]">
            {lang === "es" ? "Vistas" : "Views"}: {viewsTotal}
          </p>
          {rentasRx?.listingStatus ? (
            <p className="mt-1 text-xs font-semibold text-[#4A6680]">
              {lang === "es" ? "Disponibilidad (formulario)" : "Availability (form)"}: {rentasRx.listingStatus}
            </p>
          ) : null}
          {lifecycle ? <ListingLifecycleStatusCard lifecycle={lifecycle} lang={lang} /> : null}
          <p className="mt-2 text-[11px] leading-snug text-[#5C5346]/80">
            {lang === "es"
              ? "Ciclo: borrador local / listing_drafts → publicación → listado vivo en ruta canónica (no preview)."
              : "Lifecycle: local draft / listing_drafts → publish → live canonical route (not preview)."}
          </p>
          {brLifecycleContract ? (
            <p
              className={
                "mt-1 text-[11px] font-medium " +
                (brLifecycleContract.attention.severity === "urgent"
                  ? "text-red-700"
                  : brLifecycleContract.attention.severity === "action_required"
                  ? "text-amber-800"
                  : "text-[#7A7164]")
              }
            >
              {lang === "es" ? "Estado global" : "Global status"}:{" "}
              {lang === "es" ? brLifecycleContract.status.labelEs : brLifecycleContract.status.labelEn}
              {brLifecycleAttentionMessage(brLifecycleContract.attention.severity, lang)
                ? ` · ${brLifecycleAttentionMessage(brLifecycleContract.attention.severity, lang)}`
                : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {lifecycle ? (
            <ListingRenewalAction lifecycle={lifecycle} lang={lang} busy={renewalBusy} onRenew={onRenew} />
          ) : null}
          {republishPrimaryLabel && onRepublish ? (
            <button
              type="button"
              disabled={busy || republishBusy}
              onClick={onRepublish}
              title={
                "Updates republish timestamp and the visibility window in listings (separate from Promoted/Featured or Verify Leonix)."
              }
              className="rounded-xl bg-gradient-to-r from-[#E8D48A] to-[#C9A84A] px-4 py-2 text-sm font-bold text-[#1E1810] shadow-sm disabled:opacity-50"
            >
              {republishPrimaryLabel}
            </button>
          ) : null}
          <Link
            href={publicViewHref}
            prefetch={false}
            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
          >
            {publicViewLabel(lang)}
          </Link>
          {brDashboardEditHref ? (
            <Link
              href={brDashboardEditHref}
              prefetch={false}
              className="rounded-xl border border-[#C9B46A]/50 bg-[#FDFBF7] px-4 py-2 text-sm font-semibold text-[#1E1810]"
            >
              {editListingLabel(lang)}
            </Link>
          ) : null}
          {brDashboardPreviewHref ? (
            <Link
              href={brDashboardPreviewHref}
              prefetch={false}
              className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
            >
              {lang === "es" ? "Vista previa" : "Preview"}
            </Link>
          ) : null}
          {isBrNegocioRow ? (
            <>
              {/* Gate G.2.3.5 — certified global lifecycle descriptors replace the legacy
                  Pause/Resume/Mark Sold/Archive buttons for Bienes Raíces Negocio only. Each
                  button renders only when the global resolver actually produced that descriptor
                  (status + certified capability both agree); the existing secured callback,
                  loading state, and confirmation behavior (e.g. `onArchive`'s own confirm()
                  dialog) are reused unchanged — this file never adds a second confirmation. */}
              {brPauseAction ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onPause}
                  title={
                    lang === "es"
                      ? "Pausar: oculta el anuncio del público. No es archivar ni republicar."
                      : "Pause: hides the listing from the public. Not archive or republish."
                  }
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50"
                >
                  {lang === "es" ? brPauseAction.labelEs : brPauseAction.labelEn}
                </button>
              ) : null}
              {brResumeAction ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onResume}
                  title={
                    lang === "es"
                      ? "Reanudar: publicar de nuevo tras una pausa. No es lo mismo que Republicar."
                      : "Resume: publish again after a pause. Not the same as Republish or Move to top."
                  }
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
                >
                  {lang === "es" ? brResumeAction.labelEs : brResumeAction.labelEn}
                </button>
              ) : null}
              {brDiscontinueAction && onMarkSold ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onMarkSold}
                  title={
                    lang === "es"
                      ? "Marcar vendido: quita el anuncio del público. Requiere confirmación."
                      : "Mark sold: removes the listing from public results. Requires confirmation."
                  }
                  className="rounded-xl border border-[#C9B46A]/50 bg-[#FFF8E8] px-4 py-2 text-sm font-semibold text-[#5C4A28] disabled:opacity-50"
                >
                  {lang === "es" ? brDiscontinueAction.labelEs : brDiscontinueAction.labelEn}
                </button>
              ) : null}
              {brArchiveAction ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onArchive}
                  title={
                    lang === "es"
                      ? "Archivar: quita el anuncio del flujo activo (no borra datos ni ID Leonix). Puede rechazarse si hay propiedades activas."
                      : "Archive: removes the listing from active flow (does not delete data or Leonix Ad ID). May be rejected if active properties exist."
                  }
                  className="rounded-xl border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 disabled:opacity-50"
                >
                  {lang === "es" ? brArchiveAction.labelEs : brArchiveAction.labelEn}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy || !canPause}
                onClick={onPause}
                title={
                  lang === "es"
                    ? "Pausar: oculta el anuncio del público. No es archivar ni republicar."
                    : "Pause: hides the listing from the public. Not archive or republish."
                }
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50"
              >
                {pauseListingLabel(lang)}
              </button>
              <button
                type="button"
                disabled={busy || !canResume}
                onClick={onResume}
                title={
                  lang === "es"
                    ? "Restaurar: publicar de nuevo tras una pausa. No es lo mismo que Republicar."
                    : "Restore: publish again after a pause. Not the same as Republish or Move to top."
                }
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-50"
              >
                {resumeListingLabel(lang)}
              </button>
              {onMarkSold && canPause ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onMarkSold}
                  title={
                    lang === "es"
                      ? "Marcar vendido: quita el anuncio del público. Requiere confirmación."
                      : "Mark sold: removes the listing from public results. Requires confirmation."
                  }
                  className="rounded-xl border border-[#C9B46A]/50 bg-[#FFF8E8] px-4 py-2 text-sm font-semibold text-[#5C4A28] disabled:opacity-50"
                >
                  {lang === "es" ? "Marcar vendido" : "Mark sold"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy || st === "removed"}
                onClick={onArchive}
                title={
                  lang === "es"
                    ? "Archivar: quita el anuncio del flujo activo (no borra datos ni ID Leonix)."
                    : "Archive: removes the listing from active flow (does not delete data or Leonix Ad ID)."
                }
                className="rounded-xl border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 disabled:opacity-50"
              >
                {archiveListingLabel(lang)}
              </button>
            </>
          )}
        </div>
      </div>
      {effectiveBranch === "bienes_raices_negocio" && isBrNegocioListing(row as BrPropertyInventoryRowLike) ? (
        <BrNegocioListingInventoryActions
          lang={lang}
          row={row as BrPropertyInventoryRowLike}
          parentLeonixAdIdByListingId={parentLeonixAdIdByListingId}
          inventoryRows={brNegocioInventoryRows}
          ownerUserId={ownerUserId}
        />
      ) : null}
    </div>
  );
}
