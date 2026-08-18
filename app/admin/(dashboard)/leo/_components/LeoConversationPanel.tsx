"use client";

import { useId, useRef, useState, useTransition } from "react";

import { adminBtnPrimary, adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";
import type { LeoConversationAnswer, LeoPreparedAction } from "@/app/leo/_lib/leoTypes";

const QUICK_QUESTIONS = [
  "What needs my attention?",
  "Who needs follow-up?",
  "What can you do?",
  "Can you deploy Production?",
] as const;

type ApiOk = { ok: true; answer: LeoConversationAnswer };
type ApiErr = { ok: false; error?: string; message?: string; reason?: string };

function governanceNote(answer: LeoConversationAnswer): string | null {
  const g = answer.governance;
  if (!g) return null;
  if (g.level === "YELLOW") return "Preparation allowed — not executed";
  if (g.level === "RED") return "Chuy approval required. Execution unavailable in LEO v0.";
  if (g.level === "NEVER") return "Blocked by governance.";
  return `Governance: ${g.level}`;
}

function PreparedBlock({ prepared }: { prepared: LeoPreparedAction }) {
  return (
    <div className="mt-3 rounded-xl border border-[#C9B46A]/50 bg-[#FFFCF7] p-3 sm:p-4">
      <div className="flex min-w-0 flex-wrap gap-2">
        <span className="rounded-md border border-[#2A4536]/30 bg-[#EEF4F0] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2A4536]">
          PREPARED
        </span>
        <span className="rounded-md border border-[#C9B46A]/60 bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
          NOT_EXECUTED
        </span>
        <span className="rounded-md border border-[color:var(--lx-border)] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C5346]">
          {prepared.preparationKind}
        </span>
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">{prepared.title}</p>
      <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{prepared.purpose}</p>
      {prepared.governance.level === "YELLOW" ? (
        <p className="mt-2 text-xs font-semibold text-[#5C4E2E]">Preparation allowed — not executed</p>
      ) : null}
      {prepared.governance.level === "RED" ? (
        <p className="mt-2 text-xs font-semibold text-rose-900">
          Chuy approval required. Execution unavailable in LEO v0.
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
  const govLine = governanceNote(answer);
  return (
    <div className="mt-4 min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-white/70 p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
        <span className="text-[#A67C52]">{answer.intent}</span>
        <span className="text-[#5C5346]">{answer.answerState}</span>
        {answer.governance ? (
          <span className="text-[#1E4A7A]">governance {answer.governance.level}</span>
        ) : null}
      </div>
      <p className="mt-2 break-words text-sm font-semibold leading-relaxed text-[#1E1810]">{answer.summary}</p>
      {govLine ? <p className="mt-2 text-xs font-semibold text-[#5C5346]">{govLine}</p> : null}

      {answer.preparedAction ? <PreparedBlock prepared={answer.preparedAction} /> : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#A67C52]">
          Why LEO says this
        </summary>
        <div className="mt-2 space-y-3 border-t border-[color:var(--lx-border)]/50 pt-2">
          {answer.evidence.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-[#5C5346]">Evidence</p>
              <ul className="mt-1 space-y-1.5">
                {answer.evidence.map((e, i) => (
                  <li key={`${e.sourceKind}-${e.sourceRef}-${i}`} className="break-words text-xs text-[#5C5346]">
                    <span className="font-semibold text-[#1E1810]">{e.sourceKind}</span>
                    {e.sourceRef ? ` · ${e.sourceRef}` : ""} — {e.summary}
                    {e.limitationNote ? (
                      <span className="mt-0.5 block text-[11px] text-amber-900">Limitation: {e.limitationNote}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-[#5C5346]">No evidence rows returned for this answer.</p>
          )}

          {answer.limitations.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-[#5C5346]">Limitations</p>
              <ul className="mt-1 space-y-1">
                {answer.limitations.map((l, i) => (
                  <li key={`lim-${i}`} className="break-words text-xs text-[#5C5346]">
                    · {l}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {answer.unknowns.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-[#5C5346]">Unknowns</p>
              <ul className="mt-1 space-y-1">
                {answer.unknowns.map((u, i) => (
                  <li key={`unk-${i}`} className="break-words text-xs text-[#5C5346]">
                    · {u}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {answer.governance ? (
            <div>
              <p className="text-[10px] font-bold uppercase text-[#5C5346]">Governance</p>
              <p className="mt-1 break-words text-xs text-[#5C5346]">
                Level {answer.governance.level}
                {answer.governance.blockedReason ? ` — ${answer.governance.blockedReason}` : ""}
                {answer.governance.approvalRequired ? " · Chuy approval required" : ""}
                {" · "}
                executionAllowed: {String(answer.governance.executionAllowed)}
              </p>
            </div>
          ) : null}
        </div>
      </details>
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
      <div className="mb-3">
        <h2 id="leo-ask-heading" className="text-lg font-bold text-[#1E1810] sm:text-xl">
          Ask LEO
        </h2>
        <p className="mt-1 text-sm text-[#5C5346]">
          One-shot owner retrieval against Leonix evidence. Not generative AI chat.
        </p>
      </div>

      <div className={`${adminCardBase} min-w-0 p-4 sm:p-5`}>
        <div className="mb-3 flex min-w-0 flex-wrap gap-2" aria-label="Quick questions">
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

        <form
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            lastSubmitted.current = null;
            submit(question);
          }}
        >
          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              Question
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
              className={`${adminInputClass} min-h-[44px]`}
            />
          </div>
          <button
            type="submit"
            disabled={pending || !question.trim()}
            className={`${adminBtnPrimary} min-h-[44px] w-full shrink-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
          >
            Ask LEO
          </button>
        </form>

        {pending ? (
          <p className="mt-3 text-sm font-medium text-[#5C5346]" aria-live="polite">
            Checking Leonix evidence…
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 break-words rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
            {error}
          </p>
        ) : null}

        {answer ? <AnswerResult answer={answer} /> : null}
      </div>
    </section>
  );
}
