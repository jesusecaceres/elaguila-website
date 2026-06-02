import Link from "next/link";
import { getAdminLang, adminMessages } from "@/app/admin/_lib/adminI18n";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  fetchListingsForAdminWorkspaceFiltered,
  fetchListingCategoriesDistinct,
  isUuidString,
} from "@/app/admin/_lib/listingsAdminSelect";
import {
  appendPreservedSearchParams,
  parseAdminScope,
} from "@/app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosAdminScopeUrls";
import { getClasificadosCategoryRegistryMerged } from "@/app/lib/clasificados/clasificadosCategoryRegistry";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import AdminListingsTable from "./AdminListingsTable";
import { ClasificadosCategoryHub } from "./ClasificadosCategoryHub";
import { ClasificadosCategoryOpsAudit } from "./ClasificadosCategoryOpsAudit";
import { EnVentaModerationFields } from "@/app/clasificados/en-venta/admin/EnVentaModerationFields";
import { ClasificadosScopeNav } from "./_components/ClasificadosScopeNav";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionCard } from "../../../_components/AdminSectionCard";
import { adminCardBase, adminCtaChipCompact, adminCtaChipSecondary } from "../../../_components/adminTheme";

export const dynamic = "force-dynamic";

/** Registry slug for `listings.category` is `travel`; public routes use `/clasificados/viajes`. Normalize URL typos. */
function normalizeWorkspaceListingsCategoryParam(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const lower = t.toLowerCase();
  if (lower === "viajes") return "travel";
  return lower;
}

function listingCategorySelectValue(dbValue: string): string {
  const t = dbValue.trim();
  if (t.toLowerCase() === "viajes") return "travel";
  return t.trim().toLowerCase();
}

type Row = {
  id: string;
  leonix_ad_id?: string | null;
  title: string | null;
  description: string | null;
  city: string | null;
  category: string | null;
  price: number | null;
  is_free: boolean | null;
  status: string | null;
  owner_id: string | null;
  created_at: string | null;
  images?: unknown;
  detail_pairs?: unknown;
  republished_at?: string | null;
  republish_count?: number | null;
  republish_override?: boolean | null;
  is_published?: boolean | null;
  leonix_verified?: boolean | null;
  admin_promoted?: boolean | null;
};

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: string;
    status?: string;
    owner?: string;
    leonix_branch?: string;
    leonix_operation?: string;
    leonix_propiedad?: string;
    /** Max rows from Supabase for this view (50–500). */
    limit?: string;
    /** `live` — only publicly live rows (published + active). */
    scope?: string;
  }>;
};

/** Normalize `searchParams` values that may be `string | string[]`. */
function spStr(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return v[0];
  return "";
}

