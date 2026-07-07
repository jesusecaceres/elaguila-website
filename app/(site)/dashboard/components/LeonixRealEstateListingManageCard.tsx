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
  isBrInventoryProperty,
  isBrNegocioListing,
  type BrPropertyInventoryRowLike,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import type { Lang } from "@/app/(site)/dashboard/lib/dashboardI18n";

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
  republishPrimaryLabel = null,
  onRepublish,
  republishBusy = false,
  parentLeonixAdIdByListingId = new Map<string, string>(),
  brNegocioInventoryRows,
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
  /** Move to top / Republish — null hides republish CTA (ineligible or unknown). */
  republishPrimaryLabel?: string | null;
  onRepublish?: () => void;
  republishBusy?: boolean;
  parentLeonixAdIdByListingId?: ReadonlyMap<string, string>;
  brNegocioInventoryRows?: readonly BrPropertyInventoryRowLike[];
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

  const brNegocioDashboardEditHref =
    effectiveBranch === "bienes_raices_negocio" && isBr
      ? bienesListingEditHref({
          lang,
          listingId: row.id,
          leonixAdId: row.leonix_ad_id,
          categoriaPropiedad: resolveBienesCategoriaFromDetailPairs(row.detail_pairs),
        })
      : scaffoldEditHref(effectiveBranch, lx.categoriaPropiedad);
  const brNegocioDashboardPreviewHref =
    effectiveBranch === "bienes_raices_negocio" && isBr
      ? bienesListingPreviewHref({
          lang,
          listingId: row.id,
          leonixAdId: row.leonix_ad_id,
          categoriaPropiedad: resolveBienesCategoriaFromDetailPairs(row.detail_pairs),
        })
      : null;

  const publicViewHref =
    (row.category ?? "").toLowerCase() === "rentas"
      ? withRentasLandingLang(rentasListingPublicPath(row.id), lang)
      : leonixLiveAnuncioPath(row.id);

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
                  ? "Bienes raíces: la parrilla principal ordena por frescura (publicación o republicación). El carril “spotlight” de negocios es limitado y editorial — no es subasta por pago en el grid."
                  : "Real estate: the main grid sorts by freshness (publish or republish). The business spotlight band is limited and editorial — not pay-to-win grid ranking."}
                {republishWindowActive ? (
                  <span className="mt-1 block text-[11px] text-[#7A7164]/85">
                    {lang === "es"
                      ? "Nota: la ventana de visibilidad por republicación no sustituye el ranking por frescura en Leonix."
                      : "Note: republish visibility windows do not override freshness-based ranking on Leonix."}
                  </span>
                ) : null}
              </p>
              <p className="mt-2 text-xs text-[#7A7164]">
                <span className="font-semibold text-[#3D3428]">{planField}:</span> {planLine}
              </p>
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
          <p className="mt-2 text-[11px] leading-snug text-[#5C5346]/80">
            {lang === "es"
              ? "Ciclo: borrador local / listing_drafts → publicación → listado vivo en ruta canónica (no preview)."
              : "Lifecycle: local draft / listing_drafts → publish → live canonical route (not preview)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
          >
            {publicViewLabel(lang)}
          </Link>
          <Link
            href={brNegocioDashboardEditHref}
            className="rounded-xl border border-[#C9B46A]/50 bg-[#FDFBF7] px-4 py-2 text-sm font-semibold text-[#1E1810]"
          >
            {editListingLabel(lang)}
          </Link>
          {brNegocioDashboardPreviewHref ? (
            <Link
              href={brNegocioDashboardPreviewHref}
              className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
            >
              {lang === "es" ? "Vista previa" : "Preview"}
            </Link>
          ) : null}
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
        </div>
      </div>
      {effectiveBranch === "bienes_raices_negocio" && isBrNegocioListing(row as BrPropertyInventoryRowLike) ? (
        <BrNegocioListingInventoryActions
          lang={lang}
          row={row as BrPropertyInventoryRowLike}
          parentLeonixAdIdByListingId={parentLeonixAdIdByListingId}
          inventoryRows={brNegocioInventoryRows}
        />
      ) : null}
    </div>
  );
}
