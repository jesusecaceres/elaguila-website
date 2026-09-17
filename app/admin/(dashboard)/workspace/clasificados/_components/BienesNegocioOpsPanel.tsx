import Link from "next/link";

import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type {
  AdminBienesNegocioParentOps,
  AdminTruthState,
} from "@/app/admin/_lib/bienesNegocioCommercialOps";
import { adminBienesParentHref } from "@/app/admin/_lib/bienesNegocioAdminHrefs";

/**
 * Gate BIENES-NEGOCIO-2 — Bienes Raíces Negocio commercial/capacity ops panel.
 *
 * Renders the READ-ONLY projection from `bienesNegocioCommercialOps.ts`. It contains no commercial
 * logic of its own: every number and every state is passed in. Per the Admin OS Book §6, an
 * unavailable or unreadable source renders as its truth state with an explanation — never as 0 and
 * never as a silent blank — and per §7 no raw implementation error is shown to the operator.
 *
 * This is an additive panel on the EXISTING category ops queue. No new Admin route family, no
 * second listings table, no child dashboard: child rows link to the existing
 * `/admin/workspace/clasificados/listings/[id]/edit` destination.
 */

const TRUTH_STYLE: Record<AdminTruthState, string> = {
  REAL: "bg-emerald-50 text-emerald-900 border-emerald-300",
  PARTIAL: "bg-amber-50 text-amber-900 border-amber-300",
  NEEDS_PROOF: "bg-slate-50 text-slate-700 border-slate-300",
  BROKEN: "bg-red-50 text-red-900 border-red-300",
  UNAVAILABLE: "bg-orange-50 text-orange-900 border-orange-300",
};

function TruthBadge({ truth }: { truth: AdminTruthState }) {
  return (
    <span className={`inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TRUTH_STYLE[truth]}`}>
      {truth}
    </span>
  );
}