export default async function AdminClasificadosWorkspacePage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const supabase = getAdminSupabase();
  const sp = (props.searchParams ? await props.searchParams : {}) as Record<string, string | string[] | undefined>;
  const scopeParam = parseAdminScope(sp);
  const qInput = spStr(sp.q).trim();
  const qRaw = qInput.toLowerCase();
  const catFilter = normalizeWorkspaceListingsCategoryParam(spStr(sp.category));
  const statusFilter = spStr(sp.status).trim().toLowerCase();
  const ownerFrag = spStr(sp.owner).trim().toLowerCase();
  const lxBranch = spStr(sp.leonix_branch).trim();
  const lxOp = spStr(sp.leonix_operation).trim().toLowerCase();
  const lxProp = spStr(sp.leonix_propiedad).trim().toLowerCase();
  const limitRaw = Number(spStr(sp.limit) || "300");
  const queueLimit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 50), 500) : 300;

  const [{ data: listings, error, detailPairsAvailable, republishColsAvailable }, cats, registry] = await Promise.all([
    fetchListingsForAdminWorkspaceFiltered(supabase, {
      q: qInput || undefined,
      category: catFilter,
      status: statusFilter || undefined,
      ownerFrag: ownerFrag && isUuidString(ownerFrag) ? ownerFrag : undefined,
      limit: queueLimit,
      ...(scopeParam === "live" ? { scope: "live" as const } : {}),
    }),
    fetchListingCategoriesDistinct(supabase),
    getClasificadosCategoryRegistryMerged(),
  ]);

  let rows = (listings ?? []) as Row[];
  if (ownerFrag && !isUuidString(ownerFrag)) {
    rows = rows.filter((r) => (r.owner_id ?? "").toLowerCase().includes(ownerFrag));
  }
  if (detailPairsAvailable && (lxBranch || lxOp || lxProp)) {
    rows = rows.filter((r) => {
      const lx = parseLeonixListingContract(r.detail_pairs);
      if (lxBranch && lx.branch !== lxBranch) return false;
      if (lxOp && lx.operation !== lxOp) return false;
      if (lxProp && (lx.categoriaPropiedad ?? "").toLowerCase() !== lxProp) return false;
      return true;
    });
  }

  const workspaceBase = "/admin/workspace/clasificados";
  const queueNavHref = appendPreservedSearchParams(workspaceBase, sp, null);
  const liveNavHref = appendPreservedSearchParams(workspaceBase, sp, "live");

  return (
    <>
      <AdminPageHeader
        title={m("clasificados.title")}
        subtitle={m("clasificados.subtitle")}
        eyebrow={m("clasificados.eyebrow")}
        helperText={m("clasificados.helper", { limit: queueLimit })}
      />

      <div className={`${adminCardBase} mb-4 max-w-3xl space-y-2 p-4 text-sm text-[#5C5346]`}>
        <p className="text-xs font-bold uppercase text-[#7A7164]">{m("scopeNav.aria")}</p>
        <ClasificadosScopeNav
          lang={lang}
          queueHref={queueNavHref}
          liveHref={liveNavHref}
          active={scopeParam === "live" ? "live" : "queue"}
        />
      </div>

      <ClasificadosCategoryHub registry={registry} lang={lang} />

      <ClasificadosCategoryOpsAudit registry={registry} lang={lang} />

      {!detailPairsAvailable ? (
        <div
          className={`${adminCardBase} mb-4 max-w-3xl border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}
          role="status"
        >
          <strong className="font-bold">{m("clasificados.detailPairsMissingTitle")}</strong> {m("clasificados.detailPairsMissingBody")}{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20250316200000_listings_detail_pairs.sql</code> or{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20260407140000_ensure_listings_detail_pairs.sql</code> (idempotent)
          and reload.
        </div>
      ) : null}

      {detailPairsAvailable && !republishColsAvailable ? (
        <div
          className={`${adminCardBase} mb-4 max-w-3xl border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}
          role="status"
        >
          <strong className="font-bold">Republish columns missing</strong> Apply{" "}
          <code className="rounded bg-white/80 px-1 text-[11px]">20260509120000_classifieds_republish_capability.sql</code> in Supabase and
          reload.
        </div>
      ) : null}

      <div className={`${adminCardBase} mb-4 max-w-3xl space-y-3 p-4 text-xs text-[#5C5346]`}>
        <p>
          <strong className="text-[#1E1810]">{m("clasificados.homeChipsTitle")}</strong> {m("clasificados.homeChipsBody")}
        </p>
        <Link href="/admin/workspace/home/content" className={`${adminCtaChipSecondary} inline-flex text-xs`}>
          {m("clasificados.homeContentCta")}
        </Link>
      </div>

      <div className={`${adminCardBase} mb-4 max-w-3xl p-4 text-xs text-[#5C5346]`}>
        <strong className="text-[#1E1810]">{m("clasificados.brHintTitle")}</strong> {m("clasificados.brHintBody")}{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">/clasificados/bienes-raices/preview/*</code>,{" "}
        <code className="rounded bg-white/80 px-1 text-[11px]">/clasificados/rentas/preview/*</code>.
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/admin/workspace/clasificados/autos"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#C9B46A]/55 bg-[#FBF7EF] px-4 py-2.5 text-center text-sm font-bold text-[#5C4E2E] shadow-sm transition hover:bg-[#F4EFE4] sm:min-h-10"
          title={m("clasificados.autosTitle")}
        >
          {m("clasificados.autosCta")}
        </Link>
        <Link
          href="/admin/workspace/clasificados/servicios"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-dashed border-[#7A9E6F]/55 bg-[#F4FAF2] px-4 py-2.5 text-center text-sm font-bold text-[#2C4A22] shadow-sm transition hover:bg-[#E8F4E4] sm:min-h-10"
          title={m("clasificados.serviciosTitle")}
        >
          {m("clasificados.serviciosCta")}
        </Link>
        <Link
          href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF}
          className={`${adminCtaChipSecondary} justify-center text-sm`}
          title={m("clasificados.categoriesAdvancedTitle")}
        >
          {m("clasificados.categoriesCta")}
        </Link>
        <Link
          href="/admin/reportes"
          className={`${adminCtaChipSecondary} justify-center text-sm`}
          title={m("clasificados.reportesTitle")}
        >
          {m("clasificados.reportesCta")}
        </Link>
      </div>

      <div className={`${adminCardBase} mb-6 p-4`}>
        <form className="flex flex-col gap-3" method="get" aria-describedby="clasificados-filter-hint">
          {scopeParam === "live" ? <input type="hidden" name="scope" value="live" /> : null}
          <p id="clasificados-filter-hint" className="text-[10px] leading-snug text-[#7A7164]">
            {m("clasificados.filterHint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <input
              name="q"
              defaultValue={qInput}
              placeholder={m("clasificados.placeholderQ")}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-base sm:min-w-[12rem] sm:flex-1 sm:py-2 sm:text-sm"
              aria-describedby="clasificados-filter-hint"
              autoComplete="off"
            />
            <input
              name="owner"
              defaultValue={ownerFrag}
              placeholder="Owner ID (fragmento)"
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-4 py-3 text-base sm:w-auto sm:min-w-[11rem] sm:py-2 sm:text-sm"
            />
            <select
              name="category"
              defaultValue={catFilter ?? ""}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[10rem] sm:py-2 sm:text-sm"
            >
              <option value="">{m("common.allCategories")}</option>
              {cats.map((c) => (
                <option key={c} value={listingCategorySelectValue(c)}>
                  {c}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[9rem] sm:py-2 sm:text-sm"
            >
              <option value="">{m("common.allStatuses")}</option>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="flagged">flagged</option>
              <option value="unpublished">unpublished</option>
              <option value="sold">sold</option>
              <option value="removed">removed</option>
            </select>
            <select
              name="limit"
              defaultValue={String(queueLimit)}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[8rem] sm:py-2 sm:text-sm"
              title={m("clasificados.limitTitle")}
              aria-label={m("clasificados.limitAria")}
            >
              <option value="100">100 {m("common.rows")}</option>
              <option value="200">200 {m("common.rows")}</option>
              <option value="300">300 {m("common.rows")}</option>
              <option value="400">400 {m("common.rows")}</option>
              <option value="500">500 {m("common.rows")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 border-t border-[#E8DFD0]/60 pt-3 sm:flex-row sm:flex-wrap sm:items-end">
            <p className="w-full text-[11px] font-semibold uppercase tracking-wide text-[#5C5346] sm:mb-1">
              {m("clasificados.leonixFilters")}
            </p>
            <select
              name="leonix_branch"
              defaultValue={lxBranch}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[12rem] sm:py-2 sm:text-sm"
            >
              <option value="">{m("clasificados.branchAll")}</option>
              <option value="bienes_raices_privado">bienes_raices_privado</option>
              <option value="bienes_raices_negocio">bienes_raices_negocio</option>
              <option value="rentas_privado">rentas_privado</option>
              <option value="rentas_negocio">rentas_negocio</option>
            </select>
            <select
              name="leonix_operation"
              defaultValue={lxOp}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[9rem] sm:py-2 sm:text-sm"
            >
              <option value="">{m("clasificados.operationAll")}</option>
              <option value="sale">{m("clasificados.operationSale")}</option>
              <option value="rent">{m("clasificados.operationRent")}</option>
            </select>
            <select
              name="leonix_propiedad"
              defaultValue={lxProp}
              className="w-full min-w-0 rounded-2xl border border-[#E8DFD0] bg-white px-3 py-3 text-base sm:w-auto sm:min-w-[10rem] sm:py-2 sm:text-sm"
            >
              <option value="">{m("clasificados.propTypeAll")}</option>
              <option value="residencial">residencial</option>
              <option value="comercial">comercial</option>
              <option value="terreno_lote">terreno_lote</option>
            </select>
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-2xl bg-[#2A2620] px-4 py-3 text-sm font-semibold text-[#FAF7F2] sm:min-h-0 sm:w-auto sm:py-2"
              title={m("clasificados.applyFiltersTitle")}
            >
              {m("common.applyFilters")}
            </button>
          </div>
        </form>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminListingsTable
          listings={rows}
          detailPairsAvailable={detailPairsAvailable}
          republishColsAvailable={republishColsAvailable}
          listingsCategorySlug={catFilter}
          staffQueueMode
        />
      )}

      <AdminSectionCard title={m("clasificados.envSectionTitle")} subtitle={m("clasificados.envSectionSubtitle")}>
        <EnVentaModerationFields lang={lang} />
      </AdminSectionCard>

      <div className="mt-8">
        <Link href="/admin/workspace" className={`${adminCtaChipCompact} inline-flex text-sm`}>
          {m("clasificados.backWorkspace")}
        </Link>
      </div>
    </>
  );
}
