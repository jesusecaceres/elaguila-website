import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { AdminSectionCard } from "../../_components/AdminSectionCard";
import { adminCardBase, adminInputClass, adminBtnPrimary, adminBtnSecondary, adminLinkAccent } from "../../_components/adminTheme";
import {
  ADMIN_GUIDE_ENTRIES,
  isAdminGuideRouteAccessible,
  searchAdminGuide,
  type AdminGuideEntry,
} from "../../_lib/adminGuideRegistry";
import type { AdminGlobalNavGroup } from "../../_lib/adminGlobalNav";
import { getAllowedGlobalNavHrefs, getCurrentAdminAccessContext } from "../../_lib/adminAccessControl";

export const dynamic = "force-dynamic";

const DOMAIN_LABELS: Record<AdminGlobalNavGroup, string> = {
  command: "Command",
  revenue: "Revenue",
  "marketplace-ops": "Marketplace Ops",
  people: "People",
  "website-control": "Website Control",
  system: "System",
};

const DOMAIN_ORDER: AdminGlobalNavGroup[] = ["command", "revenue", "marketplace-ops", "people", "website-control", "system"];

function parseDomainFilter(raw: string | undefined): AdminGlobalNavGroup | null {
  return DOMAIN_ORDER.find((d) => d === raw) ?? null;
}

/** Curated "I need to..." shortcuts — pre-built Guide Search queries, not separate content. */
const QUICK_TASKS: { label: string; query: string }[] = [
  { label: "A payment failed", query: "failed payment" },
  { label: "Turn off a listing", query: "turn off listing" },
  { label: "Add a new staff login", query: "create employee" },
  { label: "Update a staff contact page", query: "staff contact" },
  { label: "Change the homepage", query: "change homepage" },
  { label: "Check a support ticket", query: "support ticket" },
  { label: "Create a promo code", query: "promo code" },
  { label: "Check if a provider is down", query: "system health" },
  { label: "What does Needs Triage mean?", query: "needs triage" },
  { label: "Find a customer", query: "where are users" },
];

type PageProps = {
  searchParams?: Promise<{ q?: string; domain?: string }>;
};

