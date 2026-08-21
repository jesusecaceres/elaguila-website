"use client";

import { useRef, useState } from "react";
import { DictationButton } from "../FieldAgentComponents";

/**
 * Program 7, Gate 7G — Voice note capture using client-side dictation only.
 * No raw audio is ever sent to or stored on the server — only the transcribed text.
 * Persistence is an explicit Save into the existing Living Book staff_note evidence path
 * (business_evidence), never a new notes table and never auto-save on each speech fragment.
 */
export function FieldAgentDictationSection({ businessId }: { businessId: string }) {
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const inflightRef = useRef(false);

  const canSubmit = Boolean(businessId.trim()) && Boolean(transcript.trim()) && !saving;

  async function saveNote() {
    if (!canSubmit || inflightRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Sin conexión. No se puede guardar la nota. / Offline. Cannot save the note.");
      setSaved(false);
      return;
    }
    inflightRef.current = true;
    setSaving(true);
    setError(null);
    setSaved(false);
    const bodyText = transcript.trim();
    try {
      const res = await fetch(`/api/admin/businesses/${encodeURIComponent(businessId)}/book/evidence`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceType: "staff_note",
          sourceTitle: "Nota por voz / Voice note",
          capturedText: bodyText,
          consentState: "not_required",
          reliability: "medium",
          visibility: "staff_only",
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setError(String(body?.error ?? "save_failed"));
        return;
      }
      setTranscript("");
      setSaved(true);
    } catch {
      setError("save_failed");
    } finally {
      inflightRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <DictationButton
        onTranscript={(text) => {
          setSaved(false);
          setTranscript((prev) => (prev ? `${prev} ${text}` : text));
        }}
      />
      <textarea
        value={transcript}
        onChange={(e) => {
          setSaved(false);
          setTranscript(e.target.value);
        }}
        placeholder="El texto dictado aparecerá aquí… / Dictated text will appear here…"
        className="w-full rounded-lg border border-[color:var(--lx-border)] p-2 text-xs"
        rows={4}
      />
      <button
        type="button"
        onClick={() => void saveNote()}
        disabled={!canSubmit}
        className="w-full rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Guardando… / Saving…" : "Guardar nota / Save note"}
      </button>
      {saved ? (
        <p className="text-xs font-semibold text-green-800" role="status">
          Nota guardada / Note saved
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
