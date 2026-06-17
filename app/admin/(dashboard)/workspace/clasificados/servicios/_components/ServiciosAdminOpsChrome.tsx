import Link from "next/link";
import { ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF } from "@/app/admin/_lib/adminGlobalNav";
import { adminInputClass } from "@/app/admin/_components/adminTheme";
import { AdminDashboardCta } from "@/app/admin/_components/AdminDashboardCta";

export function ServiciosAdminFilterPanel({
  serviciosBase,
  queueHref,
  scopeLive,
  filters,
  searchHint,
}: {
  serviciosBase: string;
  queueHref: string;
  scopeLive: boolean;
  filters: {
    q?: string;
    slug?: string;
    id?: string;
    leonix_ad_id?: string;
    owner_user_id?: string;
  };
  searchHint: string;
}) {
  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-[#E8DFD0]/80 bg-[#FFFCF7]/95 p-4 sm:p-5" data-testid="servicios-admin-filter-panel">
      <p className="text-sm font-bold text-[#1E1810]">Filter queue</p>
      <p className="text-xs leading-relaxed text-[#7A7164]">{searchHint}</p>
      <form className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" method="get" action={serviciosBase}>
        {scopeLive ? <input type="hidden" name="scope" value="live" /> : null}
        {(
          [
            ["q", "Search q", filters.q ?? "", "UUID, URL, business, email…"],
            ["slug", "slug", filters.slug ?? "", ""],
            ["id", "id", filters.id ?? "", ""],
            ["leonix_ad_id", "leonix_ad_id", filters.leonix_ad_id ?? "", ""],
            ["owner_user_id", "owner_user_id", filters.owner_user_id ?? "", ""],
          ] as const
        ).map(([name, label, value, placeholder]) => (
          <label key={name} className="flex min-w-0 flex-col gap-1 text-xs">
            <span className="font-semibold text-[#5C5346]">{label}</span>
            <input
              name={name}
              defaultValue={value}
              placeholder={placeholder}
              className={adminInputClass}
              autoComplete="off"
            />
          </label>
        ))}
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#6B1A26] bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6B1A26] sm:w-auto"
          >
            Apply filters
          </button>
          <Link
            href={queueHref}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2.5 text-sm font-semibold text-[#3D3428] hover:bg-[#FFFCF7] sm:w-auto"
          >
            Clear
          </Link>
        </div>
      </form>
    </div>
  );
}

export function ServiciosAdminQuickActions({
  queueHref,
  liveHref,
  publicHref,
  publishHref,
}: {
  queueHref: string;
  liveHref: string;
  publicHref: string;
  publishHref?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" data-testid="servicios-admin-quick-actions">
      <AdminDashboardCta href={queueHref} label="Ad queue →" variant="primary" title="Full Servicios admin queue" />
      <AdminDashboardCta href={liveHref} label="Live listings →" variant="active" title="Published Servicios only" />
      <AdminDashboardCta href={publicHref} label="Public view →" variant="view" external title="Public Servicios directory" />
      {publishHref ? (
        <AdminDashboardCta href={publishHref} label="Publish →" variant="view" external title="Servicios publish entry" />
      ) : null}
      <AdminDashboardCta href="/admin/workspace/clasificados" label="Clasificados hub →" variant="neutral" />
      <AdminDashboardCta href={ADMIN_CATEGORIES_ADVANCED_REGISTRY_HREF} label="Advanced registry →" variant="premium" />
    </div>
  );
}
