"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteListingAction, setListingPublishedAction } from "../../../actions";
import { useState } from "react";
import { adminTableWrap } from "../../../_components/adminTheme";
import { listingPlanFromDetailPairs } from "@/app/dashboard/lib/dashboardListingMeta";
import {
  computeEnVentaVisibilityRenewalVm,
  EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL,
  parseBoostExpiresMs,
  parseDetailPairValue,
} from "@/app/clasificados/en-venta/boosts/enVentaVisibilityRenewal";
import { parseLeonixListingContract, parseLeonixMachineFacetRead } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { useAdminLang, useAdminT } from "@/app/admin/_components/AdminI18nProvider";
import { ClassifiedAdminRowActions } from "./_components/ClassifiedAdminRowActions";

type Row = {
  id: string;
  leonix_ad_id?: string | null;
  title: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  price: number | null;
  is_free: boolean | null;
  status: string | null;
  owner_id: string | null;
  created_at: string | null;
  images?: unknown;
  detail_pairs?: unknown;
  boost_expires?: unknown;
  is_published?: boolean | null;
  leonix_verified?: boolean | null;
  admin_promoted?: boolean | null;
};

export type AdminListingsTableRow = Row;

function formatAdminDateTime(ms: number, locale: string): string {
  try {
    const d = new Date(ms);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  } catch {
    return "—";
  }
}

function leonixAdminLine(row: Row, detailPairsAvailable: boolean): string {
  if (!detailPairsAvailable) return "—";
  const lx = parseLeonixListingContract(row.detail_pairs);
  const parts: string[] = [];
  if (lx.branch) parts.push(lx.branch);
  if (lx.operation) parts.push(lx.operation);
  if (lx.categoriaPropiedad) parts.push(lx.categoriaPropiedad);
  const pub =
    row.is_published === false ? "is_published=false" : row.is_published === true ? "is_published=true" : "pub=?";
  if (!parts.length) return row.is_published === false ? pub : "—";
  return `${parts.join(" · ")} · ${pub}`;
}

function clasificadosLeonixAdminLine(row: Row, detailPairsAvailable: boolean): string {
  const base = leonixAdminLine(row, detailPairsAvailable);
  if (!detailPairsAvailable) return base;
  const cat = (row.category ?? "").toLowerCase();
  if (cat === "rentas") {
    const rx = parseRentasDetailMachineRead(row.detail_pairs);
    const bits: string[] = [];
  if (rx.leaseTermCode) bits.push(`lease:${rx.leaseTermCode}`);
  if (rx.depositUsdDigits) bits.push(`dep:${rx.depositUsdDigits}`);
  if (rx.listingStatus) bits.push(`avail:${rx.listingStatus}`);
  if (rx.mapUrl) bits.push("map");
  if (rx.videoUrl) bits.push("video");
  if (rx.halfBathsDigits) bits.push(`½:${rx.halfBathsDigits}`);
  if (rx.servicesIncluded) bits.push("services:…");
  if (rx.businessWebsite) bits.push("web");
  if (rx.businessSocial) bits.push("social");
  return bits.length ? `${base} · ${bits.join(" · ")}` : base;
  }
  if (cat === "bienes-raices") {
    const br = parseLeonixMachineFacetRead(row.detail_pairs);
    const bits: string[] = [];
    if (br.resultsPropertyKind) bits.push(`kind:${br.resultsPropertyKind}`);
    if (br.bedroomsCount != null) bits.push(`bd:${br.bedroomsCount}`);
    if (br.bathroomsCount != null) bits.push(`ba:${br.bathroomsCount}`);
    if (br.postalCode) bits.push(`zip:${br.postalCode}`);
    if (br.pool === true) bits.push("pool");
    if (br.petsAllowed === true) bits.push("pets");
    else if (br.petsAllowed === false) bits.push("pets:no");
    if (br.furnished === true) bits.push("furn");
    return bits.length ? `${base} · ${bits.join(" · ")}` : base;
  }
  return base;
}

