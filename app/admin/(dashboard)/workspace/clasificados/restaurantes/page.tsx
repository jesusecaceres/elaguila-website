import Link from "next/link";
import { Suspense } from "react";
import { listRestaurantesPublicListingsAdminFromDb } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingsServer";
import { restauranteRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import {
  ADMIN_QUEUE_DEFAULT_LIMIT,
  adminQueueRowAnchorId,
  adminQueueRowClass,
  normalizeAdminQueueLimit,
  parseAdminActionResultFromRecord,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { ClassifiedAdminRowActions } from "../_components/ClassifiedAdminRowActions";
import { AdminListingMonetizationSummary } from "../_components/AdminListingMonetizationSummary";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "../_lib/clasificadosAdminScopeUrls";

export const dynamic = "force-dynamic";

function fmt(ts: string | null | undefined) {
  if (!ts) return "—";
  try {
    return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return ts;
  }
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRestaurantesPublicListingsPage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const configured = isSupabaseAdminConfigured();
  const sp = props.searchParams ? await props.searchParams : {};
  const scope = parseAdminScope(sp);
  const basePath = "/admin/workspace/clasificados/restaurantes";
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");
  const hasFilters = !!(
    firstParam(sp.q) ||
    firstParam(sp.slug) ||
    firstParam(sp.id) ||
    firstParam(sp.leonix_ad_id) ||
    firstParam(sp.owner_user_id)
  );
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);
  const actionProof = parseAdminActionResultFromRecord(sp);
  const rowsRaw = configured
    ? await listRestaurantesPublicListingsAdminFromDb({
        limit: queueLimit,
        q: firstParam(sp.q),
        slug: firstParam(sp.slug),
        id: firstParam(sp.id),
        leonix_ad_id: firstParam(sp.leonix_ad_id),
        owner_user_id: firstParam(sp.owner_user_id),
      })
    : [];
  const rows =
    scope === "live"
      ? rowsRaw.filter((r) => restauranteRowIsPublicLive(r as unknown as Record<string, unknown>))
      : rowsRaw;

  const surface = clasificadosQueueSurfaceForSlug("restaurantes");
  const pageTitle =
    scope === "live" ? m("listingsCategoryOps.titleLive", { slug: "restaurantes" }) : m("listingsCategoryOps.titleQueue", { slug: "restaurantes" });
  const pageSubtitle = scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue");

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        title={pageTitle}
        sourceTable={surface.sourceTable}
        subtitle={pageSubtitle}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        rightSlot={
          <ClasificadosScopeNav lang={lang} queueHref={queueHref} liveHref={liveHref} active={scope === "live" ? "live" : "queue"} />
        }
      />

      {configured ? (
        <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm text-[#5C5346]`}>
          <p className="font-bold text-[#1E1810]">{m("listingsCategoryOps.searchTitle")}</p>
          <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action={basePath}>
            {scope === "live" ? <input type="hidden" name="scope" value="live" /> : null}
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">
                q (Leonix ID, UUID, user ID, slug, URL, negocio, nombre/email/teléfono del perfil)
              </span>
              <input
                name="q"
                defaultValue={firstParam(sp.q) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
                placeholder="REST-2026-000002 o tacos-el-chuy"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">slug</span>
              <input
                name="slug"
                defaultValue={firstParam(sp.slug) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">id (UUID)</span>
              <input
                name="id"
                defaultValue={firstParam(sp.id) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">leonix_ad_id</span>
              <input
                name="leonix_ad_id"
                defaultValue={firstParam(sp.leonix_ad_id) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <label className="flex min-w-[8rem] flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">owner_user_id</span>
              <input
                name="owner_user_id"
                defaultValue={firstParam(sp.owner_user_id) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs"
                autoComplete="off"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-[#2A2620] px-4 py-2 text-xs font-bold text-[#FAF7F2]"
            >
              Apply
            </button>
            <Link href={queueHref} className={`${adminBtnSecondary} inline-flex items-center text-xs`}>
              Clear filters
            </Link>
          </form>
        </div>
      ) : null}

      {!configured ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          Supabase admin is not configured in this environment (<code className="rounded bg-[#FBF7EF] px-1">SUPABASE_SERVICE_ROLE_KEY</code>
          ). No rows to show.
        </p>
      ) : rows.length === 0 ? (
        <p className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          {hasFilters ? "No results for these filters." : "Table exists but has no rows yet."}
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
                <th className="border-b border-[#E8DFD0] px-3 py-2">Business</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Slug</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Status</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Feat.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Verif.</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Owner</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Plan</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">City</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Cuisine / type</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Published</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Updated</th>
                <th
                  className="border-b border-[#E8DFD0] px-3 py-2"
                  title="Public + results. Status moderation in Actions column (same row; no staff content editor)."
                >
                  Links
                </th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Actions</th>
                <th className="border-b border-[#E8DFD0] px-3 py-2">Monetization</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cuisineBits = [r.primary_cuisine, r.secondary_cuisine].filter(Boolean).join(" · ");
                const summary = [cuisineBits || "—", r.business_type || ""].filter(Boolean).join(" · ");
                const resultsHref = `/clasificados/restaurantes/resultados?lang=es&q=${encodeURIComponent(r.business_name)}`;
                const highlighted = actionProof?.target === r.id;
                return (
                  <tr key={r.id} id={adminQueueRowAnchorId(r.id)} className={adminQueueRowClass(highlighted)}>
                    <td className="max-w-[140px] whitespace-nowrap px-3 py-2 font-mono text-[10px] font-bold text-[#5C4E2E]">
                      {r.leonix_ad_id ?? "—"}
                    </td>
                    <td className="max-w-[200px] px-3 py-2 font-semibold">{r.business_name}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{r.slug}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.promoted ? "yes" : "no"}</td>
                    <td className="px-3 py-2">{r.leonix_verified ? "yes" : "no"}</td>
                    <td className="max-w-[120px] truncate px-3 py-2 font-mono text-[10px]" title={r.owner_user_id ?? ""}>
                      {r.owner_user_id ?? "—"}
                    </td>
                    <td className="px-3 py-2">{r.package_tier ?? "—"}</td>
                    <td className="px-3 py-2">{r.city_canonical}</td>
                    <td className="max-w-[220px] px-3 py-2 text-[11px] text-[#5C5346]">{summary}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.published_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px]">{fmt(r.updated_at)}</td>
                    <td className="space-y-1 px-3 py-2">
                      <Link
                        href={`/clasificados/restaurantes/${encodeURIComponent(r.slug)}?lang=es`}
                        className="block font-semibold text-[#6B5B2E] underline"
                        target="_blank"
                        rel="noreferrer"
                        title="Public view. Business edit: advertiser flow, not Leonix staff."
                      >
                        View public
                      </Link>
                      <Link href={resultsHref} className="block text-[#6B5B2E] underline" target="_blank" rel="noreferrer">
                        Results
                      </Link>
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top">
                      <ClassifiedAdminRowActions
                        variant="restaurante"
                        rowId={r.id}
                        leonixAdId={r.leonix_ad_id}
                        displayLabel={r.business_name}
                        publicLive={r.status === "published"}
                        promoted={r.promoted}
                        verified={r.leonix_verified}
                        canArchive={r.status !== "archived"}
                        staffEditBoardHref={`/admin/workspace/clasificados/restaurantes?slug=${encodeURIComponent(r.slug)}`}
                        republishCategory="restaurantes"
                        republishRow={{
                          status: r.status,
                          republish_override: r.republish_override,
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <AdminListingMonetizationSummary
                        category="restaurantes"
                        source="restaurantes_public_listings"
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
