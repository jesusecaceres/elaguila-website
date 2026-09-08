"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BUSINESS_SALES_STATUSES,
  FOLLOW_UP_STATUSES,
  SALES_CONTACT_METHODS,
  SALES_NOTE_OUTCOMES,
  SALES_NOTE_TYPES,
  deriveFollowUpDisplayStatus,
  labelFrom,
  type BusinessSalesStatus,
  type FollowUpStoredStatus,
} from "@/app/admin/_lib/salesWorkspaceLogic";
import type { FollowUpRecord, SalesNoteRecord } from "@/app/admin/_lib/businessWorkspaceData";

function followUpStatusClass(status: FollowUpStoredStatus): string {
  switch (status) {
    case "overdue":
      return "bg-red-100 text-red-900";
    case "due_today":
      return "bg-amber-100 text-amber-900";
    case "waiting_on_owner":
      return "bg-purple-100 text-purple-900";
    case "completed":
      return "bg-emerald-100 text-emerald-900";
    case "cancelled":
      return "bg-neutral-100 text-neutral-500";
    default:
      return "bg-blue-100 text-blue-900";
  }
}

export function StatusQuickActions({ businessId, currentStatus }: { businessId: string; currentStatus: BusinessSalesStatus }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: BusinessSalesStatus) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not update status.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <label htmlFor="sales-status-select" className="block text-xs font-semibold text-[#3D3428]">
        Status
      </label>
      <select
        id="sales-status-select"
        value={currentStatus}
        disabled={saving}
        onChange={(e) => void setStatus(e.target.value as BusinessSalesStatus)}
        className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm"
      >
        {BUSINESS_SALES_STATUSES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.en}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function NotesPanel({
  businessId,
  notes,
  canWrite = true,
}: {
  businessId: string;
  notes: SalesNoteRecord[];
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [noteType, setNoteType] = useState<string>("conversation");
  const [body, setBody] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [outcome, setOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!body.trim()) {
      setError("Note body is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteType, body, contactMethod: contactMethod || null, outcome: outcome || null }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(String(body?.error ?? "Could not save the note."));
      return;
    }
    setBody("");
    setContactMethod("");
    setOutcome("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {canWrite ? (
      <div className="rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-4">
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">Add a note</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="note-type" className="block text-xs font-semibold text-[#3D3428]">
                Type
              </label>
              <select id="note-type" value={noteType} onChange={(e) => setNoteType(e.target.value)} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
                {SALES_NOTE_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="note-contact-method" className="block text-xs font-semibold text-[#3D3428]">
                Contact method (optional)
              </label>
              <select id="note-contact-method" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
                <option value="">—</option>
                {SALES_CONTACT_METHODS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="note-outcome" className="block text-xs font-semibold text-[#3D3428]">
                Outcome (optional)
              </label>
              <select id="note-outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="mt-1 min-h-[40px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
                <option value="">—</option>
                {SALES_NOTE_OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="note-body" className="block text-xs font-semibold text-[#3D3428]">
              Note
            </label>
            <textarea
              id="note-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              placeholder="What was said, observed, or needs follow-up…"
            />
          </div>
          {error ? (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          ) : null}
          <button type="button" onClick={() => void submit()} disabled={submitting} className="min-h-[44px] rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {submitting ? "Saving…" : "Save note"}
          </button>
        </fieldset>
      </div>
      ) : (
        <p className="text-xs text-[#7A7164]">
          Owner bootstrap cannot write roster-attributed sales notes. Use Field Agent to save Living Book staff evidence.
        </p>
      )}

      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="rounded-xl border border-[#E8DFD0] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A7164]">
              <span className="font-bold text-[#3D3428]">{labelFrom(SALES_NOTE_TYPES, note.noteType, "en")}</span>
              <span>
                {note.authorEmail} · {new Date(note.createdAt).toLocaleString("en-US")}
              </span>
            </div>
            <p className="mt-1 break-words text-sm text-[#1E1810]">{note.body}</p>
            {note.contactMethod || note.outcome ? (
              <p className="mt-1 text-[11px] text-[#7A7164]">
                {note.contactMethod ? labelFrom(SALES_CONTACT_METHODS, note.contactMethod, "en") : ""}
                {note.contactMethod && note.outcome ? " · " : ""}
                {note.outcome ? labelFrom(SALES_NOTE_OUTCOMES, note.outcome, "en") : ""}
              </p>
            ) : null}
          </li>
        ))}
        {notes.length === 0 ? <li className="text-sm text-[#7A7164]">No outreach notes yet.</li> : null}
      </ul>
    </div>
  );
}

export function FollowUpPanel({
  businessId,
  current,
  canWrite = true,
}: {
  businessId: string;
  current: FollowUpRecord | null;
  canWrite?: boolean;
}) {
  const router = useRouter();
  const [scheduledDate, setScheduledDate] = useState("");
  const [purpose, setPurpose] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);
  const displayStatus = current ? deriveFollowUpDisplayStatus(current.status, current.scheduledDate, todayIso) : null;

  async function schedule() {
    if (!scheduledDate || !purpose.trim()) {
      setError("Date and purpose are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate, purpose, contactMethod: contactMethod || null }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(String(body?.error ?? "Could not schedule the follow-up."));
      return;
    }
    setScheduledDate("");
    setPurpose("");
    setContactMethod("");
    router.refresh();
  }

  async function quickAction(action: "complete" | "cancel" | "waiting_on_owner") {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/follow-up`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not update the follow-up.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {current && displayStatus ? (
        <div className="rounded-xl border border-[#E8DFD0] bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${followUpStatusClass(displayStatus)}`}>{labelFrom(FOLLOW_UP_STATUSES, displayStatus, "en")}</span>
            <span className="text-xs text-[#7A7164]">
              {current.scheduledDate}
              {current.scheduledTime ? ` · ${current.scheduledTime.slice(0, 5)}` : ""}
            </span>
          </div>
          <p className="mt-2 break-words text-sm text-[#1E1810]">{current.purpose}</p>
          {current.contactMethod ? <p className="mt-1 text-xs text-[#7A7164]">Via {labelFrom(SALES_CONTACT_METHODS, current.contactMethod, "en")}</p> : null}
          <p className="mt-1 text-[11px] text-[#7A7164]">
            Scheduled by {current.createdByEmail}
            {current.createdByRole ? ` · ${current.createdByRole}` : ""}
          </p>
          {canWrite ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={() => void quickAction("complete")} disabled={submitting} className="min-h-[44px] rounded-lg bg-[#1F3A2D] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
              Mark contacted / complete
            </button>
            <button type="button" onClick={() => void quickAction("waiting_on_owner")} disabled={submitting} className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
              Waiting on owner
            </button>
            <button type="button" onClick={() => void quickAction("cancel")} disabled={submitting} className="min-h-[44px] rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
              Not a fit right now
            </button>
          </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[#7A7164]">No follow-up scheduled.</p>
      )}

      {canWrite ? (
      <div className="rounded-2xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/60 p-4">
        <fieldset className="space-y-3">
          <legend className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{current ? "Replace follow-up" : "Schedule follow-up"}</legend>
          <p className="text-[11px] text-[#7A7164]">
            {current
              ? "A business has one current follow-up. Saving a new date replaces the current one. This is not a history timeline."
              : "When should we follow up, why, and what is the expected next action?"}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="follow-up-date" className="block text-xs font-semibold text-[#3D3428]">
                Date
              </label>
              <input id="follow-up-date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label htmlFor="follow-up-method" className="block text-xs font-semibold text-[#3D3428]">
                Contact method
              </label>
              <select id="follow-up-method" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-[#E8DFD0] bg-white px-2 py-1.5 text-sm">
                <option value="">—</option>
                {SALES_CONTACT_METHODS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="follow-up-purpose" className="block text-xs font-semibold text-[#3D3428]">
              Purpose
            </label>
            <input id="follow-up-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-sm" placeholder="e.g. confirm WhatsApp number" />
          </div>
          {error ? (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          ) : null}
          <button type="button" onClick={() => void schedule()} disabled={submitting} className="min-h-[44px] rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
            {submitting ? "Saving…" : current ? "Replace follow-up" : "Schedule follow-up"}
          </button>
        </fieldset>
      </div>
      ) : (
        <p className="text-xs text-[#7A7164]">
          Owner bootstrap cannot create roster-attributed follow-ups. Staff with a real roster use this form.
        </p>
      )}
    </div>
  );
}
