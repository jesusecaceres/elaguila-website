import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionCard } from "../../../_components/AdminSectionCard";
import { adminCardBase, adminBtnSecondary, adminLinkAccent } from "../../../_components/adminTheme";
import { getAdminGuideEntryById, isAdminGuideRouteAccessible } from "../../../_lib/adminGuideRegistry";
import { getAllowedGlobalNavHrefs, getCurrentAdminAccessContext } from "../../../_lib/adminAccessControl";

export const dynamic = "force-dynamic";

const ACTION_LEVEL_COPY: Record<string, string> = {
  green: "Safe read/analysis — no data is changed.",
  yellow: "Reversible preparation — can typically be undone or corrected.",
  red: "Protected, owner-impacting action — requires care and correct authorization.",
};

export default async function AdminGuideEntryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const entry = getAdminGuideEntryById(id);
  if (!entry) notFound();

  const access = await getCurrentAdminAccessContext();
  const allowedHrefs = getAllowedGlobalNavHrefs(access);
  const accessible = isAdminGuideRouteAccessible(entry.route, allowedHrefs);

  return (
    <div className="min-w-0 max-w-3xl overflow-x-hidden">
      <p className="mb-4 text-sm">
        <Link href="/admin/guide" className={adminLinkAccent}>
          ← Back to Admin Guide
        </Link>
      </p>

      <AdminPageHeader
        eyebrow="Admin Guide"
        title={entry.title}
        subtitle={entry.purpose}
        rightSlot={
          accessible ? (
            <Link href={entry.route} className={adminBtnSecondary}>
              Open {entry.title} →
            </Link>
          ) : (
            <span className="inline-block rounded-lg border border-[#C9B46A]/50 bg-[#FFFCF7] px-3 py-2 text-xs font-semibold text-[#8A6B1F]">
              Admin clearance required
            </span>
          )
        }
      />

      <div className="space-y-4">
        <AdminSectionCard title="Use this when">
          <p className="text-sm text-[#5C5346]">{entry.useWhen}</p>
        </AdminSectionCard>

        {entry.commonTasks.length > 0 ? (
          <AdminSectionCard title="Common tasks">
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#5C5346]">
              {entry.commonTasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </AdminSectionCard>
        ) : null}

        {entry.howTo.length > 0 ? (
          <AdminSectionCard title="How to">
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#5C5346]">
              {entry.howTo.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </AdminSectionCard>
        ) : null}

        {entry.statuses && entry.statuses.length > 0 ? (
          <AdminSectionCard title="Statuses and what they mean">
            <dl className="space-y-2 text-sm">
              {entry.statuses.map((s) => (
                <div key={s.label} className={`${adminCardBase} p-3`}>
                  <dt className="font-bold uppercase text-xs tracking-wide text-[#5C4E2E]">{s.label}</dt>
                  <dd className="mt-1 text-[#5C5346]">{s.meaning}</dd>
                </div>
              ))}
            </dl>
          </AdminSectionCard>
        ) : null}

        {entry.failureGuidance ? (
          <AdminSectionCard title="If something looks wrong">
            <p className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">{entry.failureGuidance}</p>
          </AdminSectionCard>
        ) : null}

        <AdminSectionCard title="Who can use this">
          <p className="text-sm text-[#5C5346]">{entry.permissionNote}</p>
          {entry.actionLevel ? (
            <p className="mt-2 text-xs text-[#7A7164]">
              <span className="font-semibold text-[#5C4E2E]">Action level:</span> {ACTION_LEVEL_COPY[entry.actionLevel]}
            </p>
          ) : null}
        </AdminSectionCard>

        {(entry.relatedAdminRoutes?.length || entry.relatedPublicRoutes?.length) ? (
          <AdminSectionCard title="Related areas">
            {entry.relatedAdminRoutes?.length ? (
              <p className="text-sm text-[#5C5346]">
                <span className="font-semibold text-[#5C4E2E]">Related Admin areas:</span>{" "}
                {entry.relatedAdminRoutes.map((r, i) => (
                  <span key={r}>
                    {i > 0 ? ", " : ""}
                    <Link href={r} className={adminLinkAccent}>
                      {r}
                    </Link>
                  </span>
                ))}
              </p>
            ) : null}
            {entry.relatedPublicRoutes?.length ? (
              <p className="mt-2 text-sm text-[#5C5346]">
                <span className="font-semibold text-[#5C4E2E]">Public site:</span> {entry.relatedPublicRoutes.join(", ")}
              </p>
            ) : null}
          </AdminSectionCard>
        ) : null}

        {entry.notes ? (
          <AdminSectionCard title="Notes">
            <p className="text-sm text-[#5C5346]">{entry.notes}</p>
          </AdminSectionCard>
        ) : null}
      </div>
    </div>
  );
}
