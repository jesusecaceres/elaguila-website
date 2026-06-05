import Link from "next/link";
import { Suspense } from "react";
import {
  ADMIN_QUEUE_DEFAULT_LIMIT,
  adminQueueRowAnchorId,
  adminQueueRowClass,
  normalizeAdminQueueLimit,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminBtnSecondary, adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import {
  isServiciosDevPublishPersistenceEnabled,
  listServiciosDevPublishRows,
} from "@/app/clasificados/servicios/lib/serviciosDevPublishPersistence";
import {
  fetchServiciosUserLikedCountsByKeys,
  fetchServiciosUserSavedCountsByKeys,
  listServiciosPublicListingsAdminQueueFromDb,
} from "@/app/clasificados/servicios/lib/serviciosPublicListingsServer";
import { listPendingServiciosReviews } from "@/app/clasificados/servicios/lib/serviciosOpsTablesServer";
import {
  setServiciosListingLeonixVerifiedAction,
  setServiciosReviewModerationStatusAction,
  updateServiciosPublicListingStatusAction,
} from "./actions";
import { serviciosRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "../_lib/clasificadosAdminScopeUrls";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import {
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
} from "@/app/clasificados/servicios/lib/serviciosPublicListingSort";

export const dynamic = "force-dynamic";

export type ServiciosPublicAdminRow = {
  id: string;
  slug: string;
  leonix_ad_id?: string | null;
  business_name: string;
  city: string;
  published_at: string;
  updated_at: string | null;
  leonix_verified: boolean;
  listing_status: string | null;
  internal_group: string | null;
  owner_user_id?: string | null;
  moderation_notes?: string | null;
  profile_json?: { opsMeta?: { leonixVerifiedInterest?: boolean } } | null;
  promoted?: boolean;
  republish_override?: boolean | null;
};

type ServiciosLeadAdminRow = {
  id: string;
  listing_slug: string;
  sender_name: string;
  sender_email: string;
  message: string;
  request_kind: string;
  created_at: string;
};

async function fetchServiciosLeadsForAdmin(): Promise<ServiciosLeadAdminRow[]> {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_leads")
      .select("id, listing_slug, sender_name, sender_email, message, request_kind, created_at")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error || !data) return [];
    return data as ServiciosLeadAdminRow[];
  } catch {
    return [];
  }
}

