import Link from "next/link";
import type { ReactNode } from "react";

import type { AdminLang } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  adminFilterHiddenParams,
  adminQueueLimitChoices,
  adminStatusOptionsWithCurrent,
  type AdminStatusOption,
} from "../../_lib/adminNormalizedShell";

/** Names of the form fields this bar owns (they are replaced, never duplicated, on submit). */
export const ADMIN_FILTER_BAR_FIELD_NAMES = ["q", "status", "owner", "leonix_ad_id", "limit"] as const;

export type AdminCategoryFilterBarProps = {
  lang?: AdminLang;
  /** Form action — the category workspace path, e.g. `/admin/workspace/clasificados/rentas`. */
  action: string;
  /** The page's current search params (server pages get them from `searchParams`). */
  searchParams: Record<string, string | string[] | undefined>;
  /** Real status values for this category — see `adminStatusOptionsForCategory(slug)`. */
  statusOptions: AdminStatusOption[];
  /** Where "Clear" goes (the unfiltered queue, keeping scope/lane if the page wants that). */
  clearHref: string;
  /**
   * Category-specific extra fields (Ofertas term/lane, Autos lane, Empleos applications …). Render
   * `<label>` + `<select|input name="…">` children; list their names in `extraFieldNames` so the
   * bar does not also carry them as hidden inputs.
   */
  children?: ReactNode;
  extraFieldNames?: readonly string[];
  /** Hide standard fields a category does not support. Default: all shown. */
  hide?: { status?: boolean; owner?: boolean; leonixAdId?: boolean };
  searchPlaceholder?: string;
  className?: string;
};

function first(v: string | string[] | undefined): string {
  return (typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "").trim();
}

const FIELD = "rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#1E1810] min-h-[40px]";

/**
 * FILTER BAR — Search (q), Status (real statuses, a `<select>`), Owner, Leonix Ad ID, a Limit
 * selector, then category-specific fields via `children`. A plain GET form, so it works in server
 * pages; every other query param (scope, lane, …) is preserved through hidden inputs.
 */
export function AdminCategoryFilterBar({
  lang = "en",
  action,
  searchParams,
  statusOptions,
  clearHref,
  children,
  extraFieldNames = [],
  hide,
  searchPlaceholder,
  className,
}: AdminCategoryFilterBarProps) {
  const q = first(searchParams.q);
  const status = first(searchParams.status);
  const owner = first(searchParams.owner);
  const leonixAdId = first(searchParams.leonix_ad_id);
  const { current: limit, choices } = adminQueueLimitChoices(first(searchParams.limit) || undefined);
  const hidden = adminFilterHiddenParams(searchParams, [...ADMIN_FILTER_BAR_FIELD_NAMES, ...extraFieldNames]);
  const options = adminStatusOptionsWithCurrent(statusOptions, status);

  return (
    <div className={`${adminCardBase} space-y-3 p-4 text-sm text-[#5C5346] ${className ?? ""}`} data-testid="admin-category-filter-bar">
      <p className="font-bold text-[#1E1810]">{adminTr(lang, "catShell.filter.title")}</p>
      <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action={action}>
        {hidden.map((h) => (
          <input key={h.name} type="hidden" name={h.name} value={h.value} />
        ))}
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs">
          <span className="font-semibold text-[#5C5346]">{adminTr(lang, "catShell.filter.search")}</span>
          <input
            name="q"
            defaultValue={q}
            className={`${FIELD} font-mono`}
            placeholder={searchPlaceholder ?? adminTr(lang, "catShell.filter.searchPlaceholder")}
            autoComplete="off"
          />
        </label>
        {hide?.status ? null : (
          <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{adminTr(lang, "catShell.filter.status")}</span>
            <select name="status" defaultValue={status} className={FIELD}>
              <option value="">{adminTr(lang, "catShell.filter.statusAll")}</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {hide?.owner ? null : (
          <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{adminTr(lang, "catShell.filter.owner")}</span>
            <input name="owner" defaultValue={owner} className={`${FIELD} font-mono`} autoComplete="off" />
          </label>
        )}
        {hide?.leonixAdId ? null : (
          <label className="flex min-w-[9rem] flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{adminTr(lang, "catShell.filter.leonixAdId")}</span>
            <input name="leonix_ad_id" defaultValue={leonixAdId} className={`${FIELD} font-mono`} autoComplete="off" />
          </label>
        )}
        {children}
        <label className="flex min-w-[6rem] flex-col gap-1 text-xs">
          <span className="font-semibold text-[#5C5346]">{adminTr(lang, "catShell.filter.limit")}</span>
          <select name="limit" defaultValue={String(limit)} className={FIELD}>
            {choices.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="min-h-[40px] rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]">
          {adminTr(lang, "common.apply")}
        </button>
        <Link href={clearHref} className={`${adminBtnSecondary} inline-flex min-h-[40px] items-center text-xs`}>
          {adminTr(lang, "common.clear")}
        </Link>
      </form>
    </div>
  );
}
