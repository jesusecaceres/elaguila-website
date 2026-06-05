import Link from "next/link";
import { Suspense } from "react";

import {
  ADMIN_QUEUE_DEFAULT_LIMIT,
  normalizeAdminQueueLimit,
} from "@/app/admin/_lib/adminQueueActionFlow";
import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { ClasificadosQueueActionChrome } from "../_components/ClasificadosQueueActionChrome";
import { ClasificadosQueueHeader } from "../_components/ClasificadosQueueHeader";
import { ClasificadosScopeNav } from "../_components/ClasificadosScopeNav";
import { clasificadosQueueSurfaceForSlug } from "../_lib/clasificadosQueueSurfaceMeta";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "../_lib/clasificadosAdminScopeUrls";
import { getAdminLang } from "@/app/admin/_lib/adminI18n";
import { adminMessages } from "@/app/admin/_lib/adminStrings";
import { ComidaLocalAdminListings } from "@/app/lib/clasificados/comida-local/ComidaLocalAdminListings";
import { listAdminComidaLocalListings } from "@/app/lib/clasificados/comida-local/comidaLocalAdminQueries";
import { mapComidaLocalRowsToAdminVms } from "@/app/lib/clasificados/comida-local/mapComidaLocalAdminListing";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { updateComidaLocalPublicListingStatusAction } from "./actions";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminComidaLocalPublicListingsPage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const configured = isSupabaseAdminConfigured();
  const sp = props.searchParams ? await props.searchParams : {};
  const scope = parseAdminScope(sp);
  const basePath = "/admin/workspace/clasificados/comida-local";
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
  const inspectId = firstParam(sp.id) ?? null;

  const rowsRaw = configured
    ? await listAdminComidaLocalListings(getAdminSupabase(), {
        limit: queueLimit,
        scope: scope === "live" ? "live" : "queue",
        q: firstParam(sp.q),
        slug: firstParam(sp.slug),
        id: firstParam(sp.id),
        leonix_ad_id: firstParam(sp.leonix_ad_id),
        owner_user_id: firstParam(sp.owner_user_id),
      })
    : [];

  const items = mapComidaLocalRowsToAdminVms(rowsRaw, lang === "en" ? "en" : "es");

  const surface = clasificadosQueueSurfaceForSlug("comida-local");
  const pageTitle =
    scope === "live"
      ? m("listingsCategoryOps.titleLive", { slug: "comida-local" })
      : m("listingsCategoryOps.titleQueue", { slug: "comida-local" });
  const pageSubtitle =
    scope === "live" ? m("listingsCategoryOps.subLive") : m("listingsCategoryOps.subQueue");

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        title={pageTitle}
        sourceTable={surface.sourceTable}
        subtitle={pageSubtitle}
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
        rightSlot={
          <ClasificadosScopeNav
            lang={lang}
            queueHref={queueHref}
            liveHref={liveHref}
            active={scope === "live" ? "live" : "queue"}
          />
        }
      />

      <Suspense fallback={null}>
        <ClasificadosQueueActionChrome />
      </Suspense>

      {configured ? (
        <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm text-[#5C5346]`}>
          <p className="font-bold text-[#1E1810]">{m("listingsCategoryOps.searchTitle")}</p>
          <form className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end" method="get" action={basePath}>
            {scope === "live" ? <input type="hidden" name="scope" value="live" /> : null}
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs">
              <span className="font-semibold text-[#5C5346]">
                q (Leonix ID, UUID, owner, slug, negocio, ciudad)
              </span>
              <input
                name="q"
                defaultValue={firstParam(sp.q) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
                placeholder="COMIDA-2026-000001 o tacos-el-chuy"
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
            <button type="submit" className={adminBtnSecondary}>
              {m("listingsCategoryOps.searchSubmit")}
            </button>
            {hasFilters ? (
              <Link href={scope === "live" ? liveHref : queueHref} className={adminBtnSecondary}>
                {m("listingsCategoryOps.clearFilters")}
              </Link>
            ) : null}
          </form>
        </div>
      ) : (
        <p className="text-sm text-amber-900">Supabase admin no configurado.</p>
      )}

      <ComidaLocalAdminListings
        lang={lang === "en" ? "en" : "es"}
        items={items}
        inspectId={inspectId}
        statusUpdateAction={configured ? updateComidaLocalPublicListingStatusAction : undefined}
      />
    </div>
  );
}