function devFileRowsAsAdmin(): ServiciosPublicAdminRow[] {
  if (!isServiciosDevPublishPersistenceEnabled()) return [];
  return listServiciosDevPublishRows().map((r) => ({
    id: `dev-file:${r.slug}`,
    slug: r.slug,
    business_name: r.business_name,
    city: r.city,
    published_at: r.published_at,
    updated_at: r.published_at,
    leonix_verified: r.leonix_verified,
    listing_status: "published_dev_file",
    internal_group: r.internal_group,
  }));
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

function filterDevServiciosRows(rows: ServiciosPublicAdminRow[], q: string | undefined): ServiciosPublicAdminRow[] {
  const n = (q ?? "").trim().toLowerCase();
  if (!n) return rows;
  return rows.filter(
    (r) =>
      r.slug.toLowerCase().includes(n) ||
      r.business_name.toLowerCase().includes(n) ||
      r.id.toLowerCase().includes(n),
  );
}

export default async function AdminServiciosWorkspacePage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const lang = await getAdminLang();
  const msg = adminMessages(lang);
  const sp = props.searchParams ? await props.searchParams : {};
  const actionProof = parseAdminActionResultFromRecord(sp);
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);
  const scope = parseAdminScope(sp);
  const serviciosBase = "/admin/workspace/clasificados/servicios";
  const queueHref = appendPreservedSearchParams(serviciosBase, sp, null);
  const liveHref = appendPreservedSearchParams(serviciosBase, sp, "live");
  const queueFilters = {
    limit: queueLimit,
    ...(scope === "live" ? { scope: "live" as const } : {}),
    q: firstParam(sp.q),
    slug: firstParam(sp.slug),
    id: firstParam(sp.id),
    leonix_ad_id: firstParam(sp.leonix_ad_id),
    owner_user_id: firstParam(sp.owner_user_id),
  };
  const queueRes = await listServiciosPublicListingsAdminQueueFromDb(queueFilters);
  const { unavailable, fullSchema } = queueRes;
  const rows: ServiciosPublicAdminRow[] = queueRes.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    leonix_ad_id: r.leonix_ad_id ?? null,
    business_name: r.business_name,
    city: r.city,
    published_at: r.published_at,
    updated_at: r.updated_at,
    leonix_verified: r.leonix_verified,
    listing_status: r.listing_status,
    internal_group: r.internal_group,
    owner_user_id: r.owner_user_id,
    moderation_notes: (r.moderation_notes ?? null) as string | null,
    profile_json: r.profile_json as ServiciosPublicAdminRow["profile_json"],
    promoted: Boolean((r as { promoted?: boolean }).promoted),
  }));
  const rowsFiltered =
    scope === "live"
      ? rows.filter((r) => serviciosRowIsPublicLive(r as unknown as Record<string, unknown>))
      : rows;
  const allEngagementKeys = new Set<string>();
  for (const r of rows) {
    for (const k of serviciosLikeCountAliasKeys({ slug: r.slug, leonix_ad_id: r.leonix_ad_id ?? null, id: r.id })) {
      allEngagementKeys.add(k);
    }
  }
  const [serviciosAdminLikeMap, serviciosAdminSaveMap] = unavailable
    ? [new Map<string, number>(), new Map<string, number>()]
    : await Promise.all([
        fetchServiciosUserLikedCountsByKeys([...allEngagementKeys]),
        fetchServiciosUserSavedCountsByKeys([...allEngagementKeys]),
      ]);
  const serviciosAdminEngagementByRowId = new Map<string, { likes: number; saves: number }>();
  for (const r of rows) {
    const rowLike = { slug: r.slug, leonix_ad_id: r.leonix_ad_id ?? null, id: r.id };
    serviciosAdminEngagementByRowId.set(r.id, {
      likes: serviciosNetLikeCountForPublicRow(rowLike, serviciosAdminLikeMap),
      saves: serviciosNetLikeCountForPublicRow(rowLike, serviciosAdminSaveMap),
    });
  }
  const devAdminRows = filterDevServiciosRows(devFileRowsAsAdmin(), queueFilters.q);
  const pendingReviews = await listPendingServiciosReviews(80);
  const recentLeads = await fetchServiciosLeadsForAdmin();
  const surface = clasificadosQueueSurfaceForSlug("servicios");

  return (
    <div className="space-y-8">
      <ClasificadosQueueHeader
        title={scope === "live" ? msg("listingsCategoryOps.titleLive", { slug: "servicios" }) : msg("listingsCategoryOps.titleQueue", { slug: "servicios" })}
        sourceTable={surface.sourceTable}
        subtitle={scope === "live" ? msg("listingsCategoryOps.subLive") : msg("listingsCategoryOps.subQueue")}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        rightSlot={
          <ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />
        }
      />

      <div className={`${adminCardBase} border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950`}>
        <p className="font-semibold text-[#1E1810]">Live queue (Supabase)</p>
        <p className="mt-1 text-xs text-[#14532d]">
          Listings published through the Servicios flow live in{" "}
          <code className="rounded bg-white/80 px-1">servicios_public_listings</code>. Moderation and removal follow product rules; here you
          see the public directory as served by the API.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/workspace/clasificados?category=servicios&limit=300"
            className={`${adminCtaChipSecondary} justify-center text-xs`}
          >
            Clasificados · servicios (listings) →
          </Link>
        </div>
      </div>

      {!unavailable ? (
        <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm text-[#5C5346]`}>
          <p className="font-bold text-[#1E1810]">{msg("listingsCategoryOps.searchTitle")}</p>
          <p className="text-[10px] text-[#7A7164]">
            Leonix Ad ID (when column exists), internal or user UUID, slug, public URL /clasificados/servicios/…, business name, and
            match on owner profile name / email / phone.
          </p>
          <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action={serviciosBase}>
            {scope === "live" ? <input type="hidden" name="scope" value="live" /> : null}
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">q</span>
              <input
                name="q"
                defaultValue={queueFilters.q ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
                placeholder="UUID, URL, business, email…"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">slug</span>
              <input
                name="slug"
                defaultValue={queueFilters.slug ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">id</span>
              <input
                name="id"
                defaultValue={queueFilters.id ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">leonix_ad_id</span>
              <input
                name="leonix_ad_id"
                defaultValue={queueFilters.leonix_ad_id ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">owner_user_id</span>
              <input
                name="owner_user_id"
                defaultValue={queueFilters.owner_user_id ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <button type="submit" className="rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]">
              Apply
            </button>
            <Link href={queueHref} className={`${adminBtnSecondary} inline-flex items-center text-xs`}>
              Clear
            </Link>
          </form>
        </div>
      ) : null}

      {!unavailable ? (
        <div className={`${adminCardBase} overflow-hidden p-0`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            servicios_public_listings (operations)
            {!fullSchema ? (
              <span className="ml-2 text-amber-900">
                — reduced mode (recent columns missing; apply Servicios migrations)
              </span>
            ) : null}
          </div>
          {rowsFiltered.length === 0 ? (
            <p className="p-4 text-sm text-[#5C5346]">
              No published listings found for this category. Query: <span className="font-mono">servicios_public_listings</span> returned
              zero rows with current filters (or the table is empty).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Suspense fallback={null}>
                <ClasificadosQueueActionChrome />
              </Suspense>
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Slug</th>
                    <th className="p-3">Leonix Ad ID</th>
                    <th className="p-3 text-right tabular-nums" title="Rows in user_liked_listings (listing_id key, rollup alias)">
                      MG
                    </th>
                    <th className="p-3 text-right tabular-nums" title="Rows in saved_listings">
                      Saved
                    </th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Leonix verified</th>
                    <th className="p-3">Verify interest</th>
                    <th className="p-3">Updated</th>
                    <th className="p-3">Staff (Leonix)</th>
                    <th className="p-3">Monetization</th>
                    <th className="p-3" title="Public view. Status and notes: staff moderation on this row (no full profile editor).">
                      &nbsp;
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsFiltered.map((r) => {
                    const highlighted = actionProof?.target === r.id;
                    return (
                    <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={adminQueueRowClass(highlighted)}>
                      <td className="p-3 font-semibold text-[#1E1810]">{r.business_name}</td>
                      <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                      <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
                      <td className="p-3 font-mono text-[10px] text-[#3D3428]">{r.leonix_ad_id ?? "—"}</td>
                      <td className="p-3 text-right text-xs tabular-nums text-[#5C5346]">
                        {serviciosAdminEngagementByRowId.get(r.id)?.likes ?? 0}
                      </td>
                      <td className="p-3 text-right text-xs tabular-nums text-[#5C5346]">
                        {serviciosAdminEngagementByRowId.get(r.id)?.saves ?? 0}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-[#7A7164]">{r.owner_user_id?.slice(0, 8) ?? "—"}…</td>
                      <td className="p-3 text-xs">
                        <form action={updateServiciosPublicListingStatusAction} className="flex max-w-[14rem] flex-col gap-1">
                          <input type="hidden" name="listing_id" value={r.id} />
                          <select
                            name="listing_status"
                            defaultValue={r.listing_status ?? "published"}
                            className="max-w-[11rem] rounded border border-[#E8DFD0] bg-white px-1 py-1 text-[11px]"
                          >
                            <option value="pending_review">pending_review</option>
                            <option value="published">published</option>
                            <option value="paused_unpublished">paused_unpublished</option>
                            <option value="rejected">rejected</option>
                            <option value="suspended">suspended</option>
                            <option value="draft">draft</option>
                          </select>
                          <label className="text-[10px] font-semibold text-[#7A7164]">
                            Moderation notes
                            <textarea
                              name="moderation_notes"
                              rows={2}
                              defaultValue={r.moderation_notes ?? ""}
                              className="mt-0.5 w-full resize-y rounded border border-[#E8DFD0] bg-white px-1 py-0.5 text-[10px]"
                              placeholder="Internal"
                            />
                          </label>
                          <button
                            type="submit"
                            className="rounded-lg border border-[#7A1E2C]/40 bg-[#7A1E2C]/10 px-2 py-0.5 text-[10px] font-bold text-[#7A1E2C]"
                          >
                            Save status
                          </button>
                        </form>
                      </td>
                      <td className="p-3 text-xs">
                        <form action={setServiciosListingLeonixVerifiedAction} className="flex flex-col gap-1">
                          <input type="hidden" name="listing_id" value={r.id} />
                          <select
                            name="leonix_verified"
                            defaultValue={r.leonix_verified ? "1" : "0"}
                            className="max-w-[6rem] rounded border border-[#E8DFD0] bg-white px-1 py-1 text-[11px]"
                          >
                            <option value="0">no</option>
                            <option value="1">yes</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded border border-[#E8DFD0] bg-white px-2 py-0.5 text-[10px] font-semibold"
                          >
                            Save verify
                          </button>
                        </form>
                      </td>
                      <td className="p-3 text-xs">{r.profile_json?.opsMeta?.leonixVerifiedInterest ? "yes" : "—"}</td>
                      <td className="p-3 text-xs text-[#7A7164]">
                        {r.updated_at
                          ? new Date(r.updated_at).toLocaleString()
                          : r.published_at
                            ? new Date(r.published_at).toLocaleString()
                            : "—"}
                      </td>
                      <td className="p-3 align-top">
                        <ClassifiedAdminRowActions
                          variant="servicios"
                          rowId={r.id}
                          leonixAdId={r.leonix_ad_id}
                          displayLabel={r.business_name}
                          publicLive={(r.listing_status ?? "") === "published"}
                          promoted={Boolean(r.promoted)}
                          verified={r.leonix_verified}
                          canArchive={(r.listing_status ?? "") !== "rejected"}
                          staffEditBoardHref={`/admin/workspace/clasificados/servicios?slug=${encodeURIComponent(r.slug)}`}
                          republishCategory="servicios"
                          republishRow={{
                            listing_status: r.listing_status,
                            republish_override: r.republish_override,
                          }}
                        />
                      </td>
                      <td className="p-3 align-top">
                        <AdminListingMonetizationSummary
                          category="servicios"
                          source="servicios_public_listings"
                          listing={r as unknown as Record<string, unknown>}
                          hints={{ dualAnalyticsPipeline: true, analyticsCapability: "partial" }}
                        />
                      </td>
                      <td className="p-3">
                        <Link
                          href={`/clasificados/servicios/${r.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#6B5B2E] underline"
                          title="Public site. Copy/image changes: advertiser flow."
                        >
                          View public ↗
                        </Link>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          Could not read <code className="rounded bg-white/80 px-1">servicios_public_listings</code> (check migrations and credentials).
        </div>
      )}

      {devAdminRows.length > 0 ? (
        <div className={`${adminCardBase} overflow-hidden border-amber-200/80 bg-amber-50/90 p-0`}>
          <div className="border-b border-amber-200/80 bg-amber-100/90 px-4 py-2 text-xs font-semibold text-amber-950">
            Test publishes (local file <code className="rounded bg-white/80 px-1">.servicios-dev-publishes.json</code>) — development only /{" "}
            <code className="rounded bg-white/80 px-1">SERVICIOS_DEV_PUBLISH=1</code>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-3">Business</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3" title="Test public view only">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {devAdminRows.map((r) => (
                  <tr key={r.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-semibold text-[#1E1810]">{r.business_name}</td>
                    <td className="p-3 text-xs text-[#5C5346]">{r.city}</td>
                    <td className="p-3 font-mono text-xs text-[#3D3428]">{r.slug}</td>
                    <td className="p-3">
                      <Link
                        href={`/clasificados/servicios/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#6B5B2E] underline"
                        title="Public view (dev)"
                      >
                        View public ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!unavailable && pendingReviews.length > 0 ? (
        <div className={`${adminCardBase} overflow-hidden p-0`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            Pending reviews ({pendingReviews.length})
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Stars</th>
                  <th className="p-3">Text</th>
                  <th className="p-3"> </th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map((rev) => (
                  <tr key={rev.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-mono text-xs">{rev.listing_slug}</td>
                    <td className="p-3 text-xs">{rev.author_name}</td>
                    <td className="p-3 text-xs tabular-nums">{rev.rating}</td>
                    <td className="max-w-xs p-3 text-xs text-[#5C5346]">
                      <span className="line-clamp-3">{rev.body}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <form action={setServiciosReviewModerationStatusAction}>
                          <input type="hidden" name="review_id" value={rev.id} />
                          <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                          <input type="hidden" name="review_status" value="approved" />
                          <button
                            type="submit"
                            className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-900"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={setServiciosReviewModerationStatusAction}>
                          <input type="hidden" name="review_id" value={rev.id} />
                          <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                          <input type="hidden" name="review_status" value="rejected" />
                          <button
                            type="submit"
                            className="rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-900"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!unavailable && recentLeads.length > 0 ? (
        <div className={`${adminCardBase} overflow-hidden p-0`}>
          <div className="border-b border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-4 py-2 text-xs font-semibold text-[#5C5346]">
            Recent inquiries (servicios_public_leads)
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                <tr>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Sender</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Message</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((l) => (
                  <tr key={l.id} className="border-t border-[#E8DFD0]/80">
                    <td className="p-3 font-mono text-xs">{l.listing_slug}</td>
                    <td className="p-3 text-xs">
                      {l.sender_name}
                      <br />
                      <span className="text-[#5C5346]">{l.sender_email}</span>
                    </td>
                    <td className="p-3 text-xs">{l.request_kind}</td>
                    <td className="max-w-md p-3 text-xs text-[#5C5346]">
                      <span className="line-clamp-4 whitespace-pre-wrap">{l.message}</span>
                    </td>
                    <td className="p-3 text-xs text-[#7A7164]">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className={`${adminCardBase} border-[#E8DFD0] bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Tier sandbox (localStorage)</p>
        <p className="mt-1 text-xs">
          Legacy design tool — does not write to Supabase. For visibility/tier tests use the isolated screen.
        </p>
        <Link
          href="/admin/workspace/clasificados/servicios/sandbox"
          className={`${adminCtaChipSecondary} mt-3 inline-flex justify-center text-xs`}
        >
          Open tier sandbox →
        </Link>
      </div>
    </div>
  );
}
