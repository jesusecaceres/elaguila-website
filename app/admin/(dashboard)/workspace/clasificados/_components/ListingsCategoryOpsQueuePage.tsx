import Link from "next/link";

import { adminBtnSecondary, adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  fetchListingsForAdminWorkspaceFiltered,
  isUuidString,
} from "@/app/admin/_lib/listingsAdminSelect";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { clasificadosQueueSurfaceForSlug } from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";

import AdminListingsTable, { type AdminListingsTableRow } from "../AdminListingsTable";
import { ClasificadosQueueHeader } from "./ClasificadosQueueHeader";

export const dynamic = "force-dynamic";

function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return undefined;
}

type PageProps = {
  categorySlug: string;
  title: string;
  subtitle?: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function ListingsCategoryOpsQueuePage({ categorySlug, title, subtitle, searchParams }: PageProps) {
  const configured = isSupabaseAdminConfigured();
  const sp = searchParams ? await searchParams : {};
  const qInput = firstParam(sp.q) ?? "";
  const statusFilter = (firstParam(sp.status) ?? "").trim().toLowerCase();
  const ownerFrag = (firstParam(sp.owner) ?? "").trim().toLowerCase();
  const limitRaw = Number(firstParam(sp.limit) ?? "400");
  const queueLimit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 50), 500) : 400;

  const surface = clasificadosQueueSurfaceForSlug(categorySlug);

  const supabase = getAdminSupabase();
  const fetchRes = configured
    ? await fetchListingsForAdminWorkspaceFiltered(supabase, {
        q: qInput || undefined,
        category: categorySlug,
        status: statusFilter || undefined,
        ownerFrag: ownerFrag && isUuidString(ownerFrag) ? ownerFrag : undefined,
        limit: queueLimit,
      })
    : { data: [], error: null, detailPairsAvailable: true, republishColsAvailable: true };

  let rows = (fetchRes.data ?? []) as AdminListingsTableRow[];
  if (ownerFrag && !isUuidString(ownerFrag)) {
    rows = rows.filter((r) => (r.owner_id ?? "").toLowerCase().includes(ownerFrag));
  }

  return (
    <div className="max-w-[1200px] space-y-6">
      <ClasificadosQueueHeader
        title={title}
        sourceTable={surface.sourceTable}
        subtitle={
          subtitle ??
          `Cola filtrada por categoría “${categorySlug}”. Acciones staff y enlace Editar por fila.`
        }
        publicHref={surface.publicHref}
        publishHref={surface.publishHref}
      />

      {configured ? (
        <div className={`${adminCardBase} mb-4 space-y-3 p-4 text-sm text-[#5C5346]`}>
          <p className="font-bold text-[#1E1810]">Buscar cola</p>
            <form
              className="flex flex-col flex-wrap gap-2 sm:flex-row sm:items-end"
              method="get"
              action={`/admin/workspace/clasificados/${encodeURIComponent(categorySlug)}`}
            >
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
              Aplicar
            </button>
            <Link
              href={`/admin/workspace/clasificados/${encodeURIComponent(categorySlug)}`}
              className={`${adminBtnSecondary} inline-flex items-center text-xs`}
            >
              Limpiar
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
