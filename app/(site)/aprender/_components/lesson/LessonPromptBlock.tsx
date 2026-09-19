"use client";

import { useState } from "react";
import { FiCheck, FiChevronDown, FiCopy, FiEdit3, FiEyeOff, FiShield } from "react-icons/fi";
import { editablePromptFields, renderPrompt, resolvePromptValues } from "@/app/lib/business/learning/lessonPackage/prompts";
import type { LessonJourneyKey, LessonLang, LessonPrompt } from "@/app/lib/business/learning/lessonPackage/types";
import { LEARNING_BTN_PRIMARY, LEARNING_FOCUS_RING, LEARNING_LINK } from "../learningUi";
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
  contextTitle: string;
  answersIncluded: string;
  editAnswers: string;
  purpose: string;
  startHere: string;
  moreTemplates: string;
  reminder: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

/**
 * Gate G2 / G2.1 — ASK AI: a small AI development lab. One or more FULL conversation starters,
 * assembled in the browser from the learner's own activity answers + city + stage, and stage-aware
 * (the journey picks each template's variant). Assistant-neutral: the learner copies a template
 * into whichever AI assistant they prefer. Leonix calls no AI API and sends nothing anywhere.
 * Missing values stay visible as [bracketed] blanks — nothing is ever guessed.
 *
 * The primary template is open; further templates are native <details> (content stays in the
 * HTML and works without JavaScript).
 */
