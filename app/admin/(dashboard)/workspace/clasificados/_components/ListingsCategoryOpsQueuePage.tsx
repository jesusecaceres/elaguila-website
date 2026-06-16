import Link from "next/link";

import { ADMIN_QUEUE_DEFAULT_LIMIT, normalizeAdminQueueLimit } from "@/app/admin/_lib/adminQueueActionFlow";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  fetchListingsForAdminWorkspaceFiltered,
  isUuidString,
} from "@/app/admin/_lib/listingsAdminSelect";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosAdminScopeUrls";

import AdminListingsTable, { type AdminListingsTableRow } from "../AdminListingsTable";
import { ClasificadosQueueHeader } from "./ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "./ClasificadosScopeNav";
import { ClasificadosLiveScopePanel } from "./ClasificadosLiveScopePanel";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  categorySlug: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function ListingsCategoryOpsQueuePage({ categorySlug, searchParams }: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const configured = isSupabaseAdminConfigured();
  const sp = searchParams ? await searchParams : {};
  const qInput = firstParam(sp.q) ?? "";
  const statusFilter = (firstParam(sp.status) ?? "").trim().toLowerCase();
  const ownerFrag = (firstParam(sp.owner) ?? "").trim().toLowerCase();
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);
  const scope = parseAdminScope(sp);

  const surface = clasificadosQueueSurfaceForSlug(categorySlug);
  const basePath = `/admin/workspace/clasificados/${encodeURIComponent(categorySlug)}`;
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");

  const supabase = getAdminSupabase();
  const fetchRes = configured
    ? await fetchListingsForAdminWorkspaceFiltered(supabase, {
        q: qInput || undefined,
        category: categorySlug,
        status: statusFilter || undefined,
        ownerFrag: ownerFrag && isUuidString(ownerFrag) ? ownerFrag : undefined,
        limit: queueLimit,
        ...(scope === "live" ? { scope: "live" as const } : {}),
      })
    : { data: [], error: null, detailPairsAvailable: true, republishColsAvailable: true };

  let rows = (fetchRes.data ?? []) as AdminListingsTableRow[];
  if (ownerFrag && !isUuidString(ownerFrag)) {
    rows = rows.filter((r) => (r.owner_id ?? "").toLowerCase().includes(ownerFrag));
  }

  const pageTitle =
    scope === "live"
      ? m("listingsCategoryOps.titleLive", { slug: categorySlug })
      : m("listingsCategoryOps.titleQueue", { slug: categorySlug });
  const pageSubtitle =
    scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue");

  return (
    <div className="min-w-0 max-w-[1200px] space-y-6 overflow-x-hidden">
      <ClasificadosQueueHeader
        title={pageTitle}
        sourceTable={surface.sourceTable}
        subtitle={pageSubtitle}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        scopeLabel={scope === "live" ? m("listingsCategoryOps.scopeLive") : m("listingsCategoryOps.scopeQueue")}
        rightSlot={<ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />}
      />

      {scope === "live" ? (
        <ClasificadosLiveScopePanel
          categorySlug={categorySlug}
          lang={lang}
          queueHref={queueHref}
          liveHref={liveHref}
          rowCount={rows.length}
          configured={configured}
          fetchError={fetchRes.error?.message ?? null}
        />
      ) : null}

      {configured ? (
        <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm text-[#5C5346]`}>
          <p className="font-bold text-[#1E1810]">{m("listingsCategoryOps.searchTitle")}</p>
          <form
            className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end"
            method="get"
            action={basePath}
          >
            {scope === "live" ? <input type="hidden" name="scope" value="live" /> : null}
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">q</span>
              <input
                name="q"
                defaultValue={qInput}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
                placeholder="Leonix ID, UUID, slug, título…"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">status</span>
              <input
                name="status"
                defaultValue={statusFilter}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">owner (UUID)</span>
              <input
                name="owner"
                defaultValue={ownerFrag}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]">
              {m("common.apply")}
            </button>
            <Link href={queueHref} className={`${adminBtnSecondary} inline-flex items-center text-xs`}>
              {m("common.clear")}
            </Link>
          </form>
        </div>
      ) : null}

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          Supabase admin no está configurado (<code className="rounded bg-[#FBF7EF] px-1">SUPABASE_SERVICE_ROLE_KEY</code>).
        </p>
      ) : fetchRes.error ? (
        <p className={`${adminCardBase} p-4 text-sm text-red-800`}>Error: {fetchRes.error.message}</p>
      ) : (
        <AdminListingsTable
          listings={rows}
          detailPairsAvailable={fetchRes.detailPairsAvailable}
          republishColsAvailable={fetchRes.republishColsAvailable}
          listingsCategorySlug={categorySlug}
          staffQueueMode
        />
      )}
    </div>
  );
}
