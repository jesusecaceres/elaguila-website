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
  retryPrayerEmailDeliveryAction,
} from "@/app/admin/iglesiasPrayerActions";
import { loadPrayerNetworkCandidates } from "@/app/lib/iglesias/prayerNetworkOrchestrate";
import { isPrayerTeamEligible, selectPrayerNetworkTeams } from "@/app/lib/iglesias/prayerNetworkRouting";

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

  let deliveries: Array<Record<string, unknown>> = [];
  let churchNames = new Map<string, string>();
  const routingByPrayer = new Map<string, { eligible: string[]; selected: string[]; reason: string }>();
  if (admin && rows.length) {
    const ids = rows.map((r) => String(r.id));
    deliveries = ((await admin.from("prayer_team_deliveries").select("*").in("prayer_request_id", ids)).data ?? []) as Array<Record<string, unknown>>;
    const churchIds = [...new Set(deliveries.map((d) => String(d.church_id)).filter(Boolean))];
    if (churchIds.length) {
      const { data: churches } = await admin.from("churches").select("id, name").in("id", churchIds);
      churchNames = new Map((churches ?? []).map((c) => [String(c.id), String(c.name)]));
    }
    const candidates = await loadPrayerNetworkCandidates();
    for (const row of rows) {
      if (String(row.visibility) !== "PRIVATE_PRAYER_TEAM") continue;
      const prayer = {
        visibility: String(row.visibility),
        moderation_status: String(row.moderation_status),
        language: String(row.language),
        category: (row.category as string | null) ?? null,
        city: (row.city as string | null) ?? null,
        target_church_id: (row.target_church_id as string | null) ?? null,
      };
      const eligible = candidates.filter((t) => isPrayerTeamEligible(t, prayer));
      const selection = selectPrayerNetworkTeams(prayer, candidates);
      routingByPrayer.set(String(row.id), {
        eligible: eligible.map((t) => t.churchName),
        selected: selection.selected.map((t) => t.churchName),
        reason: selection.reason,
      });
    }
  }

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
        helperText="Do not publish private prayer. Prayer Network routes only CLEARLY_SAFE private requests. Crisis is never routed to church teams."
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
                {prayer ? (
                  <PrayerModerationCard
                    row={prayer}
                    deliveries={deliveries.filter((d) => String(d.prayer_request_id) === String(prayer.id))}
                    churchNames={churchNames}
                    routing={routingByPrayer.get(String(prayer.id)) ?? null}
                  />
                ) : (
                  <p className="mt-2 text-sm">Prayer missing.</p>
                )}
              </article>
            );
          })
        : rows.map((row) => (
            <PrayerModerationCard
              key={String(row.id)}
              row={row}
              deliveries={deliveries.filter((d) => String(d.prayer_request_id) === String(row.id))}
              churchNames={churchNames}
              routing={routingByPrayer.get(String(row.id)) ?? null}
            />
          ))}

      {tab === "reports" && reports.length === 0 ? <p className="text-sm text-[#7A7164]">No reports.</p> : null}
      {tab !== "reports" && rows.length === 0 ? <p className="text-sm text-[#7A7164]">No prayers in this filter.</p> : null}

      <Link href="/admin/workspace/iglesias" className={adminBtnSecondary}>
        ← Church queue
      </Link>
    </div>
  );
}

function PrayerModerationCard({
  row,
  deliveries,
  churchNames,
  routing,
}: {
  row: Record<string, unknown>;
  deliveries: Array<Record<string, unknown>>;
  churchNames: Map<string, string>;
  routing: { eligible: string[]; selected: string[]; reason: string } | null;
}) {
  const id = String(row.id);
  const showContact = row.contact_consent === true;
  const failedRetryable = deliveries.some(
    (d) => String(d.delivery_channel) === "EMAIL" && String(d.delivery_status) === "FAILED" && Number(d.attempt_count) < 3,
  );
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
      {routing ? (
        <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFDF7] px-3 py-2 text-sm">
          <p className="font-semibold">Prayer Network delivery</p>
          <p>Reason: {routing.reason}</p>
          <p>Eligible teams: {routing.eligible.length ? routing.eligible.join(", ") : "none"}</p>
          <p>Selected teams: {routing.selected.length ? routing.selected.join(", ") : "none"}</p>
          {deliveries.length ? (
            <ul className="mt-2 space-y-1 text-xs">
              {deliveries.map((d) => (
                <li key={String(d.id)}>
                  {churchNames.get(String(d.church_id)) || String(d.church_id)} · {String(d.delivery_channel)} · {String(d.delivery_status)} · attempts {String(d.attempt_count)} · delivered {d.delivered_at ? String(d.delivered_at) : "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs">No delivery records yet.</p>
          )}
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
        {failedRetryable ? (
          <form action={retryPrayerEmailDeliveryAction}>
            <input type="hidden" name="prayer_id" value={id} />
            <button className={adminBtnSecondary} type="submit">
              Retry email delivery
            </button>
          </form>
        ) : null}
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