function enVentaVisibilityAdminLine(
  row: Row,
  detailPairsAvailable: boolean,
  boostExpiresAvailable: boolean,
  t: (key: string, vars?: Record<string, string | number>) => string,
  locale: string,
): string {
  if ((row.category ?? "").toLowerCase() !== "en-venta") return "—";
  if (!detailPairsAvailable) return t("listings.envLine.missingDetailPairs");
  const plan = listingPlanFromDetailPairs(row.detail_pairs);
  const now = Date.now();
  const boostPart = !boostExpiresAvailable
    ? t("listings.envLine.boostNoCol")
    : (() => {
        const boostEnd = parseBoostExpiresMs(row.boost_expires);
        return boostEnd != null && boostEnd > now
          ? `boost ${formatAdminDateTime(boostEnd, locale)}`
          : t("listings.envLine.boostOff");
      })();
  const lastIso = parseDetailPairValue(row.detail_pairs, EN_VENTA_VISIBILITY_LAST_RENEWAL_LABEL);
  const lastPart = lastIso
    ? `${t("listings.envLine.lastRenew")} ${formatAdminDateTime(new Date(lastIso).getTime(), locale)}`
    : `${t("listings.envLine.lastRenew")} —`;

  if (plan === "free") return `free · ${boostPart} · ${lastPart}`;

  const renewPart = !boostExpiresAvailable
    ? t("listings.envLine.renewNd")
    : (() => {
        const vm = computeEnVentaVisibilityRenewalVm({
          plan: "pro",
          boostExpires: row.boost_expires,
          detailPairs: row.detail_pairs,
          nowMs: now,
        });
        return vm?.canRenewNow
          ? t("listings.envLine.renewOk")
          : vm
            ? `renew≥ ${formatAdminDateTime(vm.nextRenewEligibleAt, locale)}`
            : t("listings.envLine.renewDash");
      })();

  return `pro · ${boostPart} · ${lastPart} · ${renewPart}`;
}

