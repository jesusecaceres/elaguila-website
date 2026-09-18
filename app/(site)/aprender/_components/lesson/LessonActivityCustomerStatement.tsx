"use client";

import { useState } from "react";
import { FiCopy, FiTrash2 } from "react-icons/fi";
import {
  MAX_STATEMENT_ANSWER_LENGTH,
  buildCustomerStatement,
  type CustomerStatementAnswers,
} from "@/app/lib/business/learning/lessonPackage/customerStatement";
import type { LessonLang } from "@/app/lib/business/learning/lessonPackage/types";
import { LEARNING_BTN_OUTLINE, LEARNING_FOCUS_RING } from "../learningUi";
import { copyText, useLessonLocalState } from "./lessonLocalStore";

export type ActivityFieldView = { key: string; label: string; placeholder: string };

/**
 * Gate G2 — `customer_statement_builder`. Five labelled questions; the sentence below is assembled
 * live from the learner's own words only (see buildCustomerStatement). Blanks stay blanks. No AI,
 * no network: answers live in this device's localStorage.
 */
export function LessonActivityCustomerStatement({
  lessonKey,
  lang,
  fields,
  copy,
}: {
  lessonKey: string;
  lang: LessonLang;
  fields: ActivityFieldView[];
  copy: { statementLabel: string; statementHint: string; progress: string; copy: string; copied: string; clear: string; savedLocal: string };
}) {
  const { state, update } = useLessonLocalState(lessonKey);
  const [copied, setCopied] = useState(false);
  const statement = buildCustomerStatement(state.answers as CustomerStatementAnswers, lang);

  function setAnswer(key: string, value: string) {
    setCopied(false);
    update((prev) => ({ ...prev, answers: { ...prev.answers, [key]: value.slice(0, MAX_STATEMENT_ANSWER_LENGTH) } }));
  }

  async function onCopy() {
    setCopied(await copyText(statement.text));
  }

  return (
    <div>
      <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
        {fields.map((f, i) => {
          const id = `actividad-${lessonKey}-${f.key}`;
          return (
            <div key={f.key} className="min-w-0">
              <label htmlFor={id} className="flex items-baseline gap-2 font-serif text-lg font-bold leading-snug text-[#2A4536]">
                <span className="text-sm font-bold text-[#C9A84A]" aria-hidden>
                  {i + 1}
                </span>
                {f.label}
              </label>
              <input
                id={id}
                type="text"
                inputMode="text"
                autoComplete="off"
                maxLength={MAX_STATEMENT_ANSWER_LENGTH}
                value={state.answers[f.key] ?? ""}
                onChange={(e) => setAnswer(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={`mt-1.5 min-h-12 w-full rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-base text-[#1E1810] placeholder:text-[#5C5346]/70 ${LEARNING_FOCUS_RING}`}
              />
            </div>
          );
        })}
      </form>

      <div className="mt-6 rounded-2xl border-2 border-[#C9A84A]/70 bg-[#FFFDF7] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.statementLabel}</p>
          <p className="text-xs font-semibold text-[#5C5346]">
            {statement.filledCount} {copy.progress}
          </p>
        </div>
        <p className="mt-2 break-words font-serif text-xl leading-relaxed text-[#1E1810]" aria-live="polite">
          {statement.parts.map((part, i) =>
            part.kind === "text" ? (
              <span key={i}>{part.text}</span>
            ) : part.kind === "answer" ? (
              <strong key={i} className="font-bold text-[#7A1E2C]">
                {part.text}
              </strong>
            ) : (
              <span key={i} className="rounded border border-dashed border-[#5C5346]/60 px-1 font-sans text-base italic text-[#5C5346]">
                {part.text}
              </span>
            ),
          )}
        </p>
        <p className="mt-2 text-xs text-[#5C5346]">{copy.statementHint}</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="button" onClick={onCopy} disabled={statement.filledCount === 0} className={`${LEARNING_BTN_OUTLINE} disabled:cursor-not-allowed disabled:opacity-50`}>
            <FiCopy className="h-4 w-4" aria-hidden />
            {copy.copy}
          </button>
          <button
            type="button"
            onClick={() => {
              setCopied(false);
              update((prev) => ({ ...prev, answers: {} }));
            }}
            disabled={statement.filledCount === 0}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[#5C5346] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${LEARNING_FOCUS_RING}`}
          >
            <FiTrash2 className="h-4 w-4" aria-hidden />
            {copy.clear}
          </button>
          <span className="text-sm font-semibold text-[#2A4536]" role="status">
            {copied ? `✓ ${copy.copied}` : ""}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#5C5346]">{copy.savedLocal}</p>
    </div>
  );
}
