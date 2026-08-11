"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BusinessMeeting, MeetingAttendee, MeetingConsentRecord, MeetingNote, MeetingTranscriptImport } from "@/app/lib/business/meetingStudio/types";

export function CreateMeetingForm({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState("discovery");
  const [language, setLanguage] = useState("es");
  const [scheduledAt, setScheduledAt] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingType, language, scheduledAt: scheduledAt || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not create meeting.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <select value={meetingType} onChange={(e) => setMeetingType(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs">
          <option value="discovery">Discovery</option>
          <option value="check_in">Check-in</option>
          <option value="proposal_review">Proposal review</option>
          <option value="follow_up">Follow-up</option>
          <option value="intake">Intake</option>
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs">
          <option value="es">ES</option>
          <option value="en">EN</option>
        </select>
        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <button type="submit" disabled={saving} className="rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {saving ? "Creating…" : "Create meeting"}
      </button>
    </form>
  );
}

export function MeetingStatusButtons({ businessId, meetingId, currentStatus }: { businessId: string; meetingId: string; currentStatus: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function transition(status: string) {
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status }),
    });
    setSaving(false);
    router.refresh();
  }

  const transitions: Record<string, { label: string; to: string }[]> = {
    planned: [{ label: "Prepare", to: "prepared" }, { label: "Cancel", to: "cancelled" }],
    prepared: [{ label: "Start", to: "in_progress" }, { label: "Cancel", to: "cancelled" }],
    in_progress: [{ label: "Complete", to: "completed" }, { label: "Cancel", to: "cancelled" }],
    completed: [],
    cancelled: [],
  };

  const buttons = transitions[currentStatus] ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.to}
          onClick={() => transition(btn.to)}
          disabled={saving}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${btn.to === "cancelled" ? "border border-red-300 text-red-700" : "bg-[#7A1E2C] text-white"}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

export function AddAttendeeForm({ businessId, meetingId }: { businessId: string; meetingId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("owner");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_attendee", attendeeType: type, displayName: name.trim() }),
    });
    setSaving(false);
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs">
        <option value="owner">Owner</option>
        <option value="staff">Staff</option>
        <option value="external">External</option>
      </select>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      <button type="submit" disabled={saving || !name.trim()} className="rounded-lg border border-[#E8DFD0] px-3 py-1 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
        Add
      </button>
    </form>
  );
}

export function ConsentButtons({ businessId, meetingId }: { businessId: string; meetingId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function record(consentType: string, state: string) {
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record_consent", consentType, state, method: "verbal", language: "es" }),
    });
    setSaving(false);
    router.refresh();
  }

  const consentTypes = ["notes", "audio_recording", "transcription", "connected_account_review", "file_photo_review", "followup_messages"];

  return (
    <div className="space-y-1">
      {consentTypes.map((ct) => (
        <div key={ct} className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#3D3428]">{ct}</span>
          <button onClick={() => record(ct, "provided")} disabled={saving} className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 disabled:opacity-50">Provided</button>
          <button onClick={() => record(ct, "declined")} disabled={saving} className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 disabled:opacity-50">Declined</button>
        </div>
      ))}
    </div>
  );
}

export function NoteForm({ businessId, meetingId }: { businessId: string; meetingId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("owner_statement");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_note", noteType, content: content.trim() }),
    });
    setSaving(false);
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs">
        <option value="owner_statement">Owner statement</option>
        <option value="staff_observation">Staff observation</option>
        <option value="potential_fact">Potential fact</option>
        <option value="unknown">Unknown</option>
        <option value="contradiction">Contradiction</option>
        <option value="decision">Decision</option>
        <option value="action_item">Action item</option>
      </select>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Note content…" rows={3} className="w-full rounded-lg border border-[#E8DFD0] px-2 py-1 text-xs" />
      <button type="submit" disabled={saving || !content.trim()} className="rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {saving ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}

export function MeetingDetailPanel({
  businessId, meeting, attendees, consents, notes, transcripts,
}: {
  businessId: string;
  meeting: BusinessMeeting;
  attendees: MeetingAttendee[];
  consents: MeetingConsentRecord[];
  notes: MeetingNote[];
  transcripts: MeetingTranscriptImport[];
}) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#1E1810]">{meeting.meetingType}</span>
        <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{meeting.status}</span>
      </div>
      <p className="mt-1 text-[10px] text-[#9A9184]">
        {meeting.language.toUpperCase()} · {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString("en-US") : "No schedule"} · created {new Date(meeting.createdAt).toLocaleString("en-US")}
      </p>

      <div className="mt-3">
        <MeetingStatusButtons businessId={businessId} meetingId={meeting.id} currentStatus={meeting.status} />
      </div>

      {meeting.status !== "cancelled" && meeting.status !== "completed" ? (
        <>
          <h4 className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Attendees</h4>
          <ul className="mt-1 space-y-1">
            {attendees.map((a) => (
              <li key={a.id} className="text-xs text-[#3D3428]">
                {a.displayName} <span className="text-[#9A9184]">({a.attendeeType} · {a.attendanceState})</span>
              </li>
            ))}
            {attendees.length === 0 ? <li className="text-xs text-[#7A7164]">No attendees yet.</li> : null}
          </ul>
          <div className="mt-2"><AddAttendeeForm businessId={businessId} meetingId={meeting.id} /></div>

          <h4 className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Consent</h4>
          <ul className="mt-1 space-y-1">
            {consents.map((c) => (
              <li key={c.id} className="text-xs text-[#3D3428]">
                {c.consentType} — <span className={c.state === "provided" ? "text-emerald-700" : "text-red-700"}>{c.state}</span> <span className="text-[#9A9184]">({c.method})</span>
              </li>
            ))}
            {consents.length === 0 ? <li className="text-xs text-[#7A7164]">No consent recorded yet.</li> : null}
          </ul>
          <div className="mt-2"><ConsentButtons businessId={businessId} meetingId={meeting.id} /></div>

          <h4 className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Notes</h4>
          <ul className="mt-1 space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded border border-[#E8DFD0] p-2 text-xs">
                <span className="font-semibold text-[#3D3428]">{n.noteType}</span> <span className="text-[#9A9184]">({n.sourceClass})</span>
                {n.requiresConfirmation ? <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">needs confirmation</span> : null}
                <p className="mt-1 text-[#3D3428]">{n.content}</p>
              </li>
            ))}
            {notes.length === 0 ? <li className="text-xs text-[#7A7164]">No notes yet.</li> : null}
          </ul>
          <div className="mt-2"><NoteForm businessId={businessId} meetingId={meeting.id} /></div>

          {transcripts.length > 0 ? (
            <>
              <h4 className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Transcript imports</h4>
              <ul className="mt-1 space-y-1">
                {transcripts.map((t) => (
                  <li key={t.id} className="text-xs text-[#3D3428]">
                    {t.importMethod} · {t.language.toUpperCase()} · {t.status}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : null}

      {meeting.recapEn ? (
        <div className="mt-3 rounded border border-[#E8DFD0] bg-[#FAF7F2] p-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Recap</p>
          <p className="mt-1 text-xs text-[#3D3428]">{meeting.recapEn}</p>
        </div>
      ) : null}
    </div>
  );
}