export function LessonPromptBlock({
  lessonKey,
  lang,
  journey,
  prompts,
  intro,
  activityAnchor,
  copy,
}: {
  lessonKey: string;
  lang: LessonLang;
  journey: LessonJourneyKey | null;
  /** First = primary. */
  prompts: LessonPrompt[];
  intro: string | null;
  /** `#id` of the activity, when the templates draw on one. */
  activityAnchor: string | null;
  copy: PromptChrome;
}) {
  const { state, update } = useLessonLocalState(lessonKey);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const primary = prompts[0];
  const ctx = { answers: state.answers, typed: state.prompt, journey, lang };

  const activityTokens = primary.fields.filter((f) => f.prefillFrom?.kind === "activity_field");
  const primaryValues = resolvePromptValues(primary, ctx);
  const answered = activityTokens.filter((f) => (primaryValues[f.token] ?? "").trim().length > 0).length;

  async function copy_(key: string, text: string) {
    setCopiedKey((await copyText(text)) ? key : null);
  }

  function template(prompt: LessonPrompt) {
    const rendered = renderPrompt(prompt, lang, resolvePromptValues(prompt, ctx), journey);
    const key = `tpl-${prompt.promptKey}`;
    return (
      <div>
        <div className="overflow-hidden rounded-2xl border-2 border-[#2A4536]/30 bg-[#FFFDF7]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A4536]/15 bg-[#2A4536]/[0.06] px-4 py-2">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#2A4536]">{copy.promptLabel}</p>
            <p className="text-xs text-[#5C5346]">
              {copy.version} {prompt.version}
            </p>
          </div>
          <p className="whitespace-pre-wrap break-words px-4 py-4 text-[0.9375rem] leading-relaxed text-[#1E1810]" data-prompt-body={prompt.promptKey}>
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
            <button type="button" onClick={() => copy_(key, rendered.text)} className={`w-full sm:w-auto ${LEARNING_BTN_PRIMARY}`}>
              {copiedKey === key ? <FiCheck className="h-4 w-4" aria-hidden /> : <FiCopy className="h-4 w-4" aria-hidden />}
              {copy.copy}
              <span className="sr-only">: {prompt.title[lang]}</span>
            </button>
            <p className="mt-2 text-sm font-semibold text-[#2A4536]" role="status">
              {copiedKey === key ? `✓ ${copy.copied}` : ""}
            </p>
            {rendered.missing.length > 0 ? <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{copy.missing}</p> : null}
            <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{copy.reminder}</p>
          </div>
        </div>

        <h4 className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.why}</h4>
        <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-[#3D3428]">
          {prompt.whyItWorks.map((w) => (
            <li key={w.es} className="flex gap-2">
              <FiCheck className="mt-1 h-4 w-4 shrink-0 text-[#556B3E]" aria-hidden />
              <span>{w[lang]}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const heading = (prompt: LessonPrompt, index: number) => (
    <span className="flex min-w-0 flex-1 items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2A4536] font-serif text-sm font-bold text-[#F3D98A]" aria-hidden>
        {LETTERS[index] ?? index + 1}
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-xl font-bold leading-snug text-[#2A4536]">{prompt.title[lang]}</span>
        {prompt.purpose ? (
          <span className="mt-0.5 block text-sm font-normal leading-relaxed text-[#3D3428]">
            <span className="font-semibold">{copy.purpose}: </span>
            {prompt.purpose[lang]}
          </span>
        ) : null}
      </span>
    </span>
  );

  return (
    <div>
      {/* A block intro already says "the assistant you prefer"; the generic line is only for blocks without one. */}
      <p className="text-base leading-relaxed text-[#3D3428]">{intro ?? copy.neutral}</p>

      {/* CONTEXT — what the templates already know, and the two things only the learner can add. */}
      <fieldset className="mt-5 rounded-2xl border border-[#C9A84A]/55 bg-[#C9A84A]/[0.10] p-4">
        <legend className="px-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.contextTitle}</legend>
        {activityTokens.length > 0 ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0 text-sm text-[#3D3428]">
            <span>
              <strong className="font-bold text-[#2A4536]">
                {answered}/{activityTokens.length}
              </strong>{" "}
              {copy.answersIncluded}
            </span>
            {activityAnchor ? (
              <a href={activityAnchor} className={LEARNING_LINK}>
                <FiEdit3 className="h-4 w-4" aria-hidden />
                {copy.editAnswers}
              </a>
            ) : null}
          </p>
        ) : null}
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          {editablePromptFields(primary).map((field) => {
            const id = `prompt-${primary.promptKey}-${field.token}`;
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
                  value={primaryValues[field.token] ?? ""}
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
        </div>
      </fieldset>

      {/* PRIMARY TEMPLATE — open */}
      <div className="mt-7" data-ai-template={primary.promptKey}>
        <p className="mb-2 inline-flex rounded-full bg-[#7A1E2C] px-3 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#FFFDF7]">{copy.startHere}</p>
        <h3 className="flex">{heading(primary, 0)}</h3>
        <div className="mt-4">{template(primary)}</div>
      </div>

      {/* MORE TEMPLATES — native disclosure; content stays in the document */}
      {prompts.length > 1 ? (
        <div className="mt-8">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.moreTemplates}</p>
          <div className="mt-2 space-y-3">
            {prompts.slice(1).map((prompt, i) => (
              <details key={prompt.promptKey} className="group rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7]/70" data-ai-template={prompt.promptKey}>
                <summary className={`flex min-h-12 cursor-pointer list-none items-start gap-2 rounded-2xl p-4 [&::-webkit-details-marker]:hidden ${LEARNING_FOCUS_RING}`}>
                  <h3 className="flex min-w-0 flex-1">{heading(prompt, i + 1)}</h3>
                  <FiChevronDown className="mt-1.5 h-5 w-5 shrink-0 text-[#7A1E2C] transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                </summary>
                <div className="border-t border-[#D6C7AD]/70 p-4">{template(prompt)}</div>
              </details>
            ))}
          </div>
        </div>
      ) : null}

      {/* LAB-LEVEL COACHING — said once for the whole set */}
      {primary.customize.length > 0 || primary.followUps.length > 0 ? (
        <div className="mt-8 grid gap-7 md:grid-cols-2">
          {primary.customize.length > 0 ? (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.customize}</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#3D3428] marker:text-[#C9A84A]">
                {primary.customize.map((c) => (
                  <li key={c.es}>{c[lang]}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {primary.followUps.length > 0 ? (
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2A4536]">{copy.followUps}</h3>
              <ul className="mt-2 space-y-2">
                {primary.followUps.map((f, i) => {
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
          ) : null}
        </div>
      ) : null}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/[0.05] p-4">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#7A1E2C]">
            <FiEyeOff className="h-4 w-4" aria-hidden />
            {copy.privacy}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{primary.privacy.intro[lang]}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[#3D3428] marker:text-[#7A1E2C]">
            {primary.privacy.never.map((n) => (
              <li key={n.es}>{n[lang]}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[#2A4536]/25 bg-[#2A4536]/[0.06] p-4">
          <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-[#2A4536]">
            <FiShield className="h-4 w-4" aria-hidden />
            {copy.verify}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{primary.verify[lang]}</p>
        </div>
      </div>
    </div>
  );
}
