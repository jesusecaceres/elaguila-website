"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import type { BusinessMeeting, MeetingAttendee, MeetingConsentRecord, MeetingNote, MeetingNotePromotion, MeetingTranscriptImport } from "@/app/lib/business/meetingStudio/types";
import type { FactCategory } from "@/app/lib/business/livingBook/types";
import { eligiblePromotionDestinations } from "@/app/lib/business/meetingStudio/logic";

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

const FACT_CATEGORIES = [
  { value: "business_and_owner_goals", label: "Business & owner goals" },
  { value: "customers_and_market", label: "Customers & market" },
  { value: "products_and_services", label: "Products & services" },
  { value: "operations_and_capacity", label: "Operations & capacity" },
  { value: "visibility_and_communication", label: "Visibility & communication" },
  { value: "challenges_and_readiness", label: "Challenges & readiness" },
  { value: "other", label: "Other" },
] as const;

function noteTypeLabel(noteType: string): string {
  switch (noteType) {
    case "owner_statement": return "Owner statement";
    case "staff_observation": return "Staff observation";
    case "potential_fact": return "Potential fact";
    case "unknown": return "Unknown";
    case "contradiction": return "Contradiction";
    case "decision": return "Decision";
    case "action_item": return "Action item";
    default: return noteType;
  }
}

function destinationLabel(dest: string): string {
  switch (dest) {
    case "fact": return "fact";
    case "unknown": return "unknown";
    case "contradiction": return "contradiction";
    default: return dest;
  }
}

