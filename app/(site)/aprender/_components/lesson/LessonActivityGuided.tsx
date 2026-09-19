"use client";

import { useState } from "react";
import { FiArrowDown, FiCopy, FiTrash2 } from "react-icons/fi";
import { buildGuidedResult, maxGuidedLength, type GuidedPart } from "@/app/lib/business/learning/lessonPackage/guidedResult";
import type { ActivityField, ActivityResult, LessonLang } from "@/app/lib/business/learning/lessonPackage/types";
import { LEARNING_BTN_OUTLINE, LEARNING_BTN_PRIMARY, LEARNING_FOCUS_RING } from "../learningUi";
import type { ActivityBridgeView } from "./LessonActivityCustomerStatement";
import { copyText, useLessonLocalState } from "./lessonLocalStore";

const INPUT = `mt-1.5 w-full rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-base text-[#1E1810] placeholder:text-[#5C5346]/70 ${LEARNING_FOCUS_RING}`;

function Part({ part }: { part: GuidedPart }) {
  if (part.kind === "text") return <span>{part.text}</span>;
  if (part.kind === "answer") return <strong className="whitespace-pre-line font-bold text-[#7A1E2C]">{part.text}</strong>;
  return <span className="rounded border border-dashed border-[#5C5346]/60 px-1 font-sans text-base italic text-[#5C5346]">{part.text}</span>;
}

/**
 * Gate G4 — the generic guided-fields activity. The package declares the questions and what they
 * produce (`result`: a sentence and/or a sheet of labelled sections); this component only renders
 * them. The result is assembled live from the learner's own words (see buildGuidedResult): blanks
 * stay blanks. No AI, no network: answers live in this device's localStorage. The result bridge
 * answers "what do I do with this?" and leads into the AI development lab (Bible §44A-A).
 */
export function LessonActivityGuided({
  lessonKey,
  lang,
  fields,
  result,
  bridge,
  copy,
}: {
  lessonKey: string;
  lang: LessonLang;
  fields: ActivityField[];
  result: ActivityResult;
  bridge: ActivityBridgeView | null;
  copy: { progressOf: string; clear: string; savedLocal: string };
}) {
  const { state, update } = useLessonLocalState(lessonKey);
  const [copied, setCopied] = useState(false);
  const built = buildGuidedResult(fields, result, state.answers, lang);

  function setAnswer(field: ActivityField, value: string) {
    setCopied(false);
    update((prev) => ({ ...prev, answers: { ...prev.answers, [field.key]: value.slice(0, maxGuidedLength(field)) } }));
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
                {f.label[lang]}
              </label>
              {f.multiline ? (
                <textarea
                  id={id}
                  rows={4}
                  autoComplete="off"
                  maxLength={maxGuidedLength(f)}
                  value={state.answers[f.key] ?? ""}
                  onChange={(e) => setAnswer(f, e.target.value)}
                  placeholder={f.placeholder[lang]}
                  className={`${INPUT} min-h-28 resize-y py-3 leading-relaxed`}
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={maxGuidedLength(f)}
                  value={state.answers[f.key] ?? ""}
                  onChange={(e) => setAnswer(f, e.target.value)}
                  placeholder={f.placeholder[lang]}
                  className={`${INPUT} min-h-12`}
                />
              )}
            </div>
          );
        })}
      </form>

      <div className="mt-6 rounded-2xl border-2 border-[#C9A84A]/70 bg-[#FFFDF7] p-5" data-activity-result>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{result.label[lang]}</p>
          <p className="text-xs font-semibold text-[#5C5346]">
            {built.filledCount} {copy.progressOf} {built.total}
          </p>
        </div>
        <div aria-live="polite">
          {built.sentence.length > 0 ? (
            <p className="mt-2 break-words font-serif text-xl leading-relaxed text-[#1E1810]">
              {built.sentence.map((part, i) => (
                <Part key={i} part={part} />
              ))}
            </p>
          ) : null}
          {built.sections.length > 0 ? (
            <dl className="mt-3 space-y-3">
              {built.sections.map((section) => (
                <div key={section.label} className="border-l-2 border-[#C9A84A]/70 pl-3">
                  <dt className="text-sm font-bold text-[#2A4536]">{section.label}</dt>
                  {section.lines.map((line, i) => (
                    <dd key={i} className="mt-0.5 break-words font-serif text-lg leading-snug text-[#1E1810]">
                      <Part part={line} />
                    </dd>
                  ))}
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[#5C5346]">{result.hint[lang]}</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={async () => setCopied(await copyText(built.text))}
            disabled={built.filledCount === 0}
            className={`${LEARNING_BTN_OUTLINE} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <FiCopy className="h-4 w-4" aria-hidden />
            {result.copyLabel[lang]}
          </button>
          <button
            type="button"
            onClick={() => {
              setCopied(false);
              update((prev) => ({ ...prev, answers: {} }));
            }}
            disabled={built.filledCount === 0}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[#5C5346] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${LEARNING_FOCUS_RING}`}
          >
            <FiTrash2 className="h-4 w-4" aria-hidden />
            {copy.clear}
          </button>
          <span className="text-sm font-semibold text-[#2A4536]" role="status">
            {copied ? `✓ ${result.copiedLabel[lang]}` : ""}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#5C5346]">{copy.savedLocal}</p>

      {bridge ? (
        <div className="mt-7 border-l-4 border-[#7A1E2C] pl-5" data-result-bridge>
          <h3 className="font-serif text-2xl font-bold leading-snug text-[#7A1E2C]">{bridge.title}</h3>
          <p className="mt-2 font-serif text-lg leading-snug text-[#1E1810]">{bridge.lead}</p>
          <ul className="mt-3 space-y-1.5 text-[0.9375rem] leading-relaxed text-[#3D3428]">
            {bridge.points.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84A]" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.9375rem] font-semibold leading-relaxed text-[#2A4536]">{bridge.carryForward}</p>
          {bridge.ctaHref ? (
            <a href={bridge.ctaHref} className={`mt-4 ${LEARNING_BTN_PRIMARY}`}>
              {bridge.cta}
              <FiArrowDown className="h-4 w-4" aria-hidden />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
