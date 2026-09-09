"use client";

import { useMemo, useState } from "react";

import type { LeoConversationAnswer } from "@/app/leo/_lib/leoTypes";
import { LEO_FEEDBACK_FAILURE_LABELS } from "@/app/leo/_lib/leoFeedbackClassification";
import { LEO_FEEDBACK_FAILURE_CATEGORIES, type LeoFeedbackFailureCategory } from "@/app/leo/_lib/leoFeedbackTypes";
import { extractLeoAnswerSourceRefs } from "@/app/leo/_lib/leoFeedbackSources";
import { LEO_WORKSPACE_IDS } from "@/app/leo/_lib/leoWorkspaceModel";
import { useLeoSpokenSession } from "./LeoSpokenSession";
import { resolveLeoSpokenResponseText } from "@/app/leo/_lib/leoSpeechSynthesis";

const BTN =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2.5 text-[11px] font-semibold text-[#1E1810] hover:bg-white disabled:opacity-50";

export function LeoResponseActionBar({
  answer,
  sessionId,
  userTurnId,
  localResponseId,
  requestSnapshot,
  responseSnapshot,
  activeWorkspace,
  selectedCardId,
}: {
  answer: LeoConversationAnswer;
  sessionId: string | null;
  userTurnId: string | null;
  localResponseId: string;
  requestSnapshot: string | null;
  responseSnapshot: string;
  activeWorkspace: string | null;
  selectedCardId: string | null;
}) {
  const spoken = useLeoSpokenSession();
  const sources = useMemo(() => extractLeoAnswerSourceRefs(answer), [answer]);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<"POSITIVE" | "NEGATIVE" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<LeoFeedbackFailureCategory>("WRONG_ANSWER");
  const [expected, setExpected] = useState("");
  const [proposeFact, setProposeFact] = useState(false);
  const [busy, setBusy] = useState(false);

  const persist = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/leo/feedback", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; persistenceState?: string; error?: string };
      if (!res.ok || !json.ok) {
        setStatus(json.persistenceState === "NOT_PERSISTED" || json.error === "persistence_unavailable"
          ? "Could not save — marked not persisted."
          : "Could not save feedback.");
        return false;
      }
      setStatus("Saved.");
      return true;
    } catch {
      setStatus("Could not save — marked not persisted.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const basePayload = {
    sessionId,
    leoTurnId: answer.turnId ?? null,
    userTurnId,
    localResponseId,
    requestSnapshot,
    responseSnapshot: responseSnapshot.slice(0, 2000),
    activeWorkspace,
    selectedCardId,
    sourceRefs: sources,
  };

  return (
    <div className="min-w-0" data-leo-response-actions>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        <button
          type="button"
          className={BTN}
          aria-label="Copy response"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(responseSnapshot);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            } catch {
              setStatus("Copy isn’t available in this browser.");
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          className={BTN}
          aria-label="Thumbs up"
          disabled={busy}
          onClick={() => {
            setRating("POSITIVE");
            void persist({ ...basePayload, polarity: "POSITIVE" });
          }}
        >
          👍
        </button>
        <button
          type="button"
          className={BTN}
          aria-label="Thumbs down"
          disabled={busy}
          onClick={() => {
            setRating("NEGATIVE");
            setSheetOpen(true);
          }}
        >
          👎
        </button>
        <button
          type="button"
          className={BTN}
          aria-label="Read aloud"
          onClick={() => {
            const text = resolveLeoSpokenResponseText(answer) ?? responseSnapshot;
            if (text) spoken.speak(text);
          }}
        >
          Read aloud
        </button>
        <button
          type="button"
          className={BTN}
          aria-label="Sources"
          onClick={() => setSourcesOpen((v) => !v)}
        >
          Sources
        </button>
      </div>
      {status ? <p className="mt-1 text-[11px] text-[#5C5346]">{status}</p> : null}

      {sourcesOpen ? (
        <div className="mt-2 rounded-lg border border-[color:var(--lx-border)] bg-white p-2.5" data-leo-sources-panel>
          {sources.length === 0 ? (
            <p className="text-xs text-[#5C5346]">No source references were returned for this response.</p>
          ) : (
            <ul className="space-y-1">
              {sources.map((s) => (
                <li key={`${s.sourceKind}:${s.sourceRef}`} className="break-words text-xs text-[#1E1810]">
                  <span className="font-semibold">{s.sourceKind}</span> · {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {sheetOpen ? (
        <form
          className="mt-2 space-y-2 rounded-xl border border-[color:var(--lx-border)] bg-white p-3"
          data-leo-negative-feedback
          onSubmit={(e) => {
            e.preventDefault();
            void persist({
              ...basePayload,
              polarity: "NEGATIVE",
              failureCategory: category,
              ownerNote: note.trim() || null,
              expectedDestination:
                category === "WRONG_NAVIGATION" || category === "FAILED_NAVIGATION"
                  ? expected || null
                  : null,
              proposeFactCorrection: proposeFact,
            }).then((ok) => {
              if (ok) setSheetOpen(false);
            });
          }}
        >
          <p className="text-xs font-bold text-[#1E1810]">What went wrong?</p>
          <select
            className="min-h-[44px] w-full rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as LeoFeedbackFailureCategory)}
          >
            {LEO_FEEDBACK_FAILURE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LEO_FEEDBACK_FAILURE_LABELS[c]}
              </option>
            ))}
          </select>
          {(category === "WRONG_NAVIGATION" || category === "FAILED_NAVIGATION") ? (
            <select
              className="min-h-[44px] w-full rounded-lg border border-[color:var(--lx-border)] px-2 text-sm"
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            >
              <option value="">Expected destination (optional)</option>
              {LEO_WORKSPACE_IDS.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          ) : null}
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-[color:var(--lx-border)] px-2 py-2 text-sm"
            placeholder="Tell LEO what should have happened (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 2000))}
          />
          {category === "DATA_QUALITY_ERROR" ? (
            <label className="flex min-h-[44px] items-center gap-2 text-xs text-[#1E1810]">
              <input type="checkbox" checked={proposeFact} onChange={(e) => setProposeFact(e.target.checked)} />
              Propose a governed fact correction (does not rewrite the Living Book)
            </label>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={BTN}>
              Save
            </button>
            <button type="button" className={BTN} onClick={() => setSheetOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
