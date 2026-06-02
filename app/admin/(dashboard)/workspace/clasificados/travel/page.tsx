import Link from "next/link";
import { Suspense } from "react";

import { viajesRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import {
  adminQueueRowAnchorId,
  adminQueueRowClass,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import { appendPreservedSearchParams, parseAdminScope } from "../_lib/clasificadosAdminScopeUrls";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { fetchAllViajesStagedForAdmin } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer";
import type { ViajesStagedListingRow } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";

export const dynamic = "force-dynamic";

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return ts;
  }
}

export default async function AdminTravelViajesQueuePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const sp = props.searchParams ? await props.searchParams : {};
  const actionProof = parseAdminActionResultFromRecord(sp);
  const scope = parseAdminScope(sp);
  const basePath = "/admin/workspace/clasificados/travel";
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");

  const configured = isSupabaseAdminConfigured();
  const allRows: ViajesStagedListingRow[] = configured ? await fetchAllViajesStagedForAdmin() : [];
  const rows =
    scope === "live"
      ? allRows.filter((r) => viajesRowIsPublicLive(r as unknown as Record<string, unknown>))
      : allRows;

  const qRaw = typeof sp.q === "string" ? sp.q.trim() : "";
  const displayRows = qRaw
    ? rows.filter((r) => {
        const n = qRaw.toLowerCase();
        if ((r.leonix_ad_id ?? "").toLowerCase().includes(n)) return true;
        if (r.title.toLowerCase().includes(n)) return true;
        if (r.slug.toLowerCase().includes(n)) return true;
        if (r.id.toLowerCase().includes(n)) return true;
        return false;
      })
    : rows;

  const surface = clasificadosQueueSurfaceForSlug("travel");

  const headerTitle =
    scope === "live" ? m("listingsCategoryOps.titleLive", { slug: "travel" }) : m("listingsCategoryOps.titleQueue", { slug: "travel" });
  const headerSub = scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue");

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        title={headerTitle}
        sourceTable={surface.sourceTable}
        subtitle={headerSub}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        rightSlot={
          <ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />
        }
      />

      {configured && (
        <form method="get" action={basePath} className={`${adminCardBase} flex flex-wrap items-center gap-2 p-3`}>
          {scope === "live" && <input type="hidden" name="scope" value="live" />}
          <label className="flex items-center gap-2 text-xs text-[#5C5346]">
            <span className="font-semibold">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={qRaw}
              placeholder="Title, Leonix ID or slug…"
              className="min-w-[18rem] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs text-[#5C5346] hover:bg-[#F3EBDD]">
            Search
          </button>
          {qRaw && (
            <a
              href={scope === "live" ? `${basePath}?scope=live` : basePath}
              className="text-xs text-[#7A7164] underline"
            >
              Clear
            </a>
          )}
        </form>
      )}

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>Supabase admin not configured.</p>
      ) : displayRows.length === 0 ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          {qRaw ? `No results for "${qRaw}".` : "No rows in viajes_staged_listings."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-sm">
          <Suspense fallback={null}>
            <ClasificadosQueueActionChrome />
          </Suspense>
          <table className="min-w-full border-collapse text-left text-xs text-[#2C2416]">
            <thead className="bg-[#F3EBDD] text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Leonix Ad ID</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Title</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Slug</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Status</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Public</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Feat.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Verif.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Published</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Links</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Actions</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Monetization</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r) => {
                const lx = r.leonix_ad_id ?? null;
                const promoted = Boolean(r.admin_promoted);
                const verified = Boolean(r.leonix_verified);
                const lifecycle = r.lifecycle_status;
                const isPublic = r.is_public;
                const publicLive = lifecycle === "approved" && isPublic;
                const highlighted = actionProof?.target === r.id;
                return (
                  <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={adminQueueRowClass(highlighted)}>
                    <td className="px-3 py-2 font-mono text-[10px]">{lx ?? "—"}</td>
                    <td className="max-w-[200px] px-3 py-2 font-semibold">{r.title ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{r.slug}</td>
                    <td className="px-3 py-2">{lifecycle}</td>
                    <td className="px-3 py-2">{isPublic ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{promoted ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{verified ? "yes" : "no"}</td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id ?? ""}>
                      {r.owner_user_id?.slice(0, 8) ?? "—"}…
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.published_at)}</td>
                    <td className="space-y-1 px-3 py-2">
                      {publicLive ? (
                        <Link
                          href={`/clasificados/viajes/oferta/${encodeURIComponent(r.slug)}`}
                          className="block font-semibold text-[#6B5B2E] underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View public
                        </Link>
                      ) : (
                        <span className="text-[#7A7164]">—</span>
                      )}
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top">
                      <ClassifiedAdminRowActions
                        variant="viajes"
                        rowId={r.id}
                        leonixAdId={lx}
                        displayLabel={r.title}
                        publicLive={publicLive}
                        promoted={promoted}
                        verified={verified}
                        canArchive={lifecycle !== "unpublished" && lifecycle !== "rejected"}
                        staffEditBoardHref="/dashboard/viajes"
                        republishCategory="viajes"
                        republishRow={{
                          lifecycle_status: r.lifecycle_status,
                          is_public: r.is_public,
                          republish_override: (r as { republish_override?: boolean | null }).republish_override,
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <AdminListingMonetizationSummary
                        category="viajes"
                        source="viajes_staged_listings"
                        listing={r as unknown as Record<string, unknown>}
                        lang={lang}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
