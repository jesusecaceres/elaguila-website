import Link from "next/link";
import Image from "next/image";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase, adminInputClass, adminTableWrap } from "@/app/admin/_components/adminTheme";
import { getAdminCatalogStats, listCatalogItemsAdmin } from "@/app/admin/_lib/tiendaCatalogAdminData";
import { TIENDA_CATEGORY_SLUGS } from "@/app/tienda/data/tiendaCategories";
import {
  TIENDA_CATALOG_CTA_MODES,
  TIENDA_CATALOG_PRICING_MODES,
} from "@/app/lib/tienda/tiendaCatalogTypes";
import { fetchPrimaryImageUrlForItems } from "@/app/lib/tienda/tiendaCatalogQueries";
import type { TiendaCatalogItemRow } from "@/app/lib/tienda/tiendaCatalogTypes";

export const dynamic = "force-dynamic";

function listHref(args: {
  q: string;
  cat: string;
  vis: string;
  cta: string;
  pricing: string;
  page: number;
}): string {
  const p = new URLSearchParams();
  if (args.q) p.set("q", args.q);
  if (args.cat) p.set("cat", args.cat);
  if (args.vis && args.vis !== "all") p.set("vis", args.vis);
  if (args.cta) p.set("cta", args.cta);
  if (args.pricing) p.set("pricing", args.pricing);
  if (args.page > 1) p.set("page", String(args.page));
  const s = p.toString();
  return s ? `/admin/tienda/catalog?${s}` : "/admin/tienda/catalog";
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function priceCols(item: TiendaCatalogItemRow): { label: string; base: string } {
  const label = item.price_label?.trim() ? item.price_label : "—";
  const base =
    item.base_price != null && String(item.base_price).length > 0
      ? `$${Number(item.base_price).toFixed(2)}`
      : "—";
  return { label, base };
}

function rowState(item: TiendaCatalogItemRow): string {
  if (item.is_hidden) return "Hidden";
  if (!item.is_live) return "Draft";
  return "Live";
}

export default async function AdminTiendaCatalogListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; vis?: string; cta?: string; pricing?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const cat = (sp.cat ?? "").trim();
  const cta = (sp.cta ?? "").trim();
  const pricing = (sp.pricing ?? "").trim();
  const visRaw = (sp.vis ?? "all").trim();
  const vis =
    visRaw === "live" || visRaw === "hidden" || visRaw === "draft" || visRaw === "all" ? visRaw : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = 40;
  const offset = (page - 1) * limit;

  const [stats, list] = await Promise.all([
    getAdminCatalogStats(),
    listCatalogItemsAdmin({
      search: q,
      categorySlug: cat || undefined,
      visibility: vis === "all" ? undefined : vis,
      ctaMode: cta,
      pricingMode: pricing,
      limit,
      offset,
    }),
  ]);

  const thumbs = await fetchPrimaryImageUrlForItems(list.rows.map((r) => r.id));
  const totalPages = Math.max(1, Math.ceil(list.total / limit));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Catálogo de Tienda"
        subtitle="Artículos que alimentan la vitrina: textos, precios, CTAs, visibilidad e imágenes. La fuente de verdad está en Supabase."
        helperText="Abre un artículo para subir fotos, elegir la imagen principal y ajustar precios. Los destacados en vitrina se controlan desde los mismos registros."
        rightSlot={
          <Link href="/admin/tienda/catalog/new" className={adminBtnPrimary}>
            + Nuevo artículo
          </Link>
        }
      />

      {stats.error ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Stats unavailable.</strong> {stats.error}
        </div>
      ) : null}

      {list.error ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load catalog.</strong> {list.error} If tables are missing, apply the Tienda catalog migration in Supabase.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Total items</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{stats.total}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Live (public)</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{stats.live}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Featured</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{stats.featured}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">This page</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{list.rows.length}</p>
          <p className="mt-1 text-xs text-[#7A7164]">of {list.total} matching</p>
        </div>
      </div>

      <form className={`${adminCardBase} flex flex-col gap-3 p-4 xl:flex-row xl:flex-wrap xl:items-end`} method="get">
        <div className="min-w-[160px] flex-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Search</label>
          <input name="q" defaultValue={q} placeholder="Title, slug, category…" className={adminInputClass} />
        </div>
        <div className="w-full sm:w-44">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Category</label>
          <select name="cat" defaultValue={cat} className={adminInputClass}>
            <option value="">All</option>
            {TIENDA_CATEGORY_SLUGS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Visibility</label>
          <select name="vis" defaultValue={vis} className={adminInputClass}>
            <option value="all">All</option>
            <option value="live">Live (public)</option>
            <option value="hidden">Hidden</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="w-full sm:w-52">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">CTA mode</label>
          <select name="cta" defaultValue={cta} className={adminInputClass}>
            <option value="">All</option>
            {TIENDA_CATALOG_CTA_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Pricing mode</label>
          <select name="pricing" defaultValue={pricing} className={adminInputClass}>
            <option value="">All</option>
            {TIENDA_CATALOG_PRICING_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={adminBtnPrimary}>
          Apply
        </button>
        <Link href="/admin/tienda/catalog" className={`${adminBtnPrimary} text-center opacity-90`}>
          Reset
        </Link>
      </form>

      <div className={adminTableWrap}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
            <tr>
              <th className="px-4 py-3 w-14">Img</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">CTA</th>
              <th className="px-4 py-3">Pricing</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Feat.</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-[#7A7164]">
                  No catalog items match these filters.
                </td>
              </tr>
            ) : (
              list.rows.map((row) => {
                const { label: pl, base: pb } = priceCols(row);
                const thumb = thumbs.get(row.id);
                return (
                  <tr key={row.id} className="border-b border-[#F0E8D8]/90 bg-white/60">
                    <td className="px-4 py-2">
                      {thumb ? (
                        <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-[#E8DFD0] bg-[#FAF7F2]">
                          <Image src={thumb} alt="" fill className="object-cover" sizes="56px" unoptimized />
                        </div>
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-[#E8DFD0] text-[#C9B46A] text-xs">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-[#1E1810] max-w-[200px] truncate" title={row.title_en}>
                        {row.title_en}
                      </div>
                      <div className="text-xs text-[#7A7164] max-w-[200px] truncate" title={row.title_es}>
                        {row.title_es}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-[#3D3629]">{row.slug}</td>
                    <td className="px-4 py-2 text-xs">{row.category_slug}</td>
                    <td className="px-4 py-2 text-xs">{row.cta_mode}</td>
                    <td className="px-4 py-2 text-xs">{row.pricing_mode}</td>
                    <td className="px-4 py-2 text-xs">
                      <div className="max-w-[140px] truncate" title={pl}>
                        {pl}
                      </div>
                      <div className="text-[#7A7164] tabular-nums">{pb}</div>
                    </td>
                    <td className="px-4 py-2 text-xs">{row.is_featured ? "Yes" : "—"}</td>
                    <td className="px-4 py-2 text-xs font-medium">{rowState(row)}</td>
                    <td className="px-4 py-2 text-xs text-[#5C5346]">{formatWhen(row.updated_at)}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-1">
                        <Link href={`/admin/tienda/catalog/${row.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                          Edit
                        </Link>
                        {row.is_live && !row.is_hidden ? (
                          <Link
                            href={`/tienda/catalog/${row.slug}`}
                            className="text-xs font-bold text-sky-800 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View public
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[#7A7164]">
            Page {page} / {totalPages}
          </span>
          {page > 1 ? (
            <Link className="font-bold text-[#6B5B2E] underline" href={listHref({ q, cat, vis, cta, pricing, page: page - 1 })}>
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link className="font-bold text-[#6B5B2E] underline" href={listHref({ q, cat, vis, cta, pricing, page: page + 1 })}>
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
