"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BusinessCommitment, CommitmentEvent } from "@/app/lib/business/promiseKeeper/types";

export function CreateCommitmentForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [titleEn, setTitleEn] = useState("");
  const [titleEs, setTitleEs] = useState("");
  const [responsibleParty, setResponsibleParty] = useState("shared");
  const [dueAt, setDueAt] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titleEn.trim() || !titleEs.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/commitments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleEn: titleEn.trim(),
        titleEs: titleEs.trim(),
        responsibleParty,
        dueAt: dueAt || null,
      }),
    });
    setSaving(false);
    setTitleEn("");
    setTitleEs("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Commitment (EN)" className="w-full rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      <input value={titleEs} onChange={(e) => setTitleEs(e.target.value)} placeholder="Compromiso (ES)" className="w-full rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      <div className="flex flex-wrap gap-2">
        <select value={responsibleParty} onChange={(e) => setResponsibleParty(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs">
          <option value="owner">Owner</option>
          <option value="staff">Staff</option>
          <option value="shared">Shared</option>
          <option value="external">External</option>
        </select>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      </div>
      <button type="submit" disabled={saving || !titleEn.trim() || !titleEs.trim()} className="rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {saving ? "Creating…" : "Create commitment"}
      </button>
    </form>
  );
}

export function CommitmentActions({ businessId, commitment }: { businessId: string; commitment: BusinessCommitment }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/commitments/${commitment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  const transitions: Record<string, { label: string; to: string }[]> = {
    planned: [{ label: "Start", to: "active" }, { label: "Release", to: "released" }],
    active: [{ label: "Block", to: "blocked" }, { label: "Complete", to: "completed" }, { label: "Release", to: "released" }],
    blocked: [{ label: "Resume", to: "active" }, { label: "Release", to: "released" }],
    completed: [],
    released: [],
  };

  const buttons = transitions[commitment.status] ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.to}
          onClick={() => patch({ status: btn.to })}
          disabled={saving}
          className={`rounded-lg px-2 py-1 text-[10px] font-bold disabled:opacity-50 ${
            btn.to === "released" ? "border border-neutral-300 text-neutral-600" :
            btn.to === "completed" ? "bg-emerald-600 text-white" :
            btn.to === "blocked" ? "border border-amber-400 text-amber-800" :
            "bg-[#7A1E2C] text-white"
          }`}
        >
          {btn.label}
        </button>
      ))}
      {commitment.status === "active" || commitment.status === "blocked" ? (
        <button onClick={() => patch({ helpRequested: !commitment.helpRequested })} disabled={saving} className="rounded-lg border border-blue-300 px-2 py-1 text-[10px] font-bold text-blue-700 disabled:opacity-50">
          {commitment.helpRequested ? "Help requested" : "Request help"}
        </button>
      ) : null}
    </div>
  );
}

export function CommitmentDetailPanel({
  businessId, commitment, events,
}: {
  businessId: string;
  commitment: BusinessCommitment;
  events: CommitmentEvent[];
}) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#1E1810]">{commitment.titleEn}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          commitment.status === "completed" ? "bg-emerald-100 text-emerald-800" :
          commitment.status === "blocked" ? "bg-amber-100 text-amber-800" :
          commitment.status === "released" ? "bg-neutral-100 text-neutral-500" :
          "bg-[#EDE6D6] text-[#3D3428]"
        }`}>{commitment.status}</span>
      </div>
      <p className="mt-1 text-xs text-[#7A7164]">{commitment.titleEs}</p>
      <p className="mt-1 text-[10px] text-[#9A9184]">
        {commitment.responsibleParty} · capacity: {commitment.capacityState}
        {commitment.dueAt ? ` · due ${new Date(commitment.dueAt).toLocaleDateString("en-US")}` : ""}
        {commitment.helpRequested ? " · help requested" : ""}
      </p>
      {commitment.blocker ? (
        <p className="mt-1 text-xs font-semibold text-amber-800">Blocker: {commitment.blocker}</p>
      ) : null}
      {commitment.smallestNextStep ? (
        <p className="mt-1 text-xs text-[#3D3428]">Next step: {commitment.smallestNextStep}</p>
      ) : null}

      <div className="mt-2">
        <CommitmentActions businessId={businessId} commitment={commitment} />
      </div>

      {events.length > 0 ? (
        <>
          <h4 className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Event history</h4>
          <ul className="mt-1 space-y-1">
            {events.map((ev) => (
              <li key={ev.id} className="text-[10px] text-[#7A7164]">
                {new Date(ev.createdAt).toLocaleString("en-US")} — <span className="font-semibold">{ev.eventType}</span> by {ev.eventByEmail}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
