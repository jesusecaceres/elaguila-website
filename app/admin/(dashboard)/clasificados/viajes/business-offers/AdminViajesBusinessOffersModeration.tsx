"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { adminBtnSecondary, adminInputClass } from "@/app/admin/_components/adminTheme";
import type { ViajesStagedLifecycleStatus, ViajesStagedListingRow } from "@/app/(site)/clasificados/viajes/lib/viajesStagedListingTypes";

const STATUS_LABEL: Record<ViajesStagedLifecycleStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
  expired: "Expired",
  unpublished: "Unpublished",
};

function statusBadge(s: ViajesStagedLifecycleStatus) {
  const map: Record<ViajesStagedLifecycleStatus, string> = {
    draft: "bg-slate-100 text-slate-900 ring-slate-200",
    submitted: "bg-amber-100 text-amber-950 ring-amber-200",
    in_review: "bg-sky-100 text-sky-950 ring-sky-200",
    approved: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    rejected: "bg-rose-100 text-rose-900 ring-rose-200",
    changes_requested: "bg-violet-100 text-violet-950 ring-violet-200",
    expired: "bg-stone-200 text-stone-900 ring-stone-300",
    unpublished: "bg-zinc-100 text-zinc-900 ring-zinc-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${map[s]}`}>
      {STATUS_LABEL[s]}
    </span>
  );
}

const btn =
  "rounded-lg border border-[#E8DFD0]/90 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5C5346] hover:bg-[#FFFCF7] disabled:cursor-not-allowed disabled:opacity-45";

type ModerateAction = "approve" | "reject" | "request_edits" | "expire" | "unpublish" | "in_review";

export function AdminViajesBusinessOffersModeration() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ViajesStagedLifecycleStatus | "all">("all");
  const [rows, setRows] = useState<ViajesStagedListingRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoadErr(null);
    try {
      const res = await fetch("/api/admin/viajes/staged-listings", { credentials: "same-origin" });
      const json = (await res.json()) as { ok?: boolean; rows?: ViajesStagedListingRow[]; error?: string };
      if (!res.ok || !json.ok) {
        setLoadErr(json.error ?? `HTTP ${res.status}`);
        setRows([]);
        return;
      }
      setRows(json.rows ?? []);
    } catch {
      setLoadErr("network");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (status !== "all") list = list.filter((r) => r.lifecycle_status === status);
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(qq) ||
          r.slug.toLowerCase().includes(qq) ||
          (r.submitter_email ?? "").toLowerCase().includes(qq) ||
          (r.submitter_name ?? "").toLowerCase().includes(qq)
      );
    }
    list.sort((a, b) => String(b.submitted_at ?? b.created_at).localeCompare(String(a.submitted_at ?? a.created_at)));
    return list;
  }, [rows, q, status]);

  async function moderate(id: string, action: ModerateAction) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/viajes/staged-listings/moderate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          moderation_reason: reasonDraft[id]?.trim() || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        window.alert(json.error ?? "Update failed");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Search</label>
          <input
            className={adminInputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, slug, email…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold uppercase text-[#7A7164]">Queue</label>
          <select
            className={`${adminInputClass} w-auto min-w-[10rem]`}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
      </div>

      {loadErr ? (
        <p className="text-xs text-rose-800">
          Could not load queue ({loadErr}). Ensure Supabase is configured and migrations are applied, and you are logged into admin.
        </p>
      ) : (
        <p className="text-xs text-[#7A7164]">
          Actions persist to <code className="rounded bg-white/80 px-1">viajes_staged_listings</code>. Only approved + public rows appear on public Viajes.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[#E8DFD0]/90 bg-white/95 shadow-sm">
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E8DFD0]/90 bg-[#FAF7F2]/90 text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-3 py-3">Lane</th>
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Slug</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Owner</th>
              <th className="min-w-[180px] px-3 py-3">Moderation note</th>
              <th className="px-3 py-3">Actions</th>
              <th className="px-3 py-3">Links</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-[#F0E8DC]/90 hover:bg-[#FFFCF7]/95">
                <td className="px-3 py-2.5 text-xs font-semibold capitalize text-[#5C5346]">{r.lane}</td>
                <td className="px-3 py-2.5 font-semibold text-[#1E1810]">{r.title}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[#5C5346]">{r.slug}</td>
                <td className="px-3 py-2.5">{statusBadge(r.lifecycle_status)}</td>
                <td className="px-3 py-2.5 text-xs tabular-nums text-[#5C5346]">{r.submitted_at ?? "—"}</td>
                <td className="px-3 py-2.5 text-xs text-[#5C5346]">{r.owner_user_id ? r.owner_user_id.slice(0, 8) + "…" : "—"}</td>
                <td className="px-3 py-2.5">
                  <input
                    className={adminInputClass}
                    value={reasonDraft[r.id] ?? ""}
                    onChange={(e) => setReasonDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Optional reason / notes"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex max-w-[14rem] flex-col gap-1">
                    <button type="button" className={btn} disabled={busyId === r.id} onClick={() => void moderate(r.id, "approve")}>
                      Approve
                    </button>
                    <button type="button" className={btn} disabled={busyId === r.id} onClick={() => void moderate(r.id, "in_review")}>
                      Mark in review
                    </button>
                    <button type="button" className={btn} disabled={busyId === r.id} onClick={() => void moderate(r.id, "request_edits")}>
                      Request edits
                    </button>
                    <button type="button" className={btn} disabled={busyId === r.id} onClick={() => void moderate(r.id, "reject")}>
                      Reject
                    </button>
                    <button type="button" className={btn} disabled={busyId === r.id} onClick={() => void moderate(r.id, "expire")}>
                      Mark expired
                    </button>
                    <button type="button" className={btn} disabled={busyId === r.id} onClick={() => void moderate(r.id, "unpublish")}>
                      Unpublish
                    </button>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col gap-1">
                    {r.lifecycle_status === "approved" && r.is_public ? (
                      <Link
                        href={`/clasificados/viajes/oferta/${r.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#6B5B2E] underline"
                      >
                        Public offer →
                      </Link>
                    ) : (
                      <span className="text-xs text-[#7A7164]">Not public</span>
                    )}
                    <Link
                      href={`/clasificados/viajes/resultados`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#5C5346] underline"
                    >
                      Results →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={adminBtnSecondary} onClick={() => void load()}>
          Refresh queue
        </button>
        <p className="text-xs text-[#7A7164]">Bulk actions are not enabled; process row-by-row for audit clarity.</p>
      </div>
    </div>
  );
}
