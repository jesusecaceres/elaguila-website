import { Fragment } from "react";
import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminInputClass,
  adminPartialBadgeClass,
  adminReadOnlyBadgeClass,
  adminBtnDark,
  adminCtaChipCompact,
} from "../../_components/adminTheme";
import { getClasificadosCategoryRegistryMerged, summarizeRegistryForDashboard } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { fetchListingStatsForCategorySlugs } from "../../_lib/adminCategoryListingStats";
import { saveSiteCategoryConfigRowAction } from "../../siteCategoryConfigActions";
import {
  adminCategoryOpenQueueCtaCopy,
  adminCategoryWorkspaceQueueHref,
} from "../../_lib/adminCategoryWorkspaceQueueHref";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

export const dynamic = "force-dynamic";

function statusStyle(s: string) {
  switch (s) {
    case "live":
      return "bg-emerald-100 text-emerald-900";
    case "staged":
      return "bg-amber-100 text-amber-900";
    case "coming_soon":
      return "bg-sky-100 text-sky-900";
    case "hidden":
      return "bg-neutral-200 text-neutral-800";
    default:
      return "bg-[#FBF7EF] text-[#5C4E2E]";
  }
}

function readinessStyle(r: string) {
  if (r === "full") return "text-emerald-800";
  if (r === "partial") return "text-amber-800";
  return "text-[#7A7164]";
}

function sourceBadge(layer: "code" | "database" | undefined, codeLabel: string) {
  if (layer === "database") {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
        Supabase
      </span>
    );
  }
  return (
    <span className="rounded-full border border-[#E8DFD0] bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-[#6B5B2E]">
      {codeLabel}
    </span>
  );
}

const COL_COUNT = 12;

