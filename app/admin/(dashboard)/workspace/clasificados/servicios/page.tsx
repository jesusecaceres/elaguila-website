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
import { adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
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
import { setServiciosReviewModerationStatusAction } from "./actions";
import { serviciosRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
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
import type { ServiciosPublicAdminRow } from "./_lib/serviciosAdminOpsTypes";
import { ServiciosAdminFilterPanel, ServiciosAdminQuickActions } from "./_components/ServiciosAdminOpsChrome";
import { ServiciosAdminOpsListingCard } from "./_components/ServiciosAdminOpsListingCard";

export const dynamic = "force-dynamic";

export type { ServiciosPublicAdminRow };

type ServiciosLeadAdminRow = {
  id: string;
  listing_slug: string;
  sender_name: string;
  sender_email: string;
  message: string;
  request_kind: string;
  created_at: string;
};

const SERVICIOS_ADMIN_COLUMNS = [
  "id",
  "slug",
  "leonix_ad_id",
  "business_name",
  "city",
  "published_at",
  "updated_at",
  "profile_json",
  "leonix_verified",
  "listing_status",
  "internal_group",
  "owner_user_id",
  "moderation_notes",
  "promoted",
] as const;

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

function countByStatus(rows: ServiciosPublicAdminRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = (r.listing_status ?? "unknown").toLowerCase();
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
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
  const { unavailable, fullSchema, readError } = queueRes;
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
    republish_override: (r as { republish_override?: boolean | null }).republish_override ?? null,
  }));
  const rowsFiltered =
    scope === "live"
      ? rows.filter((r) => serviciosRowIsPublicLive(r as unknown as Record<string, unknown>))
      : rows;
  const statusCounts = countByStatus(rows);
  const publishedCount = statusCounts.published ?? 0;

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
  const pageTitle =
    scope === "live"
      ? msg("listingsCategoryOps.titleLive", { slug: "servicios" })
      : "Servicios — operational queue";

  return (
    <div className="min-w-0 max-w-5xl space-y-6 overflow-x-hidden" data-testid="servicios-admin-ops-page">
      <header className="space-y-3 border-b border-[#E8DFD0] pb-5" data-testid="servicios-admin-command-header">
        <Link
          href="/admin/workspace/clasificados"
          className="inline-flex min-h-[40px] items-center rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold text-[#3D3428] hover:bg-[#FFFCF7]"
        >
          ← Clasificados hub
        </Link>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Servicios ops</p>
        <h1 className="text-2xl font-bold text-[#1E1810]">{pageTitle}</h1>
        <p className="font-mono text-xs text-[#7A7164]">
          Source: <span className="text-[#3D3428]">public.servicios_public_listings</span>
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-[#5C5346]">
          Manage published, suspended, featured, verified, and monetized Servicios listings. This is the Supabase-backed
          Servicios directory queue — empty or missing data is shown truthfully.
        </p>
        <ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />
      </header>

      <section className={`${adminCardBase} border-[#C9B46A]/35 p-4 sm:p-5`} data-testid="servicios-admin-quick-actions">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Quick actions</p>
        <ServiciosAdminQuickActions
          queueHref={queueHref}
          liveHref={liveHref}
          publicHref={surface.publicHref}
          publishHref={surface.publishHref}
        />
      </section>

      <section
        className={`${adminCardBase} border-[#E8DFD0]/80 bg-[#FAF7F2]/90 p-4 sm:p-5`}
        data-testid="servicios-admin-supabase-truth"
      >
        <p className="text-sm font-bold text-[#1E1810]">Supabase truth</p>
        <dl className="mt-3 grid gap-2 text-sm text-[#5C5346] sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Source table</dt>
            <dd className="font-mono text-xs">servicios_public_listings</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Records loaded</dt>
            <dd className="font-semibold text-[#1E1810]">{unavailable ? "—" : rowsFiltered.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Published (loaded set)</dt>
            <dd>{unavailable ? "—" : publishedCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase text-[#7A7164]">Schema status</dt>
            <dd>
              {unavailable
                ? readError ?? "Servicios data unavailable"
                : fullSchema
                  ? "Migrations found in repo; needs live Supabase proof in production"
                  : "Reduced mode — apply Servicios migrations"}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#7A7164]">
          Columns used: {SERVICIOS_ADMIN_COLUMNS.join(", ")}. Engagement uses user_liked_listings / saved_listings when
          readable.
        </p>
      </section>

      {!unavailable ? (
        <ServiciosAdminFilterPanel
          serviciosBase={serviciosBase}
          queueHref={queueHref}
          scopeLive={scope === "live"}
          filters={queueFilters}
          searchHint="Leonix Ad ID, UUID, slug, public URL /clasificados/servicios/…, business name, owner profile match."
        />
      ) : null}

      {!unavailable ? (
        <section className="min-w-0 space-y-4" data-testid="servicios-admin-listing-cards">
          <Suspense fallback={null}>
            <ClasificadosQueueActionChrome />
          </Suspense>
          {rowsFiltered.length === 0 ? (
            <div className={`${adminCardBase} p-5 text-sm text-[#5C5346]`} role="status" data-testid="servicios-admin-empty-state">
              <p className="font-bold text-[#1E1810]">No published listings found for this category.</p>
              <p className="mt-2 leading-relaxed">
                Query <span className="font-mono">servicios_public_listings</span> returned zero rows with current filters
                (or the table is empty). The live source is wired; this is not a broken page.
              </p>
            </div>
          ) : (
            rowsFiltered.map((r) => {
              const engagement = serviciosAdminEngagementByRowId.get(r.id) ?? { likes: 0, saves: 0 };
              const highlighted = actionProof?.target === r.id;
              return (
                <ServiciosAdminOpsListingCard
                  key={r.id}
                  row={r}
                  likes={engagement.likes}
                  saves={engagement.saves}
                  highlighted={highlighted}
                />
              );
            })
          )}

          {rowsFiltered.length > 0 ? (
            <details className={`${adminCardBase} p-4`} data-testid="servicios-advanced-table">
              <summary className="cursor-pointer text-sm font-semibold text-[#3D3629]">Advanced table view (power users)</summary>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase text-[#7A7164]">
                    <tr>
                      <th className="p-2">Business</th>
                      <th className="p-2">City</th>
                      <th className="p-2">Slug</th>
                      <th className="p-2">Leonix Ad ID</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Owner</th>
                      <th className="p-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowsFiltered.map((r) => (
                      <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={`border-t border-[#E8DFD0]/70 ${adminQueueRowClass(actionProof?.target === r.id)}`}>
                        <td className="p-2 font-semibold">{r.business_name}</td>
                        <td className="p-2 text-xs">{r.city}</td>
                        <td className="p-2 font-mono text-xs">{r.slug}</td>
                        <td className="p-2 font-mono text-[10px]">{r.leonix_ad_id ?? "—"}</td>
                        <td className="p-2 text-xs">{r.listing_status}</td>
                        <td className="p-2 font-mono text-[10px]">{r.owner_user_id?.slice(0, 8) ?? "—"}</td>
                        <td className="p-2 text-xs">{r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
        </section>
      ) : (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`} role="alert">
          <p className="font-bold text-[#1E1810]">Servicios data unavailable</p>
          <p className="mt-2">
            Could not read <code className="rounded bg-white/80 px-1">servicios_public_listings</code>.{" "}
            {readError ?? "Check migrations and service-role credentials."}
          </p>
        </div>
      )}

      {devAdminRows.length > 0 ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/90 p-4`}>
          <p className="text-xs font-semibold text-amber-950">
            Test publishes (local file) — development only
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {devAdminRows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {r.business_name} · {r.slug}
                </span>
                <Link href={`/clasificados/servicios/${r.slug}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#6B5B2E] underline">
                  View public ↗
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!unavailable && pendingReviews.length > 0 ? (
        <div className={`${adminCardBase} p-4`}>
          <p className="text-sm font-bold text-[#1E1810]">Pending reviews ({pendingReviews.length})</p>
          <ul className="mt-3 space-y-3">
            {pendingReviews.map((rev) => (
              <li key={rev.id} className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-sm">
                <p className="font-mono text-xs">{rev.listing_slug}</p>
                <p className="mt-1 text-xs text-[#5C5346]">
                  {rev.author_name} · {rev.rating}★ — <span className="line-clamp-2">{rev.body}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={setServiciosReviewModerationStatusAction}>
                    <input type="hidden" name="review_id" value={rev.id} />
                    <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                    <input type="hidden" name="review_status" value="approved" />
                    <button type="submit" className="rounded-lg border border-[#2A4536] bg-[#2A4536] px-3 py-1.5 text-xs font-semibold text-white">
                      Approve
                    </button>
                  </form>
                  <form action={setServiciosReviewModerationStatusAction}>
                    <input type="hidden" name="review_id" value={rev.id} />
                    <input type="hidden" name="listing_slug" value={rev.listing_slug} />
                    <input type="hidden" name="review_status" value="rejected" />
                    <button type="submit" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!unavailable && recentLeads.length > 0 ? (
        <div className={`${adminCardBase} p-4`}>
          <p className="text-sm font-bold text-[#1E1810]">Recent inquiries (servicios_public_leads)</p>
          <ul className="mt-3 space-y-3">
            {recentLeads.map((l) => (
              <li key={l.id} className="rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-sm">
                <p className="font-mono text-xs">{l.listing_slug}</p>
                <p className="mt-1 text-xs">
                  {l.sender_name} · {l.sender_email} · {l.request_kind}
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-[#5C5346]">{l.message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${adminCardBase} border-[#E8DFD0] bg-[#FFFCF7]/90 p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Tier sandbox (localStorage)</p>
        <p className="mt-1 text-xs">Legacy design tool — does not write to Supabase.</p>
        <Link href="/admin/workspace/clasificados/servicios/sandbox" className={`${adminCtaChipSecondary} mt-3 inline-flex justify-center text-xs`}>
          Open tier sandbox →
        </Link>
      </div>
    </div>
  );
}
