"use client";

import { useState } from "react";
import { FiCheck, FiCopy, FiEyeOff, FiShield } from "react-icons/fi";
import { journeyStageValue, renderPrompt } from "@/app/lib/business/learning/lessonPackage/prompts";
import type { LessonJourneyKey, LessonLang, LessonPrompt } from "@/app/lib/business/learning/lessonPackage/types";
import { LEARNING_BTN_PRIMARY, LEARNING_FOCUS_RING } from "../learningUi";
import { copyText, useLessonLocalState } from "./lessonLocalStore";

type PromptChrome = {
  neutral: string;
  version: string;
  fieldsTitle: string;
  promptLabel: string;
  copy: string;
  copied: string;
  missing: string;
  why: string;
  customize: string;
  followUps: string;
  copyFollowUp: string;
  copiedShort: string;
  privacy: string;
  verify: string;
};

/**
 * Gate G2 — AI Companion prompt block (ASK AI). Assistant-neutral: the learner copies the prompt
 * into whichever AI assistant they prefer. Leonix calls no AI API; the prompt is assembled in the
 * browser from the learner's own fields (prefilled from the activity answer and the journey stage
 * when available). Unfilled fields stay visible as [bracketed] placeholders.
 */
export function LessonPromptBlock({
  lessonKey,
  lang,
  journey,
  prompt,
  copy,
}: {
  lessonKey: string;
  lang: LessonLang;
  journey: LessonJourneyKey | null;
  prompt: LessonPrompt;
  copy: PromptChrome;
}) {
  const { state, update } = useLessonLocalState(lessonKey);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const values: Record<string, string> = {};
  for (const field of prompt.fields) {
    const typed = state.prompt[field.token];
    if (typed !== undefined) {
      values[field.token] = typed;
    } else if (field.prefillFrom?.kind === "activity_field") {
      values[field.token] = state.answers[field.prefillFrom.fieldKey] ?? "";
    } else if (field.prefillFrom?.kind === "journey_stage") {
      values[field.token] = journeyStageValue(prompt, journey, lang);
    } else {
      values[field.token] = "";
    }
  }
  const rendered = renderPrompt(prompt, lang, values);

  async function copy_(key: string, text: string) {
    setCopiedKey((await copyText(text)) ? key : null);
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-[#3D3428]">{copy.neutral}</p>

      <fieldset className="mt-5 grid gap-3 sm:grid-cols-3">
        <legend className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.fieldsTitle}</legend>
        {prompt.fields.map((field) => {
          const id = `prompt-${prompt.promptKey}-${field.token}`;
          return (
            <div key={field.token} className="min-w-0">
              <label htmlFor={id} className="block text-sm font-semibold text-[#2A4536]">
                {field.label[lang]}
              </label>
              <input
                id={id}
                type="text"
                autoComplete="off"
                maxLength={120}
                value={values[field.token]}
                placeholder={field.placeholder[lang]}
                onChange={(e) => {
                  setCopiedKey(null);
                  update((prev) => ({ ...prev, prompt: { ...prev.prompt, [field.token]: e.target.value } }));
                }}
                className={`mt-1 min-h-11 w-full rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-3 text-base text-[#1E1810] placeholder:text-[#5C5346]/70 ${LEARNING_FOCUS_RING}`}
              />
            </div>
          );
        })}
      </fieldset>

      <div className="mt-5 overflow-hidden rounded-2xl border-2 border-[#2A4536]/30 bg-[#FFFDF7]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A4536]/15 bg-[#2A4536]/[0.06] px-4 py-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#2A4536]">{copy.promptLabel}</p>
          <p className="text-xs text-[#5C5346]">
            {copy.version} {prompt.version}
          </p>
        </div>
        <p className="whitespace-pre-wrap break-words px-4 py-4 text-[0.9375rem] leading-relaxed text-[#1E1810]" data-prompt-body>
          {rendered.parts.map((part, i) =>
            part.kind === "text" ? (
              <span key={i}>{part.text}</span>
            ) : part.kind === "filled" ? (
              <strong key={i} className="font-bold text-[#7A1E2C]">
                {part.text}
              </strong>
            ) : (
              <span key={i} className="rounded border border-dashed border-[#5C5346]/60 px-1 italic text-[#5C5346]">
                {part.text}
              </span>
            ),
          )}
        </p>
        <div className="border-t border-[#2A4536]/15 px-4 py-3">
          <button type="button" onClick={() => copy_("main", rendered.text)} className={`w-full sm:w-auto ${LEARNING_BTN_PRIMARY}`}>
            {copiedKey === "main" ? <FiCheck className="h-4 w-4" aria-hidden /> : <FiCopy className="h-4 w-4" aria-hidden />}
            {copy.copy}
          </button>
          <p className="mt-2 text-sm font-semibold text-[#2A4536]" role="status">
            {copiedKey === "main" ? `✓ ${copy.copied}` : ""}
          </p>
          {rendered.missing.length > 0 ? <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{copy.missing}</p> : null}
        </div>
      </div>

      <div className="mt-7 grid gap-7 md:grid-cols-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.why}</h3>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[#3D3428]">
            {prompt.whyItWorks.map((w) => (
              <li key={w.es} className="flex gap-2">
                <FiCheck className="mt-1 h-4 w-4 shrink-0 text-[#556B3E]" aria-hidden />
                <span>{w[lang]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.customize}</h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#3D3428] marker:text-[#C9A84A]">
            {prompt.customize.map((c) => (
              <li key={c.es}>{c[lang]}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-7">
        <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.followUps}</h3>
        <ul className="mt-2 space-y-2">
          {prompt.followUps.map((f, i) => {
            const key = `follow-${i}`;
            return (
              <li key={key} className="flex items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFDF7] py-1.5 pl-4 pr-1.5">
                <span className="min-w-0 flex-1 break-words text-sm leading-snug text-[#1E1810]">{f[lang]}</span>
                <button
                  type="button"
                  onClick={() => copy_(key, f[lang])}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-[#7A1E2C] hover:bg-[#7A1E2C]/[0.07] ${LEARNING_FOCUS_RING}`}
                >
                  {copiedKey === key ? <FiCheck className="h-4 w-4" aria-hidden /> : <FiCopy className="h-4 w-4" aria-hidden />}
                  <span>{copiedKey === key ? copy.copiedShort : copy.copyFollowUp}</span>
                  <span className="sr-only">: {f[lang]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/[0.05] p-4">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#7A1E2C]">
            <FiEyeOff className="h-4 w-4" aria-hidden />
            {copy.privacy}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{prompt.privacy.intro[lang]}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#3D3428] marker:text-[#7A1E2C]">
            {prompt.privacy.never.map((n) => (
              <li key={n.es}>{n[lang]}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#2A4536]/25 bg-[#2A4536]/[0.06] p-4">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#2A4536]">
            <FiShield className="h-4 w-4" aria-hidden />
            {copy.verify}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{prompt.verify[lang]}</p>
        </div>
      </div>
    </div>
  );
}
