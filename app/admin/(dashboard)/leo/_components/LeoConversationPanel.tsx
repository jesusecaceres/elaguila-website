"use client";

import { useId, useRef, useState, useTransition } from "react";

import { adminBtnPrimary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import type { LeoConversationAnswer, LeoPreparedAction } from "@/app/leo/_lib/leoTypes";

import { scrubOwnerFacingText } from "./leoOwnerPresentation";

const QUICK_QUESTIONS = [
  "What needs my attention?",
  "Who is waiting on us?",
  "What can you do?",
  "Can you deploy Production?",
] as const;

type ApiOk = { ok: true; answer: LeoConversationAnswer };
type ApiErr = { ok: false; error?: string; message?: string; reason?: string };

function PreparedBlock({ prepared }: { prepared: LeoPreparedAction }) {
  return (
    <div className="mt-3 rounded-xl border border-[#C9B46A]/50 bg-[#FFFCF7] p-3">
      <div className="flex min-w-0 flex-wrap gap-2">
        <span className="rounded-md border border-[#2A4536]/30 bg-[#EEF4F0] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2A4536]">
          PREPARED
        </span>
        <span className="rounded-md border border-[#C9B46A]/60 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
          NOT_EXECUTED
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">{prepared.title}</p>
      <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{prepared.purpose}</p>
      {prepared.governance.level === "YELLOW" ? (
        <p className="mt-2 text-xs font-semibold text-[#5C4E2E]">Preparation allowed — not executed</p>
      ) : null}
      {prepared.governance.level === "RED" ? (
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-rose-900">
          CHUY APPROVAL REQUIRED — Execution remains unavailable.
        </p>
      ) : null}
      {prepared.draftSteps.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#A67C52]">
            Draft outline
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[#5C5346]">
            {prepared.draftSteps.slice(0, 8).map((step, i) => (
              <li key={`${prepared.id}-step-${i}`} className="break-words">
                {step}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}

function AnswerResult({ answer }: { answer: LeoConversationAnswer }) {
  const isRed = answer.governance?.level === "RED";
  return (
    <div className="mt-4 min-w-0 space-y-3 rounded-xl border border-[color:var(--lx-border)]/70 bg-white/80 p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Answer</p>
        <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-[#1E1810]">
          {scrubOwnerFacingText(answer.summary)}
        </p>
        <p className="mt-1 text-[11px] text-[#5C5346]">
          {answer.intent.replace(/_/g, " ")} · {answer.answerState.replace(/_/g, " ")}
        </p>
      </div>

      {isRed ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-rose-900">
          CHUY APPROVAL REQUIRED — Execution remains unavailable.
        </p>
      ) : null}

      {answer.preparedAction ? <PreparedBlock prepared={answer.preparedAction} /> : null}

      <details className="min-w-0">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#A67C52]">
          Why / Evidence
        </summary>
        <div className="mt-2 space-y-2 border-t border-[color:var(--lx-border)]/50 pt-2">
          {answer.evidence.length > 0 ? (
            <ul className="space-y-1.5">
              {answer.evidence.map((e, i) => (
                <li key={`${e.sourceKind}-${e.sourceRef}-${i}`} className="break-words text-xs text-[#5C5346]">
                  {scrubOwnerFacingText(e.summary)}
                  {e.limitationNote ? (
                    <span className="mt-0.5 block text-[11px] text-amber-900">
                      Limitation: {scrubOwnerFacingText(e.limitationNote)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#5C5346]">No evidence rows returned for this answer.</p>
          )}
        </div>
      </details>

      {(answer.unknowns.length > 0 || answer.limitations.length > 0) && (
        <details className="min-w-0">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#A67C52]">
            Unknown / Limitations
          </summary>
          <div className="mt-2 space-y-2 border-t border-[color:var(--lx-border)]/50 pt-2">
            {answer.unknowns.map((u, i) => (
              <p key={`unk-${i}`} className="break-words text-xs text-[#5C5346]">
                · {scrubOwnerFacingText(u)}
              </p>
            ))}
            {answer.limitations.map((l, i) => (
              <p key={`lim-${i}`} className="break-words text-xs text-[#5C5346]">
                · {scrubOwnerFacingText(l)}
              </p>
            ))}
          </div>
        </details>
      )}

      {answer.governance ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Governance</p>
          <p className="mt-1 break-words text-xs text-[#5C5346]">
            {answer.governance.level}
            {answer.governance.approvalRequired ? " · Chuy approval required" : ""}
            {answer.governance.level === "YELLOW" ? " · Preparation allowed — not executed" : ""}
            {answer.governance.blockedReason
              ? ` — ${scrubOwnerFacingText(answer.governance.blockedReason)}`
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function LeoConversationPanel() {
  const inputId = useId();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<LeoConversationAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lastSubmitted = useRef<string | null>(null);

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed || pending) return;
    if (lastSubmitted.current === trimmed && answer) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/leo/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ question: trimmed }),
        });
        const data = (await res.json()) as ApiOk | ApiErr;
        if (!res.ok || !data.ok || !("answer" in data)) {
          const msg =
            data && "message" in data && data.message
              ? data.message
              : "Could not retrieve an answer from available Leonix evidence.";
          setError(msg);
          return;
        }
        lastSubmitted.current = trimmed;
        setAnswer(data.answer);
      } catch {
        setError("Could not reach LEO conversation. Try again.");
      }
    });
  }

  return (
    <section className="min-w-0" aria-labelledby="leo-ask-heading">
      <div className={`${adminCardBase} min-w-0 border-[#7A1E2C]/15 p-4 shadow-[0_12px_40px_-16px_rgba(122,30,44,0.18)] sm:p-5`}>
        <div className="mb-3">
          <h2 id="leo-ask-heading" className="text-xl font-bold tracking-tight text-[#1E1810] sm:text-2xl">
            Ask LEO
          </h2>
          <p className="mt-1 text-sm text-[#5C5346]">
            Ask about priorities, follow-ups, decisions, or what LEO can do.
          </p>
          <p className="mt-0.5 text-[11px] text-[#5C5346]/80">Answers come from current Leonix evidence.</p>
        </div>

        <form
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
          onSubmit={(e) => {
            e.preventDefault();
            lastSubmitted.current = null;
            submit(question);
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              Ask LEO
            </label>
            <input
              id={inputId}
              name="question"
              type="text"
              autoComplete="off"
              disabled={pending}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What needs my attention?"
              className={`${adminInputClass} min-h-[48px] text-base`}
            />
          </div>
          <button
            type="submit"
            disabled={pending || !question.trim()}
            className={`${adminBtnPrimary} min-h-[48px] w-full shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
          >
            Ask LEO
          </button>
        </form>

        <div className="mt-3 flex min-w-0 flex-wrap gap-2" aria-label="Quick questions">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={pending}
              className="inline-flex min-h-[40px] max-w-full items-center rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-3 py-2 text-left text-xs font-semibold text-[#1E1810] transition hover:bg-white disabled:opacity-60"
              onClick={() => {
                setQuestion(q);
                lastSubmitted.current = null;
                submit(q);
              }}
            >
              <span className="break-words">{q}</span>
            </button>
          ))}
        </div>

        {pending ? (
          <p className="mt-3 text-sm font-medium text-[#5C5346]" aria-live="polite">
            Checking Leonix evidence…
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-3 break-words rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {answer ? <AnswerResult answer={answer} /> : null}
      </div>
    </section>
  );
}
