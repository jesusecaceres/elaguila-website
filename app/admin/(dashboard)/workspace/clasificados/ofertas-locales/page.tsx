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
import {
  listOfertasLocalesAdminRows,
  mapOfertaLocalAdminRowToDetailVm,
  mapOfertasLocalesAdminRowsToListVms,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminHelpers";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import { OfertasLocalesAdminReviewList } from "./OfertasLocalesAdminReviewList";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOfertasLocalesReviewPage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const configured = isSupabaseAdminConfigured();
  const sp = props.searchParams ? await props.searchParams : {};
  const scopeParam = parseAdminScope(sp);
  const scope = scopeParam === "live" ? "live" : "queue";
  const basePath = "/admin/workspace/clasificados/ofertas-locales";
  const queueHref = appendPreservedSearchParams(basePath, sp, null);
  const liveHref = appendPreservedSearchParams(basePath, sp, "live");
  const hasFilters = !!(firstParam(sp.q) || firstParam(sp.id) || firstParam(sp.owner_id));
  const queueLimit = normalizeAdminQueueLimit(firstParam(sp.limit), ADMIN_QUEUE_DEFAULT_LIMIT);
  const inspectId = firstParam(sp.id) ?? null;

  const rowsRaw = configured
    ? await listOfertasLocalesAdminRows(getAdminSupabase(), {
        limit: queueLimit,
        scope,
        q: firstParam(sp.q),
        id: firstParam(sp.id),
        owner_id: firstParam(sp.owner_id),
      })
    : [];

  const items = mapOfertasLocalesAdminRowsToListVms(rowsRaw);
  const inspectRow = inspectId ? rowsRaw.find((r) => r.id === inspectId) ?? null : null;
  const inspectItem = inspectRow ? mapOfertaLocalAdminRowToDetailVm(inspectRow) : null;

  const surface = clasificadosQueueSurfaceForSlug("ofertas-locales");
  const pageTitle =
    scope === "live"
      ? m("listingsCategoryOps.titleLive", { slug: "ofertas-locales" })
      : m("listingsCategoryOps.titleQueue", { slug: "ofertas-locales" });
  const pageSubtitle =
    scope === "live"
      ? "Ofertas aprobadas — visibles en /clasificados/ofertas-locales"
      : "Envíos pending_review — aprobación admin requerida antes de publicar";

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
              <span className="font-semibold text-[#5C5346]">q (negocio, oferta, ciudad, ZIP, UUID)</span>
              <input
                name="q"
                defaultValue={firstParam(sp.q) ?? ""}
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 font-mono text-xs text-[#1E1810]"
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
              <span className="font-semibold text-[#5C5346]">owner_id</span>
              <input
                name="owner_id"
                defaultValue={firstParam(sp.owner_id) ?? ""}
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

      <OfertasLocalesAdminReviewList
        items={items}
        inspectItem={inspectItem}
        basePath={basePath}
        scope={scope}
        reviewEnabled={configured}
      />
    </div>
  );
}
