import Link from "next/link";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { AdminSectionOwnershipCallout } from "../../../_components/AdminSectionOwnershipCallout";
import { adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../_components/adminTheme";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { hasLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";

export const dynamic = "force-dynamic";

type ChurchListRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  approval_status: string;
  is_active: boolean;
  published_at: string | null;
  created_at: string;
};

type SubmissionIntake = {
  church_id: string;
  intake_decision: string | null;
  intake_confidence: number | null;
  intake_reasons: string[] | null;
  intake_risk_signals: string[] | null;
  intake_attention_fields: string[] | null;
};

function intakeLabel(decision: string | null, approval: string): string {
  if (decision === "AUTO_PUBLISH") return "AUTO-PUBLISHED";
  if (decision === "BLOCK" || approval === "rejected") return "BLOCKED";
  if (approval === "pending") return "NEEDS REVIEW";
  if (approval === "approved") return "PUBLISHED";
  return approval;
}

export default async function AdminWorkspaceIglesiasPage() {
  const churches: ChurchListRow[] = isSupabaseAdminConfigured()
    ? (
        await getAdminSupabase()
          .from("churches")
          .select("id, name, slug, city, state, approval_status, is_active, published_at, created_at")
          .order("created_at", { ascending: false })
          .limit(80)
      ).data ?? []
    : [];

  const ids = churches.map((c) => c.id);
  const submissions: SubmissionIntake[] =
    isSupabaseAdminConfigured() && ids.length
      ? (
          await getAdminSupabase()
            .from("church_submissions")
            .select("church_id, intake_decision, intake_confidence, intake_reasons, intake_risk_signals, intake_attention_fields")
            .in("church_id", ids)
        ).data ?? []
      : [];
  const intakeByChurch = new Map(submissions.map((s) => [s.church_id, s]));

  const autoPublished = submissions.filter((s) => s.intake_decision === "AUTO_PUBLISH").length;
  const needsReview = churches.filter((c) => c.approval_status === "pending").length;
  const blocked = churches.filter((c) => c.approval_status === "rejected" || intakeByChurch.get(c.id)?.intake_decision === "BLOCK").length;
  const exceptions = churches.filter((c) => c.approval_status === "pending");
  const rest = churches.filter((c) => c.approval_status !== "pending");
  const ordered = [...exceptions, ...rest];
  const canPrayer = await hasLeonixAdminPermission("can_manage_prayer_wall");

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Exception queue
        </span>
        <span className={adminPartialBadgeClass}>AUTO-PUBLISHED {autoPublished}</span>
        <span className={adminPartialBadgeClass}>NEEDS REVIEW {needsReview}</span>
        <span className={adminPartialBadgeClass}>BLOCKED {blocked}</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Iglesias"
        subtitle="Human review is for exceptions only. Public inventory is approved + active + published. Listed is not verified."
        helperText="No fake churches. Prayer Wall moderation is a separate permissioned queue."
      />

      <AdminSectionOwnershipCallout
        sectionTitle="Iglesias"
        publicPath="/iglesias"
        sourceOfTruth="Postgres `churches` (+ services/ministries/media). Landing chrome: `site_section_content.iglesias_page`."
        siteSectionKey="iglesias_page"
        adminEditors={[
          { label: "Copy editor", href: "/admin/workspace/iglesias/content" },
          { label: "Public landing", href: "/iglesias" },
        ]}
        notYet={[
          "Verified badge workflow — column exists, not displayed.",
        ]}
      />

      <div className={`${adminCardBase} overflow-x-auto p-0`}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-[11px] uppercase tracking-wide text-[#7A7164]">
            <tr>
              <th className="px-4 py-3">Church</th>
              <th className="px-4 py-3">City / state</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Intake</th>
              <th className="px-4 py-3">Why</th>
              <th className="px-4 py-3"> </th>
            </tr>
          </thead>
          <tbody>
            {ordered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-[#7A7164]" colSpan={6}>
                  No church rows yet. Public landing stays complete with zero inventory.
                </td>
              </tr>
            ) : (
              ordered.map((c) => {
                const sub = intakeByChurch.get(c.id);
                const reasons = (sub?.intake_reasons ?? []).slice(0, 3).join(" · ") || "—";
                const conf =
                  typeof sub?.intake_confidence === "number" ? ` · ${Math.round(sub.intake_confidence * 100)}%` : "";
                const fields = (sub?.intake_attention_fields ?? []).slice(0, 3).join(", ");
                return (
                  <tr key={c.id} className="border-b border-[#F0E8D8]">
                    <td className="px-4 py-3 font-semibold text-[#1F241C]">{c.name}</td>
                    <td className="px-4 py-3 text-[#5C5346]">{[c.city, c.state].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-[#5C5346]">{c.created_at ? new Date(c.created_at).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      {intakeLabel(sub?.intake_decision ?? null, c.approval_status)}
                      {conf}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#5C5346]">
                      {reasons}
                      {fields ? ` · fields: ${fields}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/workspace/iglesias/${c.id}`} className="font-bold text-[#6B5B2E] underline">
                        {c.approval_status === "pending" ? "Review" : "Open"}
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        {canPrayer ? (
          <Link href="/admin/workspace/iglesias/prayers" className={adminBtnSecondary}>
            Prayer queue
          </Link>
        ) : null}
        <Link href="/admin/workspace/iglesias/content" className={adminBtnSecondary}>
          Landing copy
        </Link>
        <Link href="/admin/workspace" className={adminBtnSecondary}>
          ← Workspace overview
        </Link>
      </div>
    </div>
  );
}
