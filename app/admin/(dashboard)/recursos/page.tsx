import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import {
  adminBtnPrimary,
  adminCtaChip,
  adminCtaChipCompact,
  adminDesktopTableOnly,
  adminMobileCardList,
  adminTableWrap,
  adminTableZebraRow,
  adminActionProofOk,
  adminActionProofErr,
  adminCardBase,
  adminDashboardCtaPrimary,
  adminDashboardCtaView,
  adminDashboardCtaWarning,
  adminDashboardCtaNeutral,
} from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { RecursosFilterBar } from "@/app/admin/_components/recursos/RecursosFilterBar";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { setResourceActiveAction, setVerificationStatusAction } from "@/app/admin/recursosActions";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { resolveEffectiveVerificationStatus, verificationStatusLabel } from "@/app/lib/recursos/verificationStatus";
import type { ResourceRecord } from "@/app/lib/recursos/types";
import { dbListCandidateReviews } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import type { CandidateResourceRecord } from "@/app/lib/recursos/sourceIngestion";
import candidatesData from "@/data/recursos/candidates/scc-community-resource-guide-2023.json";
import { buildReverificationQueue } from "@/app/lib/recursos/intake/reverificationQueue";
import { dbCountActiveResourceIntakeJobs } from "@/app/lib/recursos/intake/server/resourceIntakeJobsDb";
import { dbCountPendingResourceChangeProposals } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbCountPendingPartnerUpdateRequests } from "@/app/lib/recursos/intake/server/partnerUpdateRequestsDb";

const CANDIDATES = candidatesData as unknown as CandidateResourceRecord[];

export const dynamic = "force-dynamic";

const VERIFICATION_BADGE: Record<string, string> = {
  verified: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  needs_review: "border border-amber-200 bg-amber-50 text-amber-950",
  stale: "border border-orange-200 bg-orange-50 text-orange-950",
  inactive: "border border-slate-300 bg-slate-50 text-slate-700",
};

const URGENCY_BADGE: Record<string, string> = {
  "help-now": "border border-rose-300 bg-rose-50 text-rose-900",
  "i-need-help": "border border-[#8FA467] bg-[#F4F7EC] text-[#3E5324]",
  "want-to-connect": "border border-[#7C93B0] bg-[#EEF3F8] text-[#2E4A66]",
};

function matchesQuery(r: ResourceRecord, q: string): boolean {
  if (!q) return true;
  const haystack = [r.organizationName, r.programName ?? "", r.serviceArea ?? ""].join(" ").toLowerCase();
  return haystack.includes(q);
}

function VerificationActions({ id, currentStatus }: { id: string; currentStatus: string }) {
  const options: { status: string; label: string; className: string; confirmMessage: string }[] = [
    {
      status: "verified",
      label: "Mark verified",
      className: "border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
      confirmMessage:
        "Mark this resource as verified? This requires an official source and an actionable contact method (checked server-side).",
    },
    {
      status: "needs_review",
      label: "Needs review",
      className: "border border-amber-700 bg-amber-500 text-[#1E1810] hover:bg-amber-600",
      confirmMessage: "Move this resource to Needs review?",
    },
    {
      status: "stale",
      label: "Mark stale",
      className: "border border-orange-700 bg-orange-500 text-[#1E1810] hover:bg-orange-600",
      confirmMessage: "Mark this resource as stale?",
    },
    {
      status: "inactive",
      label: "Deactivate",
      className: "border border-rose-800 bg-rose-800 text-white hover:bg-rose-900",
      confirmMessage: "Mark this resource inactive? It will stop surfacing publicly.",
    },
  ].filter((o) => o.status !== currentStatus);

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <form key={o.status} action={setVerificationStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="verificationStatus" value={o.status} />
          <ExecutiveHubConfirmSubmitButton confirmMessage={o.confirmMessage} className={`${o.className} ${adminCtaChipCompact}`}>
            {o.label}
          </ExecutiveHubConfirmSubmitButton>
        </form>
      ))}
    </div>
  );
}