export default async function AdminCategoriesPage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const registry = await getClasificadosCategoryRegistryMerged();
  const sum = summarizeRegistryForDashboard(registry);
  const statsRows = await fetchListingStatsForCategorySlugs(registry.map((c) => c.slug));
  const statsBySlug = Object.fromEntries(statsRows.map((s) => [s.slug, s]));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminReadOnlyBadgeClass}>{m("categoriesPage.baseBadge")}</span>
        <span className={adminPartialBadgeClass}>{m("categoriesPage.postureBadge")}</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          {m("categoriesPage.statsBadge")}
        </span>
      </div>
      <AdminPageHeader
        title={m("categoriesPage.title")}
        subtitle={m("categoriesPage.subtitle")}
        helperText={m("categoriesPage.helperText")}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("categoriesPage.cardLiveLabel")}</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.live}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("categoriesPage.cardStagedLabel")}</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.staged}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("categoriesPage.cardComingSoonLabel")}</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.comingSoon}</p>
        </div>
      </div>

      <div className={`${adminCardBase} mb-6 space-y-3 p-4 text-sm text-[#5C5346] sm:p-5`}>
        <p className="font-bold text-[#1E1810]">{m("categoriesPage.shortcutsTitle")}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/admin/workspace/clasificados"
            className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}
            title={m("categoriesPage.ctaClasificadosTitle")}
          >
            {m("categoriesPage.ctaClasificados")}
          </Link>
          <Link
            href="/admin/reportes"
            className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}
            title={m("categoriesPage.ctaReportsTitle")}
          >
            {m("categoriesPage.ctaReports")}
          </Link>
          <Link
            href="/admin/ops"
            className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}
            title={m("categoriesPage.ctaOpsTitle")}
          >
            {m("categoriesPage.ctaOps")}
          </Link>
          <Link
            href="/admin/tienda/orders"
            className={`${adminCtaChipCompact} w-full justify-center sm:w-auto`}
            title={m("categoriesPage.ctaTiendaTitle")}
          >
            {m("categoriesPage.ctaTienda")}
          </Link>
        </div>
      </div>

      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-4 py-3 text-xs text-[#5C5346]">
          {m("categoriesPage.tableHintTop")}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse text-sm">
            <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="p-3"> </th>
                <th className="p-3">Slug</th>
                <th className="p-3">Display (ES)</th>
                <th className="p-3">Status</th>
                <th className="p-3">{m("categoriesPage.thSource")}</th>
                <th className="p-3">Readiness</th>
                <th className="p-3 whitespace-nowrap">Listings (DB)</th>
                <th className="p-3 whitespace-nowrap">Pending / flagged</th>
                <th className="p-3">{m("categoriesPage.thAdsQueue")}</th>
                <th className="p-3">Moderation</th>
                <th className="p-3">Landing</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {registry.map((c) => {
                const st = statsBySlug[c.slug];
                const openCta = adminCategoryOpenQueueCtaCopy(c.operationalStatus, lang);
                return (
                  <Fragment key={c.slug}>
                    <tr className="border-t border-[#E8DFD0]/80 align-top">
                      <td className="p-3 text-xl">{c.emoji}</td>
                      <td className="p-3 font-mono text-xs text-[#3D3428]">{c.slug}</td>
                      <td className="p-3 font-semibold text-[#1E1810]">
                        {c.displayNameEs}
                        {c.highlight ? (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                            Highlight
                          </span>
                        ) : null}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyle(c.operationalStatus)}`}
                        >
                          {c.operationalStatus.replace("_", " ")}
                        </span>
                        <div className="mt-1 text-[10px] font-semibold uppercase text-[#9A9084]">
                          vis: {c.visibility}
                        </div>
                      </td>
                      <td className="p-3">{sourceBadge(c.configLayer, m("categoriesPage.codeLayer"))}</td>
                      <td className={`p-3 text-xs font-semibold ${readinessStyle(c.readiness)}`}>{c.readiness}</td>
                      <td className="p-3 text-xs tabular-nums">
                        {st?.queryError ? (
                          <span title={st.queryError} className="text-amber-800">
                            —
                          </span>
                        ) : (
                          st?.totalListings ?? "—"
                        )}
                      </td>
                      <td className="p-3 text-xs tabular-nums">
                        {st?.queryError ? "—" : (st?.pendingOrFlagged ?? "—")}
                      </td>
                      <td className="p-3 text-xs font-bold">
                        <Link
                          href={adminCategoryWorkspaceQueueHref(c.slug)}
                          className={`${adminCtaChipCompact} inline-flex w-full justify-center text-center`}
                          aria-label={`${c.displayNameEs}: ${openCta.label}`}
                          title={openCta.title}
                        >
                          {openCta.label} →
                        </Link>
                      </td>
                      <td className="p-3 text-xs font-bold">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/admin/workspace/clasificados?category=${encodeURIComponent(c.slug)}&status=pending`}
                            className="text-[#6B5B2E] underline"
                            title={m("categoriesPage.pendingOnlyTitle")}
                          >
                            Pending →
                          </Link>
                          <Link
                            href={`/admin/workspace/clasificados?category=${encodeURIComponent(c.slug)}&status=flagged`}
                            className="text-[#6B5B2E] underline"
                            title={m("categoriesPage.flaggedOnlyTitle")}
                          >
                            Flagged →
                          </Link>
                        </div>
                      </td>
                      <td className="p-3">
                        <Link
                          href={c.landingTarget}
                          className="text-xs font-bold text-[#6B5B2E] underline"
                          target="_blank"
                        >
                          {c.landingTarget}
                        </Link>
                      </td>
                      <td className="max-w-xs p-3 text-xs text-[#5C5346]/95">{c.notes}</td>
                    </tr>
                    <tr className="border-t border-dashed border-[#E8DFD0]/90 bg-[#FAF7F2]/50 align-top">
                      <td colSpan={COL_COUNT} className="p-4">
                        <form action={saveSiteCategoryConfigRowAction} className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                          <input type="hidden" name="slug" value={c.slug} />
                          <div className="min-w-[140px] flex-1">
                            <label className="mb-1 block text-[10px] font-bold uppercase text-[#7A7164]">
                              {m("categoriesPage.operationalStatusLabel")}
                            </label>
                            <select
                              name="operational_status"
                              defaultValue={c.operationalStatus}
                              className={adminInputClass}
                            >
                              <option value="live">live</option>
                              <option value="staged">staged</option>
                              <option value="coming_soon">coming_soon</option>
                              <option value="hidden">hidden</option>
                            </select>
                          </div>
                          <div className="min-w-[120px] flex-1">
                            <label className="mb-1 block text-[10px] font-bold uppercase text-[#7A7164]">
                              {m("categoriesPage.visibilityLabel")}
                            </label>
                            <select name="visibility" defaultValue={c.visibility} className={adminInputClass}>
                              <option value="public">public</option>
                              <option value="hidden">hidden</option>
                            </select>
                          </div>
                          <div className="w-28">
                            <label className="mb-1 block text-[10px] font-bold uppercase text-[#7A7164]">
                              {m("categoriesPage.sortOrderLabel")}
                            </label>
                            <input
                              type="number"
                              name="sort_order"
                              defaultValue={c.sortOrder}
                              className={adminInputClass}
                            />
                          </div>
                          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#E8DFD0] bg-white/90 px-3 py-2 text-xs font-semibold text-[#1E1810]">
                            <input type="checkbox" name="highlight" value="true" defaultChecked={Boolean(c.highlight)} />
                            {m("categoriesPage.highlightLabel")}
                          </label>
                          <div className="min-w-[200px] flex-[2]">
                            <label className="mb-1 block text-[10px] font-bold uppercase text-[#7A7164]">
                              {m("categoriesPage.notesLabel")}
                            </label>
                            <input
                              type="text"
                              name="notes"
                              defaultValue={c.overlayNotes ?? ""}
                              placeholder={m("categoriesPage.notesPlaceholder")}
                              className={adminInputClass}
                            />
                          </div>
                          <button
                            type="submit"
                            className={adminBtnDark}
                            title={m("categoriesPage.saveButtonTitle")}
                          >
                            {m("categoriesPage.saveButton")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#7A7164]">
        {m("categoriesPage.footerPart1")}{" "}
        <code className="rounded bg-[#FBF7EF] px-1">sort_order</code> {m("categoriesPage.footerPart2")}{" "}
        <code className="rounded bg-[#FBF7EF] px-1">categoryConfig</code>
        {m("categoriesPage.footerPart3")}
      </p>
    </div>
  );
}