/** Renders a real boolean, or the truth state when the value is not proven. Never a fake "No". */
function EntitlementValue({ truth, active }: { truth: AdminTruthState; active: boolean | null }) {
  if (truth !== "REAL" || active === null) return <TruthBadge truth={truth} />;
  return (
    <span className={active ? "font-semibold text-emerald-800" : "font-semibold text-slate-600"}>
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

export function BienesNegocioOpsPanel({ parents }: { parents: AdminBienesNegocioParentOps[] }) {
  if (parents.length === 0) return null;
  const authority = parents[0]!.capacityAuthority;

  return (
    <section className={`${adminCardBase} space-y-4 p-4`} aria-labelledby="bn-ops-heading">
      <div>
        <h2 id="bn-ops-heading" className="text-sm font-bold text-slate-900">
          Bienes Negocio — capacity, entitlement &amp; payment truth
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          $399/month includes 1 active property; the +$99/month inventory pack adds 3 (4 total). Every
          value below is read from canonical sources — entitlements from{" "}
          <code>listing_package_entitlements</code>, payment state from{" "}
          <code>leonix_subscription_records</code>. Paid state is never inferred from listing status,
          and entitlement is never inferred from pricing configuration.
        </p>
      </div>

      {/* The atomic capacity authority's own health — surfaced first, so Admin never implies the
          lane is healthy while activations cannot execute. */}
      <div
        className={`rounded border px-3 py-2 text-xs leading-relaxed ${TRUTH_STYLE[authority.truth]}`}
        role={authority.truth === "REAL" ? undefined : "status"}
      >
        <span className="font-bold uppercase tracking-wide">Capacity authority: {authority.truth}</span>
        <span className="ml-2">{authority.note}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-left text-slate-600">
              <th className="py-2 pr-3 font-semibold">Parent</th>
              <th className="py-2 pr-3 font-semibold">Role / status</th>
              <th className="py-2 pr-3 font-semibold">Base ($399)</th>
              <th className="py-2 pr-3 font-semibold">Boost (+$99)</th>
              <th className="py-2 pr-3 font-semibold">Capacity</th>
              <th className="py-2 pr-3 font-semibold">Subscription</th>
              <th className="py-2 pr-3 font-semibold">Children</th>
            </tr>
          </thead>
          <tbody>
            {parents.map((p) => (
              <tr key={p.parentListingId} className="border-b border-slate-200 align-top">
                <td className="py-2 pr-3">
                  <Link
                    href={adminBienesParentHref(p.parentListingId)}
                    className="font-mono text-[11px] font-semibold text-slate-900 underline"
                  >
                    {p.leonixAdId ?? p.parentListingId.slice(0, 8)}
                  </Link>
                  <div className="mt-0.5 font-mono text-[10px] text-slate-500">{p.parentListingId}</div>
                  {p.inventoryGroupId ? (
                    <div className="mt-0.5 font-mono text-[10px] text-slate-500">grp {p.inventoryGroupId.slice(0, 8)}</div>
                  ) : null}
                </td>

                <td className="py-2 pr-3">
                  <div className="font-semibold text-slate-800">{p.inventoryRole ?? "—"}</div>
                  <div className="text-slate-600">
                    {p.parentStatus ?? "—"}
                    {p.parentIsPublished === false ? " · unpublished" : ""}
                  </div>
                </td>

                <td className="py-2 pr-3">
                  <EntitlementValue truth={p.baseEntitlement.truth} active={p.baseEntitlement.active} />
                  {p.baseEntitlement.note ? (
                    <div className="mt-1 max-w-[220px] text-[10px] text-slate-600">{p.baseEntitlement.note}</div>
                  ) : null}
                </td>

                <td className="py-2 pr-3">
                  <EntitlementValue truth={p.boostEntitlement.truth} active={p.boostEntitlement.active} />
                  {p.boostEntitlement.note ? (
                    <div className="mt-1 max-w-[220px] text-[10px] text-slate-600">{p.boostEntitlement.note}</div>
                  ) : null}
                </td>

                <td className="py-2 pr-3">
                  {p.capacity.activeCount === null ? (
                    <TruthBadge truth={p.capacity.truth} />
                  ) : (
                    <>
                      <span className={p.capacity.atLimit ? "font-bold text-amber-800" : "font-semibold text-slate-800"}>
                        {p.capacity.activeCount}
                        {p.capacity.effectiveLimit === null ? " / ?" : ` / ${p.capacity.effectiveLimit}`}
                      </span>
                      {p.capacity.truth !== "REAL" ? (
                        <span className="ml-1.5">
                          <TruthBadge truth={p.capacity.truth} />
                        </span>
                      ) : null}
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        incl {p.capacity.includedLimit} · pack +{p.capacity.packAddsLimit}
                      </div>
                      {p.capacity.atLimit ? (
                        <div className="mt-0.5 text-[10px] font-semibold text-amber-800">at limit</div>
                      ) : null}
                    </>
                  )}
                  {p.capacity.note ? (
                    <div className="mt-1 max-w-[220px] text-[10px] text-slate-600">{p.capacity.note}</div>
                  ) : null}
                </td>

                <td className="py-2 pr-3">
                  {p.subscription.status === null ? (
                    <TruthBadge truth={p.subscription.truth} />
                  ) : (
                    <>
                      <span className="font-semibold text-slate-800">{p.subscription.status}</span>
                      {p.subscription.truth !== "REAL" ? (
                        <span className="ml-1.5">
                          <TruthBadge truth={p.subscription.truth} />
                        </span>
                      ) : null}
                    </>
                  )}
                  {p.subscription.note ? (
                    <div className="mt-1 max-w-[220px] text-[10px] text-slate-600">{p.subscription.note}</div>
                  ) : null}
                </td>

                {/* Parent -> child drill-through into the EXISTING Admin listing destination. */}
                <td className="py-2 pr-3">
                  {p.childCountTruth !== "REAL" ? (
                    <TruthBadge truth={p.childCountTruth} />
                  ) : p.children.length === 0 ? (
                    <span className="text-slate-500">none</span>
                  ) : (
                    <ul className="space-y-1">
                      {p.children.map((c) => (
                        <li key={c.id}>
                          <Link href={c.adminHref} className="font-mono text-[11px] text-slate-900 underline">
                            {c.leonixAdId ?? c.id.slice(0, 8)}
                          </Link>
                          <span className="ml-1.5 text-[10px] text-slate-600">
                            {c.status ?? "—"}
                            {c.isPublished === false ? " · unpublished" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