export default async function AdminGuidePage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const domainFilter = parseDomainFilter(sp.domain);

  const access = await getCurrentAdminAccessContext();
  const allowedHrefs = getAllowedGlobalNavHrefs(access);

  const searchResults = q ? searchAdminGuide(q) : [];

  const entriesByDomain: Record<AdminGlobalNavGroup, AdminGuideEntry[]> = {
    command: [],
    revenue: [],
    "marketplace-ops": [],
    people: [],
    "website-control": [],
    system: [],
  };
  for (const entry of ADMIN_GUIDE_ENTRIES) entriesByDomain[entry.domain].push(entry);

  return (
    <div className="min-w-0 max-w-4xl overflow-x-hidden">
      <AdminPageHeader
        eyebrow="Operations Manual"
        title="Admin Guide"
        subtitle="How to operate Leonix — what each area is for, how to use it, and what to do when something breaks. This is separate from Company Search: use Customer Ops to find a real record; use this to learn where things live."
        helperText="This Guide never depends on LEO. Every answer here also works if LEO is completely unavailable."
      />

      <div className={`${adminCardBase} mb-6 p-4 sm:p-5`}>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="admin-guide-q" className="sr-only">
            Search the Admin Guide
          </label>
          <input
            id="admin-guide-q"
            name="q"
            defaultValue={q}
            placeholder={'Ask in plain language — "failed payment", "turn off a listing", "create staff login"…'}
            className={`${adminInputClass} flex-1`}
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button type="submit" className={`${adminBtnPrimary} min-h-[44px] sm:min-h-0`}>
              Search Guide
            </button>
            {q ? (
              <Link href="/admin/guide" className={`${adminBtnSecondary} min-h-[44px] sm:min-h-0`}>
                Clear
              </Link>
            ) : null}
          </div>
        </form>
        {!q ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_TASKS.map((t) => (
              <Link
                key={t.query}
                href={`/admin/guide?q=${encodeURIComponent(t.query)}`}
                className="rounded-full border border-[#E8DFD0] bg-[#FAF7F2]/90 px-3 py-1.5 text-xs font-semibold text-[#5C4E2E] hover:bg-[#F3EAD8]"
              >
                {t.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {q ? (
        <AdminSectionCard title={`Results for "${q}"`} subtitle={`${searchResults.length} match${searchResults.length === 1 ? "" : "es"}`}>
          {searchResults.length === 0 ? (
            <p className="text-sm text-[#5C5346]">
              No Guide entry matches that yet. Try a different phrase, or use{" "}
              <Link href="/admin/ops" className={adminLinkAccent}>
                Customer Ops
              </Link>{" "}
              if you are looking for a real company record instead of operational guidance.
            </p>
          ) : (
            <ul className="space-y-3">
              {searchResults.map(({ entry }) => (
                <GuideEntryCard key={entry.id} entry={entry} accessible={isAdminGuideRouteAccessible(entry.route, allowedHrefs)} />
              ))}
            </ul>
          )}
        </AdminSectionCard>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {DOMAIN_ORDER.map((d) => (
              <Link
                key={d}
                href={`/admin/guide?domain=${d}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                  domainFilter === d ? "border-[#A67C52] bg-[#A67C52] text-white" : "border-[#E8DFD0] bg-white text-[#5C4E2E]"
                }`}
              >
                {DOMAIN_LABELS[d]}
              </Link>
            ))}
            {domainFilter ? (
              <Link href="/admin/guide" className="rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#7A7164]">
                All domains
              </Link>
            ) : null}
          </div>

          <div className="space-y-6">
            {(domainFilter ? [domainFilter] : DOMAIN_ORDER).map((d) => (
              <AdminSectionCard key={d} title={DOMAIN_LABELS[d]} subtitle={`${entriesByDomain[d].length} module${entriesByDomain[d].length === 1 ? "" : "s"}`}>
                <ul className="space-y-3">
                  {entriesByDomain[d].map((entry) => (
                    <GuideEntryCard key={entry.id} entry={entry} accessible={isAdminGuideRouteAccessible(entry.route, allowedHrefs)} />
                  ))}
                </ul>
              </AdminSectionCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GuideEntryCard({ entry, accessible }: { entry: AdminGuideEntry; accessible: boolean }) {
  return (
    <li className={`${adminCardBase} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[#1E1810]">{entry.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#5C5346]">{entry.purpose}</p>
          <p className="mt-2 text-xs text-[#7A7164]">
            <span className="font-semibold text-[#5C4E2E]">Use this when:</span> {entry.useWhen}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {accessible ? (
            <Link href={entry.route} className={`${adminBtnSecondary} min-h-[40px] whitespace-nowrap px-4 text-xs`}>
              Open
            </Link>
          ) : (
            <span className="inline-block rounded-lg border border-[#C9B46A]/50 bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#8A6B1F]">
              Admin clearance required
            </span>
          )}
          <Link href={`/admin/guide/${entry.id}`} className="text-[11px] font-semibold text-[#6B5B2E] underline">
            Full instructions →
          </Link>
        </div>
      </div>

      {entry.commonTasks.length > 0 ? (
        <p className="mt-3 text-xs text-[#5C5346]">
          <span className="font-semibold text-[#5C4E2E]">Common tasks:</span> {entry.commonTasks.join(" · ")}
        </p>
      ) : null}

      {entry.statuses && entry.statuses.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.statuses.map((s) => (
            <span
              key={s.label}
              title={s.meaning}
              className="inline-block rounded-md border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-1 text-[10px] font-bold uppercase text-[#5C4E2E]"
            >
              {s.label}
            </span>
          ))}
        </div>
      ) : null}

      {entry.failureGuidance ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-xs text-amber-900">
          <span className="font-semibold">If something looks wrong:</span> {entry.failureGuidance}
        </p>
      ) : null}

      <p className="mt-2 text-[10px] text-[#9A9084]">{entry.permissionNote}</p>
    </li>
  );
}
