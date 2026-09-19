import { Suspense } from "react";

import { adminMessages, getAdminLang } from "@/app/admin/_lib/adminI18n";
import { fetchAdminCategorySummary, type AdminCategorySummary } from "@/app/admin/_lib/adminCategorySummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { AdminCategoryFilterBar } from "../_components/normalized/AdminCategoryFilterBar";
import { AdminCategorySummaryPanel } from "../_components/normalized/AdminCategorySummaryPanel";
import { adminAnyFilterActive } from "@/app/admin/_lib/adminFilterTruth";
import { adminStatusOptionsForCategory } from "../_lib/adminNormalizedShell";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { appendPreservedSearchParams, parseAdminScope } from "../_lib/clasificadosAdminScopeUrls";
import { EmpleosAdminListClient } from "./EmpleosAdminListClient";

export const dynamic = "force-dynamic";

const EMPLEOS_BASE = "/admin/workspace/clasificados/empleos";

/** Empleos lanes (`empleos_public_listings.lane`): quick + premium are paid, feria is free. */
const EMPLEOS_LANE_OPTIONS = [
  { value: "quick", label: "Quick — Local job ad (paid)" },
  { value: "premium", label: "Premium — preserved (paid)" },
  { value: "feria", label: "Feria — Job fair (free)" },
] as const;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const FIELD = "rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#1E1810] min-h-[40px]";

/**
 * Empleos admin — server shell (normalized Clasificados operating shell): scope-aware header,
 * shared operating summary, shared filter bar with the Empleos lane filter, then the client list
 * (rows + commercial truth come from /api/admin/empleos/listings; ONE lifecycle action system).
 */
export default async function AdminEmpleosListingsPage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const sp = (props.searchParams ? await props.searchParams : {}) as Record<string, string | string[] | undefined>;
  const scope = parseAdminScope(sp);
  const laneRaw = typeof sp.lane === "string" ? sp.lane.trim().toLowerCase() : "";
  const surface = clasificadosQueueSurfaceForSlug("empleos");

  let summary: AdminCategorySummary;
  try {
    summary = await fetchAdminCategorySummary("empleos");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "summary query failed";
    summary = {
      slug: "empleos",
      total: null,
      live: null,
      needsAttention: null,
      paymentIssue: null,
      expired: null,
      sourceHealth: { ok: false, source: surface.sourceTable, note: msg },
      queryError: msg,
    };
  }

  return (
    <div className="max-w-6xl space-y-6 pb-12">
      <ClasificadosQueueHeader
        lang={lang}
        categoryName="Empleos"
        scope={scope === "live" ? "live" : "queue"}
        sourceTable={surface.sourceTable}
        subtitle={scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        queueHref={appendPreservedSearchParams(EMPLEOS_BASE, sp, null, ["lane"])}
        liveHref={appendPreservedSearchParams(EMPLEOS_BASE, sp, "live", ["lane"])}
      />

      <AdminCategorySummaryPanel
        summary={summary}
        lang={lang}
        filtersActive={adminAnyFilterActive(sp)}
        technicalDetails={[["Table", surface.sourceTable]]}
      />

      <AdminCategoryFilterBar
        lang={lang}
        action={EMPLEOS_BASE}
        searchParams={sp}
        statusOptions={adminStatusOptionsForCategory("empleos")}
        clearHref={appendPreservedSearchParams(EMPLEOS_BASE, { lang: sp.lang }, scope)}
        extraFieldNames={["lane"]}
        searchPlaceholder="Leonix Ad ID, UUID, slug or URL, owner, title, company, city…"
      >
        <label className="flex min-w-[9rem] flex-col gap-1 text-xs" data-testid="empleos-lane-filter">
          <span className="font-semibold text-[#5C5346]">Lane</span>
          <select name="lane" defaultValue={laneRaw} className={FIELD}>
            <option value="">All lanes</option>
            {EMPLEOS_LANE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </AdminCategoryFilterBar>

      <Suspense fallback={<div className="min-h-[8rem]" aria-busy="true" />}>
        <EmpleosAdminListClient />
      </Suspense>
    </div>
  );
}
