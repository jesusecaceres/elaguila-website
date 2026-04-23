"use client";

import Link from "next/link";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  leonixLiveAnuncioPath,
  parseLeonixListingContract,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import {
  isListingBoosted,
  leonixPromotedFromDetailPairs,
  listingPlanFromDetailPairs,
} from "@/app/dashboard/lib/dashboardListingMeta";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";

type Lang = "es" | "en";

type Row = {
  id: string;
  title?: string | null;
  price?: number | string | null;
  city?: string | null;
  status?: string | null;
  created_at?: string | null;
  /** Used for Rentas-specific dashboard lines (e.g. availability from detail_pairs). */
  category?: string | null;
  /** Fallback when `Leonix:branch` is missing on older rows but `category` is rentas. */
  seller_type?: string | null;
  detail_pairs?: unknown;
  boost_expires?: unknown;
  is_published?: boolean | null;
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
  onUnpublish,
  onDelete,
}: {
  row: Row;
  lang: Lang;
  busy: boolean;
  priceText: string;
  dateText: string;
  viewsTotal: number;
  messagesTotal: number;
  onUnpublish: () => void;
  onDelete: () => void;
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

  const plan = listingPlanFromDetailPairs(row.detail_pairs);
  const boosted = isListingBoosted(row.boost_expires);
  const promoted = leonixPromotedFromDetailPairs(row.detail_pairs);
  const st = String(row.status ?? "active").toLowerCase();
  const isUnpublished = st === "unpublished" || row.is_published === false;

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
            {isUnpublished ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                {lang === "es" ? "Despublicado / borrador" : "Unpublished"}
              </span>
            ) : st === "active" ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900">
                {lang === "es" ? "Activo" : "Active"}
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
          {isBr ? (
            <p className="mt-2 text-xs text-[#7A7164]">
              {lang === "es"
                ? "Bienes raíces: la parrilla principal ordena por frescura (publicación o republicación). El carril “spotlight” de negocios es limitado y editorial — no es subasta por pago en el grid."
                : "Real estate: the main grid sorts by freshness (publish or republish). The business spotlight band is limited and editorial — not pay-to-win grid ranking."}
              {boosted || promoted ? (
                <span className="mt-1 block text-[11px] text-[#7A7164]/85">
                  {lang === "es"
                    ? "Nota: pueden existir marcas legacy de promo/boost en datos; no definen ranking BR en Leonix."
                    : "Note: legacy promo/boost flags may exist in data; they do not define BR ranking on Leonix."}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#7A7164]">
              {lang === "es" ? "Plan" : "Plan"}: {plan}
              {boosted || promoted ? ` · ${lang === "es" ? "Visibilidad / promo" : "Visibility / promo"}` : ""}
              {boosted ? " (boost)" : ""}
              {promoted ? " (Leonix:promoted)" : ""}
            </p>
          )}
          <p className="mt-1 text-sm text-[#7A7164]">
            {lang === "es" ? "Vistas" : "Views"}: {viewsTotal} · {lang === "es" ? "Mensajes" : "Messages"}: {messagesTotal}
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
          <Link
            href={publicViewHref}
            className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416]"
          >
            {lang === "es" ? "Ver público" : "Live"}
          </Link>
          <Link
            href={scaffoldEditHref(effectiveBranch, lx.categoriaPropiedad)}
            className="rounded-xl border border-[#C9B46A]/50 bg-[#FDFBF7] px-4 py-2 text-sm font-semibold text-[#1E1810]"
          >
            {lang === "es" ? "Editar (flujo)" : "Edit flow"}
          </Link>
          <button
            type="button"
            disabled={busy || isUnpublished}
            onClick={onUnpublish}
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-50"
          >
            {lang === "es" ? "Despublicar" : "Unpublish"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 disabled:opacity-50"
          >
            {lang === "es" ? "Eliminar" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