export default function AdminListingsTable({
  listings,
  detailPairsAvailable = true,
  boostExpiresAvailable = true,
  listingsCategorySlug,
  staffQueueMode = false,
}: {
  listings: Row[];
  /** When false, DB has no `listings.detail_pairs` — En Venta visibility column is degraded. */
  detailPairsAvailable?: boolean;
  /** When false, select omitted `listings.boost_expires` — boost/renew lines are degraded. */
  boostExpiresAvailable?: boolean;
  /** Active `?category=` filter (registry slug), for empty-state copy. */
  listingsCategorySlug?: string;
  /** Restaurante-style staff PATCH actions (Leonix ops). */
  staffQueueMode?: boolean;
}) {
  const router = useRouter();
  const t = useAdminT();
  const lang = useAdminLang();
  const locale = lang === "es" ? "es-MX" : "en-US";
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishBusyId, setPublishBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm(t("listings.confirmDelete"))) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteListingAction(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("listings.errDelete"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPublished(id: string, published: boolean) {
    const msg = published ? t("listings.confirmShow") : t("listings.confirmHide");
    if (!confirm(msg)) return;
    setPublishBusyId(id);
    setError(null);
    try {
      await setListingPublishedAction(id, published);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("listings.errPublish"));
    } finally {
      setPublishBusyId(null);
    }
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return Number.isFinite(d.getTime())
        ? d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";
    } catch {
      return "—";
    }
  }

  if (listings.length === 0) {
    return (
      <div
        className={`rounded-2xl border p-6 text-sm ${
          listingsCategorySlug ? "border-amber-200/90 bg-amber-50/90 text-amber-950" : "border-[#E8DFD0] bg-[#FAF7F2]/80 text-[#5C5346]"
        }`}
        role="status"
      >
        {listingsCategorySlug ? (
          <>
            <p className="font-bold text-[#1E1810]">{t("listings.emptyCategoryTitle")}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
              {t("listings.emptyCategoryBody", {
                slug: listingsCategorySlug,
                rentasExtra: listingsCategorySlug === "rentas" ? t("listings.emptyRentasExtra") : "",
              })}
            </p>
          </>
        ) : (
          t("listings.emptyGlobal")
        )}
      </div>
    );
  }

  const enVentaColumnDegraded = !detailPairsAvailable || !boostExpiresAvailable;
  const envVisTitle = !detailPairsAvailable
    ? t("listings.col.envVisTitleNoDetailPairs")
    : !boostExpiresAvailable
      ? t("listings.col.envVisTitleNoBoost")
      : t("listings.col.envVisTitleOk");

  return (
    <div className={adminTableWrap}>
      {error && <div className="border-b border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90">
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.id")}</th>
              <th className="min-w-[9rem] p-3 font-semibold text-[#5C4E2E]">{t("listings.col.leonixId")}</th>
              <th className="min-w-[180px] p-3 font-semibold text-[#5C4E2E]">{t("listings.col.title")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.category")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.city")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.price")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.status")}</th>
              {staffQueueMode ? (
                <>
                  <th className="p-3 font-semibold text-[#5C4E2E]">Dest.</th>
                  <th className="p-3 font-semibold text-[#5C4E2E]">Verif.</th>
                </>
              ) : null}
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.owner")}</th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.date")}</th>
              <th
                className={
                  detailPairsAvailable
                    ? "min-w-[200px] p-3 font-semibold text-[#5C4E2E]"
                    : "min-w-[200px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                }
                title={t("listings.col.leonixTitle")}
              >
                {t("listings.col.leonix")}
              </th>
              <th
                className={
                  enVentaColumnDegraded
                    ? "min-w-[220px] bg-amber-50/90 p-3 font-semibold text-amber-950"
                    : "min-w-[220px] p-3 font-semibold text-[#5C4E2E]"
                }
                title={envVisTitle}
              >
                {t("listings.col.envVis")}
              </th>
              <th className="p-3 font-semibold text-[#5C4E2E]">{t("listings.col.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((row) => (
              <tr key={row.id} className="border-b border-[#E8DFD0]/60">
                <td className="p-3 font-mono text-xs text-[#3D3428]">{row.id.slice(0, 8)}…</td>
                <td className="max-w-[10rem] truncate p-3 font-mono text-[10px] text-[#3D3428]" title={row.leonix_ad_id ?? ""}>
                  {row.leonix_ad_id ?? "—"}
                </td>
                <td className="max-w-[200px] truncate p-3 text-[#1E1810]" title={row.title ?? ""}>
                  {row.title ?? "—"}
                </td>
                <td className="p-3">
                  <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-xs font-semibold text-[#5C4E2E]">
                    {row.category ?? "—"}
                  </span>
                </td>
                <td className="p-3 text-[#3D3428]">{row.city ?? "—"}</td>
                <td className="p-3">{row.is_free ? t("listings.free") : row.price != null ? `$${row.price}` : "—"}</td>
                <td className="p-3">
                  <span
                    className={
                      row.status === "removed"
                        ? "text-red-700"
                        : row.status === "pending" || row.status === "flagged"
                          ? "font-bold text-amber-800"
                          : "text-[#5C5346]"
                    }
                  >
                    {row.status ?? "active"}
                  </span>
                </td>
                {staffQueueMode ? (
                  <>
                    <td className="p-3">{row.admin_promoted ? t("autosQueue.yes") : t("autosQueue.no")}</td>
                    <td className="p-3">{row.leonix_verified ? t("autosQueue.yes") : t("autosQueue.no")}</td>
                  </>
                ) : null}
                <td className="p-3">
                  {row.owner_id ? (
                    <Link
                      href={`/admin/usuarios/${row.owner_id}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center text-xs font-semibold text-[#6B5B2E] underline sm:min-h-0 sm:min-w-0"
                      title={t("listings.ownerCard")}
                    >
                      {t("listings.ownerCard")}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-[#7A7164]">{formatDate(row.created_at)}</td>
                <td
                  className={
                    detailPairsAvailable
                      ? "max-w-[240px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                      : "max-w-[240px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                  }
                  title={clasificadosLeonixAdminLine(row, detailPairsAvailable)}
                >
                  {clasificadosLeonixAdminLine(row, detailPairsAvailable)}
                </td>
                <td
                  className={
                    enVentaColumnDegraded
                      ? "max-w-[280px] bg-amber-50/40 p-3 align-top text-[11px] leading-snug text-amber-950"
                      : "max-w-[280px] p-3 align-top text-[11px] leading-snug text-[#5C5346]"
                  }
                  title={enVentaVisibilityAdminLine(row, detailPairsAvailable, boostExpiresAvailable, t, locale)}
                >
                  {enVentaVisibilityAdminLine(row, detailPairsAvailable, boostExpiresAvailable, t, locale)}
                </td>
                <td className="p-3">
                  <div
                    className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1"
                    title={t("listings.rowActionsTitle")}
                  >
                    {(row.category ?? "").toLowerCase() === "rentas" ? (
                      <Link
                        href={rentasListingPublicPath(row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center font-semibold text-[#6B5B2E] underline sm:min-h-0"
                        title={t("listings.publicRentasTitle")}
                      >
                        {t("listings.viewRentas")}
                      </Link>
                    ) : (
                      <Link
                        href={`/clasificados/anuncio/${row.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center font-semibold text-[#6B5B2E] underline sm:min-h-0"
                        title={t("listings.publicGenericTitle")}
                      >
                        {t("listings.viewPublic")}
                      </Link>
                    )}
                    {(row.category ?? "").toLowerCase() === "rentas" ? (
                      <Link
                        href={`/admin/workspace/clasificados/rentas/${row.id}`}
                        className="inline-flex min-h-[44px] items-center font-semibold text-[#4A6680] underline sm:min-h-0"
                        title={t("listings.inspectorRentas")}
                      >
                        {t("listings.inspectorRentas")}
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/workspace/clasificados/listings/${encodeURIComponent(row.id)}/edit`}
                      className="inline-flex min-h-[44px] items-center font-semibold text-[#1E1810] underline sm:min-h-0"
                    >
                      Editar
                    </Link>
                    {staffQueueMode ? (
                      <ClassifiedAdminRowActions
                        variant="listings"
                        rowId={row.id}
                        publicLive={
                          row.is_published === true && (row.status ?? "active").toLowerCase() === "active"
                        }
                        promoted={Boolean(row.admin_promoted)}
                        verified={Boolean(row.leonix_verified)}
                        canArchive={(row.status ?? "").toLowerCase() !== "removed"}
                      />
                    ) : (
                      <>
                        {row.status !== "removed" && row.is_published !== false ? (
                          <button
                            type="button"
                            disabled={publishBusyId === row.id}
                            onClick={() => void handleSetPublished(row.id, false)}
                            className="min-h-[44px] text-left text-sm font-semibold text-amber-900 hover:underline disabled:opacity-50 sm:min-h-0"
                            title={t("listings.hidePublicTitle")}
                          >
                            {publishBusyId === row.id ? "…" : t("listings.hidePublic")}
                          </button>
                        ) : null}
                        {row.status !== "removed" && row.is_published === false ? (
                          <button
                            type="button"
                            disabled={publishBusyId === row.id}
                            onClick={() => void handleSetPublished(row.id, true)}
                            className="min-h-[44px] text-left text-sm font-semibold text-emerald-900 hover:underline disabled:opacity-50 sm:min-h-0"
                            title={t("listings.republishTitle")}
                          >
                            {publishBusyId === row.id ? "…" : t("listings.republish")}
                          </button>
                        ) : null}
                        {row.status !== "removed" && (
                          <button
                            type="button"
                            disabled={deletingId === row.id}
                            onClick={() => handleDelete(row.id)}
                            className="min-h-[44px] text-left text-sm font-semibold text-red-700 hover:underline disabled:opacity-50 sm:min-h-0"
                            title={t("listings.deleteTitle")}
                            aria-label={t("listings.deleteAria")}
                          >
                            {deletingId === row.id ? "…" : t("listings.deleteStaff")}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