function NoteCard({ note, businessId, meetingId, initialPromotion }: {
  note: MeetingNote;
  businessId: string;
  meetingId: string;
  initialPromotion: MeetingNotePromotion | null;
}) {
  const [promotion, setPromotion] = useState<MeetingNotePromotion | null>(initialPromotion);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fact fields
  const [factKey, setFactKey] = useState(note.potentialFactKey ?? "");
  const [factCategory, setFactCategory] = useState<FactCategory>(FACT_CATEGORIES[0].value as FactCategory);
  const [displayValue, setDisplayValue] = useState("");

  // Unknown fields
  const [questionLabel, setQuestionLabel] = useState(note.content.slice(0, 300));

  // Contradiction fields
  const [claimA, setClaimA] = useState("");
  const [claimB, setClaimB] = useState("");

  const eligibleDests = eligiblePromotionDestinations(note.noteType);
  const primaryDest = eligibleDests[0] ?? null;
  const isEligible = eligibleDests.length > 0;

  async function submitPromotion() {
    if (!primaryDest) return;
    setSubmitting(true);
    setFormError(null);

    const body: Record<string, unknown> = {
      action: "promote_note",
      noteId: note.id,
      destination: primaryDest,
    };
    if (primaryDest === "fact") {
      body.factKey = factKey;
      body.factCategory = factCategory;
      body.displayValue = displayValue;
    }
    if (primaryDest === "unknown") {
      body.questionLabel = questionLabel;
    }
    if (primaryDest === "contradiction") {
      body.claimALabel = claimA;
      body.claimBLabel = claimB;
    }

    const res = await fetch(`/api/admin/businesses/${businessId}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (res.status === 409) {
      setFormError("Already promoted.");
      setShowForm(false);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "Promotion failed.");
      return;
    }

    const data = await res.json();
    setPromotion({
      id: data.destinationId,
      businessId,
      meetingId,
      meetingNoteId: note.id,
      destinationType: data.destinationType,
      destinationRecordId: data.destinationId,
      promotedByRosterId: null,
      promotedByAuthUserId: "",
      promotedByEmail: "",
      promotedByRole: "",
      createdAt: new Date().toISOString(),
    });
    setShowForm(false);
  }

  return (
    <li className="rounded border border-[#E8DFD0] p-2 text-xs">
      <div className="flex flex-wrap items-start justify-between gap-1">
        <div>
          <span className="font-semibold text-[#3D3428]">{noteTypeLabel(note.noteType)}</span>{" "}
          <span className="text-[#9A9184]">({note.sourceClass})</span>
          {note.requiresConfirmation ? (
            <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">Needs confirmation</span>
          ) : null}
          {note.noteType === "owner_statement" ? (
            <span className="ml-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-700">Owner statement — not yet confirmed</span>
          ) : null}
        </div>
        {promotion ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
            Promoted as {destinationLabel(promotion.destinationType)}
          </span>
        ) : isEligible && !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded border border-[#C8A94A] px-2 py-0.5 text-[9px] font-semibold text-[#8A6B1F] hover:bg-[#FAF7F2]"
          >
            Promote to Living Book
          </button>
        ) : null}
      </div>

      <p className="mt-1 text-[#3D3428]">{note.content}</p>

      {formError ? <p className="mt-1 text-[9px] text-red-700">{formError}</p> : null}

      {showForm && primaryDest && !promotion ? (
        <div className="mt-2 space-y-2 rounded border border-[#D4B896] bg-[#FAF7F2] p-2">
          <p className="text-[10px] font-bold text-[#8A6B1F] uppercase tracking-wide">
            Promote to Living Book — {destinationLabel(primaryDest)}
          </p>

          {primaryDest === "fact" ? (
            <>
              {note.noteType === "owner_statement" ? (
                <p className="text-[9px] text-amber-700">Owner statement — will be recorded as stated, not confirmed.</p>
              ) : note.noteType === "potential_fact" ? (
                <p className="text-[9px] text-amber-700">Potential fact — will remain unconfirmed until owner confirms.</p>
              ) : null}
              <div className="space-y-1">
                <label className="block text-[9px] font-semibold text-[#3D3428]">Fact key (required)</label>
                <input
                  value={factKey}
                  onChange={(e) => setFactKey(e.target.value)}
                  placeholder="e.g. owner_phone, primary_service"
                  className="w-full rounded border border-[#E8DFD0] px-2 py-1 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-semibold text-[#3D3428]">Fact category (required)</label>
                <select
                  value={factCategory}
                  onChange={(e) => setFactCategory(e.target.value as FactCategory)}
                  className="rounded border border-[#E8DFD0] px-2 py-1 text-xs"
                >
                  {FACT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-semibold text-[#3D3428]">Display value</label>
                <input
                  value={displayValue}
                  onChange={(e) => setDisplayValue(e.target.value)}
                  placeholder="Human-readable value"
                  className="w-full rounded border border-[#E8DFD0] px-2 py-1 text-xs"
                />
              </div>
            </>
          ) : primaryDest === "unknown" ? (
            <>
              <p className="text-[9px] text-[#7A7164]">This note will become an open unknown in the Living Book.</p>
              <div className="space-y-1">
                <label className="block text-[9px] font-semibold text-[#3D3428]">Unknown question</label>
                <textarea
                  value={questionLabel}
                  onChange={(e) => setQuestionLabel(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-[#E8DFD0] px-2 py-1 text-xs"
                />
              </div>
            </>
          ) : primaryDest === "contradiction" ? (
            <>
              <p className="text-[9px] text-[#7A7164]">Enter both sides of the contradiction explicitly.</p>
              <div className="space-y-1">
                <label className="block text-[9px] font-semibold text-[#3D3428]">Claim A (required)</label>
                <input
                  value={claimA}
                  onChange={(e) => setClaimA(e.target.value)}
                  placeholder="First claim"
                  className="w-full rounded border border-[#E8DFD0] px-2 py-1 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-semibold text-[#3D3428]">Claim B (required)</label>
                <input
                  value={claimB}
                  onChange={(e) => setClaimB(e.target.value)}
                  placeholder="Conflicting claim"
                  className="w-full rounded border border-[#E8DFD0] px-2 py-1 text-xs"
                />
              </div>
            </>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={submitPromotion}
              disabled={submitting}
              className="rounded-lg bg-[#7A1E2C] px-3 py-1 text-[10px] font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Promoting…" : "Confirm promotion"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              disabled={submitting}
              className="rounded-lg border border-[#E8DFD0] px-3 py-1 text-[10px] text-[#3D3428] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function NotesSection({ notes, businessId, meetingId, activeOnly }: {
  notes: MeetingNote[];
  businessId: string;
  meetingId: string;
  activeOnly: boolean;
}) {
  const [promotionMap, setPromotionMap] = useState<Record<string, MeetingNotePromotion>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/businesses/${businessId}/meetings/${meetingId}`)
      .then((r) => r.json())
      .then((data: { promotions?: MeetingNotePromotion[] }) => {
        const map: Record<string, MeetingNotePromotion> = {};
        for (const p of (data.promotions ?? [])) {
          map[p.meetingNoteId] = p;
        }
        setPromotionMap(map);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [businessId, meetingId]);

  return (
    <>
      <h4 className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Notes</h4>
      <ul className="mt-1 space-y-2">
        {notes.map((n) => (
          <NoteCard
            key={n.id}
            note={n}
            businessId={businessId}
            meetingId={meetingId}
            initialPromotion={loaded ? (promotionMap[n.id] ?? null) : null}
          />
        ))}
        {notes.length === 0 ? <li className="text-xs text-[#7A7164]">No notes yet.</li> : null}
      </ul>
      {activeOnly ? <div className="mt-2"><NoteForm businessId={businessId} meetingId={meetingId} /></div> : null}
    </>
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
  const isActive = meeting.status !== "cancelled" && meeting.status !== "completed";

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

      {isActive ? (
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
        </>
      ) : null}

      {/* Notes are visible for all meeting states so promotions remain accessible after completion */}
      <NotesSection
        notes={notes}
        businessId={businessId}
        meetingId={meeting.id}
        activeOnly={isActive}
      />

      {isActive && transcripts.length > 0 ? (
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

      {meeting.recapEn ? (
        <div className="mt-3 rounded border border-[#E8DFD0] bg-[#FAF7F2] p-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Recap</p>
          <p className="mt-1 text-xs text-[#3D3428]">{meeting.recapEn}</p>
        </div>
      ) : null}
    </div>
  );
}
