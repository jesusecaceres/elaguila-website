import Link from "next/link";
import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase, adminPartialBadgeClass } from "../../../../_components/adminTheme";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { hasLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import {
  approvePrayerAction,
  rejectPrayerAction,
  removePrayerAction,
  redactAndApprovePrayerAction,
  closePrayerAction,
  markPrayerReviewedAction,
} from "@/app/admin/iglesiasPrayerActions";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "review", label: "Needs review" },
  { id: "crisis", label: "Crisis review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected/removed" },
  { id: "reports", label: "Reports" },
] as const;

export default async function AdminIglesiasPrayerQueuePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const allowed = await hasLeonixAdminPermission("can_manage_prayer_wall");
  if (!allowed) {
    return (
      <div className="max-w-3xl space-y-4">
        <AdminPageHeader
          eyebrow="Workspace · Iglesias"
          title="Prayer moderation"
          subtitle="This queue requires the can_manage_prayer_wall permission."
        />
        <p className="rounded-2xl border border-[#E8DFD0] bg-[#FAF6EE] px-4 py-4 text-sm">
          Prayer queue hidden. Ask an owner/super-admin to grant <code>can_manage_prayer_wall</code>.
        </p>
        <Link href="/admin/workspace/iglesias" className={adminBtnSecondary}>
          ← Iglesias
        </Link>
      </div>
    );
  }

  const sp = searchParams ? await searchParams : {};
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "review";
  const tab = TABS.some((t) => t.id === tabRaw) ? tabRaw : "review";

  const admin = isSupabaseAdminConfigured() ? getAdminSupabase() : null;
  let rows: Array<Record<string, unknown>> = [];
  let reports: Array<Record<string, unknown>> = [];

  if (admin && tab === "reports") {
    reports = ((await admin.from("prayer_reports").select("*").order("created_at", { ascending: false }).limit(80)).data ??
      []) as Array<Record<string, unknown>>;
    const ids = reports.map((r) => String(r.prayer_request_id));
    if (ids.length) {
      rows = ((await admin.from("prayer_requests").select("*").in("id", ids)).data ?? []) as Array<Record<string, unknown>>;
    }
  } else if (admin) {
    let q = admin.from("prayer_requests").select("*").order("created_at", { ascending: false }).limit(80);
    if (tab === "review") q = q.in("moderation_status", ["PENDING", "HUMAN_REVIEW"]);
    if (tab === "crisis") q = q.eq("moderation_status", "CRISIS_REVIEW");
    if (tab === "approved") q = q.eq("moderation_status", "CLEARLY_SAFE");
    if (tab === "rejected") q = q.or("moderation_status.eq.DISALLOWED,status.eq.REMOVED");
    rows = ((await q).data ?? []) as Array<Record<string, unknown>>;
  }

  const byId = new Map(rows.map((r) => [String(r.id), r]));

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Prayer queue
        </span>
        <span className={adminPartialBadgeClass}>{rows.length} shown</span>
      </div>
      <AdminPageHeader
        eyebrow="Workspace · Iglesias"
        title="Prayer moderation"
        subtitle="Safety queue for the Prayer Wall. AI is a classifier, not a pastor. Private contact is visible only here."
        helperText="Do not publish private prayer. Prayer Network routing is BUILD 03."
      />

      <nav className="flex flex-wrap gap-2" aria-label="Prayer queue filters">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/workspace/iglesias/prayers?tab=${t.id}`}
            className={t.id === tab ? adminBtnPrimary : adminBtnSecondary}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "reports"
        ? reports.map((report) => {
            const prayer = byId.get(String(report.prayer_request_id));
            return (
              <article key={String(report.id)} className={`${adminCardBase} p-4`}>
                <p className="text-xs font-bold uppercase text-[#7A7164]">Report · {String(report.reason)}</p>
                <p className="mt-1 text-sm">{String(report.details || "—")}</p>
                {prayer ? <PrayerModerationCard row={prayer} /> : <p className="mt-2 text-sm">Prayer missing.</p>}
              </article>
            );
          })
        : rows.map((row) => <PrayerModerationCard key={String(row.id)} row={row} />)}

      {tab === "reports" && reports.length === 0 ? <p className="text-sm text-[#7A7164]">No reports.</p> : null}
      {tab !== "reports" && rows.length === 0 ? <p className="text-sm text-[#7A7164]">No prayers in this filter.</p> : null}

      <Link href="/admin/workspace/iglesias" className={adminBtnSecondary}>
        ← Church queue
      </Link>
    </div>
  );
}

function PrayerModerationCard({ row }: { row: Record<string, unknown> }) {
  const id = String(row.id);
  const showContact = row.contact_consent === true;
  return (
    <article className={`${adminCardBase} space-y-3 p-4`}>
      <header className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[#7A7164]">
        <span>{String(row.visibility)}</span>
        <span>{String(row.language)}</span>
        <span>{String(row.category || "—")}</span>
        <span>{String(row.moderation_status)}</span>
        <span>{String(row.status)}</span>
        <span>{row.display_name ? "named" : "no public name"}</span>
        <span>consent {showContact ? "yes" : "no"}</span>
      </header>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1F241C]">{String(row.body)}</p>
      <p className="text-xs text-[#7A7164]">
        AI {String(row.ai_decision || "—")} · risk {String(row.risk_level || "—")} ·{" "}
        {Array.isArray(row.ai_reason_codes) ? row.ai_reason_codes.join(", ") : ""} · {String(row.created_at)}
      </p>
      {showContact ? (
        <div className="rounded-xl bg-[#FAF6EE] px-3 py-2 text-sm">
          <p>Private contact (prayer admins only)</p>
          <p>Email: {String(row.contact_email || "—")}</p>
          <p>Phone: {String(row.contact_phone || "—")}</p>
          <p>WhatsApp: {String(row.contact_whatsapp || "—")}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <form action={approvePrayerAction}>
          <input type="hidden" name="prayer_id" value={id} />
          <button className={adminBtnPrimary} type="submit">
            Approve
          </button>
        </form>
        <form action={rejectPrayerAction}>
          <input type="hidden" name="prayer_id" value={id} />
          <button className={adminBtnSecondary} type="submit">
            Reject
          </button>
        </form>
        <form action={removePrayerAction}>
          <input type="hidden" name="prayer_id" value={id} />
          <button className={adminBtnSecondary} type="submit">
            Remove
          </button>
        </form>
        <form action={closePrayerAction}>
          <input type="hidden" name="prayer_id" value={id} />
          <button className={adminBtnSecondary} type="submit">
            Close
          </button>
        </form>
        <form action={markPrayerReviewedAction}>
          <input type="hidden" name="prayer_id" value={id} />
          <button className={adminBtnSecondary} type="submit">
            Mark reviewed
          </button>
        </form>
      </div>
      <form action={redactAndApprovePrayerAction} className="space-y-2">
        <input type="hidden" name="prayer_id" value={id} />
        <label className="block text-xs font-semibold">
          Redact PII and approve
          <textarea name="redacted_body" rows={3} defaultValue={String(row.body)} className="mt-1 w-full rounded-lg border px-2 py-2 text-sm" />
        </label>
        <button className={adminBtnSecondary} type="submit">
          Redact & approve
        </button>
      </form>
    </article>
  );
}