function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  return (
    <form action={setResourceActiveAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <ExecutiveHubConfirmSubmitButton
        confirmMessage={active ? "Deactivate this resource? It will stop surfacing publicly." : "Reactivate this resource?"}
        className={`${adminCtaChipCompact} ${active ? "border border-rose-800 bg-rose-800 text-white hover:bg-rose-900" : "border border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"}`}
      >
        {active ? "Deactivate" : "Activate"}
      </ExecutiveHubConfirmSubmitButton>
    </form>
  );
}

export default async function RecursosAdminListPage(props: {
  searchParams?: Promise<{
    status_saved?: string;
    error?: string;
    q?: string;
    category?: string;
    urgency?: string;
    verification?: string;
    active?: string;
  }>;
}) {
  const sp = props.searchParams ? await props.searchParams : {};
  const { rows: all, unavailable } = await dbListCommunityResources();
  const { rows: candidateReviews } = await dbListCandidateReviews();

  // Gate 2 — Recursos Command Center metrics. Reuses `all` (no extra query) for reverification;
  // three genuinely new counts come from the Gate 1 Intake OS tables. Any query that fails shows
  // an honest "no disponible" rather than a fabricated zero (see `commandCenterUnavailable` below).
  const reverificationQueue = buildReverificationQueue(all);
  const [intakeJobsCount, changeProposalsCount, partnerRequestsCount] = await Promise.all([
    dbCountActiveResourceIntakeJobs(),
    dbCountPendingResourceChangeProposals(),
    dbCountPendingPartnerUpdateRequests(),
  ]);
  const promotedCandidateIds = new Set(candidateReviews.filter((r) => r.disposition === "promoted").map((r) => r.candidateId));
  const candidateCounts = {
    total: CANDIDATES.length,
    priority1Remaining: CANDIDATES.filter((c) => c.verificationPriority === 1 && !promotedCandidateIds.has(c.candidateId)).length,
    promotedAwaitingVerification: candidateReviews.filter((r) => r.disposition === "promoted").length,
  };

  const q = (sp.q ?? "").trim().toLowerCase();
  const categoryFilter = (sp.category ?? "").trim();
  const urgencyFilter = (sp.urgency ?? "").trim();
  const verificationFilter = (sp.verification ?? "").trim();
  const activeFilter = (sp.active ?? "").trim();

  const withEffectiveStatus = all.map((r) => ({ r, effective: resolveEffectiveVerificationStatus(r.verification) }));

  const filtered = withEffectiveStatus.filter(({ r, effective }) => {
    if (!matchesQuery(r, q)) return false;
    if (categoryFilter && r.primaryCategory !== categoryFilter) return false;
    if (urgencyFilter && r.urgencyLevel !== urgencyFilter) return false;
    if (verificationFilter && effective !== verificationFilter) return false;
    if (activeFilter && String(r.verification.active) !== activeFilter) return false;
    return true;
  });

  const counts = {
    total: all.length,
    active: all.filter((r) => r.verification.active).length,
    verified: withEffectiveStatus.filter((x) => x.effective === "verified").length,
    needsReview: withEffectiveStatus.filter((x) => x.effective === "needs_review").length,
    stale: withEffectiveStatus.filter((x) => x.effective === "stale").length,
    helpNow: all.filter((r) => r.urgencyLevel === "help-now").length,
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Recursos Data OS"
        subtitle="Create and manage the community-help organizations and programs that will power the Leonix Recursos directory."
        rightSlot={
          <Link href="/admin/recursos/nuevo" className={adminBtnPrimary}>
            + New resource
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Recursos — Data OS"
        purpose="Manage verified community-help organizations and programs (identity, bilingual content, category/urgency, contact CTAs, verification freshness, and editorial status) without code changes."
        dataSource="Supabase `public.community_resources` table (supabase/migrations/20260818150000_community_resources.sql). The public search/directory at /recursos-comunitarios reads this same table live via app/lib/recursos/server/communityResourcesPublicQueries.ts."
        status="real"
        safeActions={[
          "Search / filter by category, urgency, verification, active",
          "Create/edit resource records",
          "Mark verified / needs review / stale / deactivate",
          "Activate / deactivate",
          "Ver público — open a resource's live public detail page",
        ]}
        nextGate="Ninguno planeado — la Data OS y el directorio público ya están en producción."
        warningNote="Partner status and Featured are editorial/relationship metadata only — they never affect public ranking. Ranking is always urgency/relevance/geography/eligibility/verification/active-status based."
      />

      <section className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Centro de comando de Recursos</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
          Métricas reales — cada número se lee directamente de Supabase en el momento de cargar esta página. Ningún valor se
          inventa: si una consulta falla, se muestra &quot;no disponible&quot; en vez de un cero falso.
        </p>

        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
          <AdminStatCard title="Publicados / Activos" value={unavailable ? "—" : counts.active} />
          <AdminStatCard title="Verificados" value={unavailable ? "—" : counts.verified} />
          <AdminStatCard title="Revisión pendiente" value={unavailable ? "—" : counts.needsReview} accent={!unavailable && counts.needsReview > 0 ? "amber" : "default"} />
          <AdminStatCard title="Vencidos / Stale" value={unavailable ? "—" : counts.stale} accent={!unavailable && counts.stale > 0 ? "amber" : "default"} />
          <AdminStatCard
            title="Reverificación vencida"
            value={unavailable ? "—" : reverificationQueue.overdue.length}
            accent={!unavailable && reverificationQueue.overdue.length > 0 ? "rose" : "default"}
            actionLabel="Ver cola"
            actionHref="/admin/recursos/reverificacion"
          />
          <AdminStatCard title="Candidatos" value={CANDIDATES.length} actionLabel="Revisar" actionHref="/admin/recursos/candidatos" />
          <AdminStatCard
            title="Intakes activos"
            value={intakeJobsCount.unavailable ? "no disponible" : intakeJobsCount.count}
            actionLabel="Nuevo intake"
            actionHref="/admin/recursos/intake"
          />
          <AdminStatCard
            title="Cambios pendientes"
            value={changeProposalsCount.unavailable ? "no disponible" : changeProposalsCount.count}
            accent={!changeProposalsCount.unavailable && changeProposalsCount.count > 0 ? "amber" : "default"}
            actionLabel="Ver cambios"
            actionHref="/admin/recursos/cambios"
          />
          <AdminStatCard
            title="Solicitudes pendientes"
            value={partnerRequestsCount.unavailable ? "no disponible" : partnerRequestsCount.count}
            accent={!partnerRequestsCount.unavailable && partnerRequestsCount.count > 0 ? "amber" : "default"}
            actionLabel="Ver solicitudes"
            actionHref="/admin/recursos/solicitudes"
          />
        </div>

        <div className="mt-5 grid gap-2.5 grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/recursos/nuevo" className={adminDashboardCtaPrimary}>
            Agregar recurso manualmente
          </Link>
          <Link href="/admin/recursos/intake" className={adminDashboardCtaView}>
            Nuevo intake
          </Link>
          <Link href="/admin/recursos/candidatos" className={adminDashboardCtaWarning}>
            Revisar candidatos
          </Link>
          <Link href="/admin/recursos/cambios" className={adminDashboardCtaNeutral}>
            Revisar cambios
          </Link>
          <Link href="/admin/recursos/solicitudes" className={adminDashboardCtaNeutral}>
            Solicitudes de socios
          </Link>
          <Link href="/admin/recursos/reverificacion" className={adminDashboardCtaNeutral}>
            Reverificación
          </Link>
        </div>
      </section>

      <Link
        href="/admin/recursos/candidatos"
        className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] px-4 py-3 text-sm hover:border-[#6B5B2E]"
      >
        <span className="font-bold text-[#1E1810]">2023 PDF candidate resources →</span>
        <span className="text-[#5C5346]">{candidateCounts.total} candidates</span>
        <span className={candidateCounts.priority1Remaining > 0 ? "font-bold text-rose-800" : "text-[#5C5346]"}>
          {candidateCounts.priority1Remaining} Priority-1 remaining
        </span>
        <span className="text-[#5C5346]">{candidateCounts.promotedAwaitingVerification} promoted, awaiting final verification</span>
      </Link>

      {unavailable ? (
        <p className={`${adminActionProofErr} mb-6`}>
          Supabase is not configured or unreachable — the Recursos list cannot load. Set NEXT_PUBLIC_SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY, apply the `community_resources` migration, then reload.
        </p>
      ) : null}
      {sp.status_saved ? <p className={`${adminActionProofOk} mb-6`}>Saved.</p> : null}
      {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <AdminStatCard title="Total resources" value={counts.total} />
        <AdminStatCard title="Active" value={counts.active} />
        <AdminStatCard title="Verified" value={counts.verified} />
        <AdminStatCard title="Needs review" value={counts.needsReview} accent={counts.needsReview > 0 ? "amber" : "default"} />
        <AdminStatCard title="Stale" value={counts.stale} accent={counts.stale > 0 ? "amber" : "default"} />
        <AdminStatCard title="Help now / urgent" value={counts.helpNow} accent={counts.helpNow > 0 ? "rose" : "default"} />
      </div>

      <RecursosFilterBar
        initialQuery={sp.q ?? ""}
        initialCategory={sp.category ?? ""}
        initialUrgency={sp.urgency ?? ""}
        initialVerification={sp.verification ?? ""}
        initialActive={sp.active ?? ""}
      />

      {all.length === 0 ? (
        <AdminEmptyState
          title="No resources yet"
          description="Create the first verified community-help resource to get started."
          action={
            <Link href="/admin/recursos/nuevo" className={adminBtnPrimary}>
              + New resource
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <AdminEmptyState title="No matches" description="No resources match this search and filter combination." />
      ) : (
        <>
          <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                  <th className="px-4 py-3">Organization / program</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Last verified</th>
                  <th className="px-4 py-3">Next review</th>
                  <th className="px-4 py-3">Service area</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ r, effective }) => (
                  <tr key={r.id} className={adminTableZebraRow}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1E1810]">{r.organizationName}</p>
                      {r.programName ? <p className="text-xs text-[#7A7164]">{r.programName}</p> : null}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        <Link href={`/admin/recursos/${r.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                          Editar →
                        </Link>
                        <Link href={`/recursos-comunitarios/recurso/${r.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#6B5B2E] underline">
                          Ver público →
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#5C5346]">{getPrimaryCategoryLabel(r.primaryCategory, "en")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${URGENCY_BADGE[r.urgencyLevel]}`}>
                        {getUrgencyLabel(r.urgencyLevel, "en")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${VERIFICATION_BADGE[effective]}`}>
                        {verificationStatusLabel(effective, "en")}
                      </span>
                      <div className="mt-1.5">
                        <VerificationActions id={r.id} currentStatus={effective} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActiveToggle id={r.id} active={r.verification.active} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">
                      {r.verification.lastVerifiedAt ? new Date(r.verification.lastVerifiedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">
                      {r.verification.nextVerificationAt ? new Date(r.verification.nextVerificationAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5C5346]">{r.serviceArea ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/admin/recursos/${r.id}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                          Editar
                        </Link>
                        <Link href={`/recursos-comunitarios/recurso/${r.slug}`} target="_blank" rel="noopener noreferrer" className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                          Ver público
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={adminMobileCardList}>
            {filtered.map(({ r, effective }) => (
              <div key={r.id} className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1E1810]">{r.organizationName}</p>
                    {r.programName ? <p className="text-xs text-[#7A7164]">{r.programName}</p> : null}
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${VERIFICATION_BADGE[effective]}`}>
                    {verificationStatusLabel(effective, "en")}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5C5346]">
                  <div>
                    <dt className="text-[#7A7164]">Category</dt>
                    <dd>{getPrimaryCategoryLabel(r.primaryCategory, "en")}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Urgency</dt>
                    <dd>
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${URGENCY_BADGE[r.urgencyLevel]}`}>
                        {getUrgencyLabel(r.urgencyLevel, "en")}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Last verified</dt>
                    <dd>{r.verification.lastVerifiedAt ? new Date(r.verification.lastVerifiedAt).toLocaleDateString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Service area</dt>
                    <dd className="truncate">{r.serviceArea ?? "—"}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={`/admin/recursos/${r.id}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                    Editar
                  </Link>
                  <Link href={`/recursos-comunitarios/recurso/${r.slug}`} target="_blank" rel="noopener noreferrer" className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                    Ver público
                  </Link>
                  <ActiveToggle id={r.id} active={r.verification.active} />
                </div>
                <div className="mt-2">
                  <VerificationActions id={r.id} currentStatus={effective} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
