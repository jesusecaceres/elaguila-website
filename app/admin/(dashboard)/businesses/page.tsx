import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../_lib/businessWorkspaceAccess";
import { listBusinessesForWorkspace } from "../../_lib/businessWorkspaceData";
import { BUSINESS_SALES_STATUSES, labelFrom, type BusinessSalesStatus } from "../../_lib/salesWorkspaceLogic";
import { BROAD_BUSINESS_TYPES, BUSINESS_STAGES } from "@/app/lib/business/constants";
import { countriesSortedByLabel, countryLabel } from "@/app/lib/business/countries";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  category?: string;
  stage?: string;
  country?: string;
  status?: string;
  hasPhone?: string;
  hasEmail?: string;
  hasWhatsapp?: string;
  hasWebsite?: string;
  hasAds?: string;
};

function statusBadgeClass(status: BusinessSalesStatus): string {
  switch (status) {
    case "new":
      return "bg-[#EDE6D6] text-[#3D3428]";
    case "needs_review":
      return "bg-amber-100 text-amber-900";
    case "ready_to_contact":
      return "bg-blue-100 text-blue-900";
    case "contacted":
      return "bg-sky-100 text-sky-900";
    case "follow_up_due":
      return "bg-orange-100 text-orange-900";
    case "waiting_on_owner":
      return "bg-purple-100 text-purple-900";
    case "not_a_fit_right_now":
      return "bg-neutral-200 text-neutral-700";
    case "active_client":
      return "bg-emerald-100 text-emerald-900";
    case "archived":
      return "bg-neutral-100 text-neutral-500";
    default:
      return "bg-[#EDE6D6] text-[#3D3428]";
  }
}

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function AdminBusinessesListPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_list")) {
    redirect("/admin/team?access_denied=1");
  }

  const sp = (await searchParams) ?? {};
  const toBool = (v: string | undefined) => (v === "true" ? true : v === "false" ? false : undefined);

  const { items, total } = await listBusinessesForWorkspace({
    keyword: sp.q,
    broadBusinessType: sp.category,
    businessStage: sp.stage,
    country: sp.country,
    status: sp.status as BusinessSalesStatus | undefined,
    hasPhone: toBool(sp.hasPhone),
    hasEmail: toBool(sp.hasEmail),
    hasWhatsapp: toBool(sp.hasWhatsapp),
    hasWebsite: toBool(sp.hasWebsite),
    hasConnectedAds: toBool(sp.hasAds),
    limit: 100,
  });

  const countryOptions = countriesSortedByLabel("en");
  const activeFilterCount = [sp.category, sp.stage, sp.country, sp.status, sp.hasPhone, sp.hasEmail, sp.hasWhatsapp, sp.hasWebsite, sp.hasAds].filter(Boolean).length;

  return (
    <div className="max-w-6xl space-y-6">
      <AdminPageHeader
        title="Businesses"
        eyebrow="Sales workspace"
        subtitle="Confirmed Business Identity records — find a business, see what's missing, and prepare for contact."
        helperText="This is the Sales Team Business Workspace. It shows the same trusted Business Identity record the entrepreneur completed — never a second, conflicting source of truth."
      />

      {/* Filters — plain GET form so every view is a shareable/refreshable URL. */}
      <form method="get" className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="q" className="block text-xs font-semibold text-[#3D3428]">
              Keyword
            </label>
            <input id="q" name="q" defaultValue={sp.q ?? ""} placeholder="Business name…" className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-[#3D3428]">
              Category
            </label>
            <select id="category" name="category" defaultValue={sp.category ?? ""} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              <option value="">Any</option>
              {BROAD_BUSINESS_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="stage" className="block text-xs font-semibold text-[#3D3428]">
              Stage
            </label>
            <select id="stage" name="stage" defaultValue={sp.stage ?? ""} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              <option value="">Any</option>
              {BUSINESS_STAGES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="country" className="block text-xs font-semibold text-[#3D3428]">
              Country
            </label>
            <select id="country" name="country" defaultValue={sp.country ?? ""} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              <option value="">Any</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-xs font-semibold text-[#3D3428]">
              Status
            </label>
            <select id="status" name="status" defaultValue={sp.status ?? ""} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
              <option value="">Any</option>
              {BUSINESS_SALES_STATUSES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.en}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-1 text-xs font-semibold text-[#3D3428]">
            <label className="flex min-h-[32px] items-center gap-1.5">
              <input type="checkbox" name="hasPhone" value="true" defaultChecked={sp.hasPhone === "true"} className="h-4 w-4" /> Has phone
            </label>
            <label className="flex min-h-[32px] items-center gap-1.5">
              <input type="checkbox" name="hasWhatsapp" value="true" defaultChecked={sp.hasWhatsapp === "true"} className="h-4 w-4" /> Has WhatsApp
            </label>
          </div>
          <div className="flex flex-col justify-end gap-1 text-xs font-semibold text-[#3D3428]">
            <label className="flex min-h-[32px] items-center gap-1.5">
              <input type="checkbox" name="hasEmail" value="true" defaultChecked={sp.hasEmail === "true"} className="h-4 w-4" /> Has email
            </label>
            <label className="flex min-h-[32px] items-center gap-1.5">
              <input type="checkbox" name="hasWebsite" value="true" defaultChecked={sp.hasWebsite === "true"} className="h-4 w-4" /> Has website
            </label>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex min-h-[32px] items-center gap-1.5 text-xs font-semibold text-[#3D3428]">
              <input type="checkbox" name="hasAds" value="true" defaultChecked={sp.hasAds === "true"} className="h-4 w-4" /> Has connected ad
            </label>
            <div className="flex gap-2">
              <button type="submit" className="min-h-[40px] flex-1 rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white">
                Apply filters
              </button>
              {activeFilterCount > 0 || sp.q ? (
                <Link href="/admin/businesses" className="flex min-h-[40px] items-center justify-center rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-xs font-semibold text-[#3D3428]">
                  Clear all
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </form>

      <p className="text-xs text-[#7A7164]">
        {total} business{total === 1 ? "" : "es"} found.
      </p>

      {/* Mobile: cards. Desktop: table. No horizontal scroll on mobile. */}
      <ul className="space-y-3 lg:hidden">
        {items.map((item) => (
          <li key={item.business.id}>
            <Link
              href={`/admin/businesses/${item.business.id}`}
              className="block rounded-2xl border border-[#E8DFD0] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold text-[#1E1810]">{item.business.displayName}</p>
                  {item.business.publicName ? <p className="break-words text-xs text-[#7A7164]">{item.business.publicName}</p> : null}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${statusBadgeClass(item.salesStatus)}`}>
                  {labelFrom(BUSINESS_SALES_STATUSES, item.salesStatus, "en")}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5C5346]">
                {labelFrom(BROAD_BUSINESS_TYPES, item.business.broadBusinessType, "en")} · {labelFrom(BUSINESS_STAGES, item.business.businessStage, "en")}
              </p>
              <p className="mt-1 text-xs text-[#7A7164]">
                {item.primaryCountry ? countryLabel(item.primaryCountry, "en") : "—"}
                {item.primaryCity ? ` · ${item.primaryCity}` : ""}
              </p>
              <p className="mt-2 text-[11px] text-[#7A7164]">
                {item.completenessMet}/{item.completenessTotal} complete · {item.connectedAdCount} ad{item.connectedAdCount === 1 ? "" : "s"}
                {item.nextFollowUpDate ? ` · Follow-up ${item.nextFollowUpDate}` : ""}
              </p>
            </Link>
          </li>
        ))}
        {items.length === 0 ? <li className="rounded-2xl border border-dashed border-[#E8DFD0] p-6 text-center text-sm text-[#7A7164]">No businesses match these filters.</li> : null}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-[#E8DFD0] bg-white lg:block">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category / stage</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Ads</th>
              <th className="px-4 py-3">Complete</th>
              <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.business.id} className="border-b border-[#F3EBDD] last:border-b-0 hover:bg-[#FAF7F2]/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/businesses/${item.business.id}`} className="font-semibold text-[#1E1810] hover:underline">
                    {item.business.displayName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-[#5C5346]">
                  {labelFrom(BROAD_BUSINESS_TYPES, item.business.broadBusinessType, "en")}
                  <br />
                  {labelFrom(BUSINESS_STAGES, item.business.businessStage, "en")}
                </td>
                <td className="px-4 py-3 text-xs text-[#5C5346]">
                  {item.primaryCountry ? countryLabel(item.primaryCountry, "en") : "—"}
                  {item.primaryCity ? `, ${item.primaryCity}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-[#5C5346]">{item.connectedAdCount}</td>
                <td className="px-4 py-3 text-xs text-[#5C5346]">
                  {item.completenessMet}/{item.completenessTotal}
                </td>
                <td className="px-4 py-3 text-xs text-[#5C5346]">{item.nextFollowUpDate ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusBadgeClass(item.salesStatus)}`}>{labelFrom(BUSINESS_SALES_STATUSES, item.salesStatus, "en")}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[#7A7164]">{new Date(item.business.updatedAt).toLocaleDateString("en-US")}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#7A7164]">
                  No businesses match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
