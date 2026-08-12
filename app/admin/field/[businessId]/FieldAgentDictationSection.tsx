"use client";

import { useState } from "react";
import { DictationButton } from "../FieldAgentComponents";

/**
 * Program 7, Gate 7G — Voice note capture using client-side dictation only.
 * No raw audio is ever sent to or stored on the server — only the transcribed text.
 */
export function FieldAgentDictationSection() {
  const [transcript, setTranscript] = useState("");

  return (
    <div className="space-y-2">
      <DictationButton onTranscript={(text) => setTranscript((prev) => (prev ? `${prev} ${text}` : text))} />
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="El texto dictado aparecerá aquí… / Dictated text will appear here…"
        className="w-full rounded-lg border border-[color:var(--lx-border)] p-2 text-xs"
        rows={4}
      />
    </div>
  );
}
