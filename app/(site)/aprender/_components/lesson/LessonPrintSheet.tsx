"use client";

import { FiPrinter } from "react-icons/fi";
import { buildCustomerStatement, type CustomerStatementAnswers } from "@/app/lib/business/learning/lessonPackage/customerStatement";
import { journeyStageValue, renderPrompt } from "@/app/lib/business/learning/lessonPackage/prompts";
import type { LessonJourneyKey, LessonLang, LessonPrompt } from "@/app/lib/business/learning/lessonPackage/types";
import { LEARNING_BTN_OUTLINE } from "../learningUi";
import { useLessonLocalState } from "./lessonLocalStore";

/**
 * Gate G2 — SAVE. "Mi hoja": the learner's own sentence, checklist and AI question on one
 * print-friendly sheet. Pure print CSS (the browser's print dialog can also save a PDF) — no PDF
 * library. On screen only the button shows; when printing, only the sheet shows.
 */
export function LessonPrintSheet({
  lessonKey,
  lang,
  journey,
  lessonTitle,
  checklist,
  prompt,
  copy,
}: {
  lessonKey: string;
  lang: LessonLang;
  journey: LessonJourneyKey | null;
  lessonTitle: string;
  checklist: { key: string; text: string }[];
  prompt: LessonPrompt | null;
  copy: { button: string; hint: string; sheetEyebrow: string; sheetTitle: string; statement: string; checklist: string; prompt: string; footer: string };
}) {
  const { state } = useLessonLocalState(lessonKey);
  const statement = buildCustomerStatement(state.answers as CustomerStatementAnswers, lang);

  let promptText = "";
  if (prompt) {
    const values: Record<string, string> = {};
    for (const field of prompt.fields) {
      const typed = state.prompt[field.token];
      if (typed !== undefined) values[field.token] = typed;
      else if (field.prefillFrom?.kind === "activity_field") values[field.token] = state.answers[field.prefillFrom.fieldKey] ?? "";
      else if (field.prefillFrom?.kind === "journey_stage") values[field.token] = journeyStageValue(prompt, journey, lang);
    }
    promptText = renderPrompt(prompt, lang, values).text;
  }

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #leonix-lesson-sheet, #leonix-lesson-sheet * { visibility: visible !important; }
          #leonix-lesson-sheet { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 0 1.5rem; color: #000; background: #fff; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <button type="button" onClick={() => window.print()} className={LEARNING_BTN_OUTLINE}>
          <FiPrinter className="h-4 w-4" aria-hidden />
          {copy.button}
        </button>
        <p className="max-w-md text-xs leading-relaxed text-[#5C5346]">{copy.hint}</p>
      </div>

      <div id="leonix-lesson-sheet" className="hidden" aria-hidden>
        <p style={{ fontSize: "10pt", letterSpacing: "0.12em", textTransform: "uppercase" }}>{copy.sheetEyebrow}</p>
        <p style={{ fontSize: "20pt", fontWeight: 700, fontFamily: "Georgia, serif", marginTop: "4pt" }}>
          {copy.sheetTitle}: {lessonTitle}
        </p>

        <p style={{ fontSize: "11pt", fontWeight: 700, marginTop: "18pt" }}>{copy.statement}</p>
        <p style={{ fontSize: "14pt", lineHeight: 1.5, fontFamily: "Georgia, serif", marginTop: "4pt" }}>{statement.text}</p>

        {checklist.length > 0 ? (
          <>
            <p style={{ fontSize: "11pt", fontWeight: 700, marginTop: "18pt" }}>{copy.checklist}</p>
            {checklist.map((item) => (
              <p key={item.key} style={{ fontSize: "11pt", lineHeight: 1.5, marginTop: "4pt" }}>
                {state.checklist[item.key] ? "☑" : "☐"} {item.text}
              </p>
            ))}
          </>
        ) : null}

        {promptText ? (
          <>
            <p style={{ fontSize: "11pt", fontWeight: 700, marginTop: "18pt" }}>{copy.prompt}</p>
            <p style={{ fontSize: "10.5pt", lineHeight: 1.5, whiteSpace: "pre-wrap", marginTop: "4pt" }}>{promptText}</p>
          </>
        ) : null}

        <p style={{ fontSize: "9.5pt", marginTop: "22pt", borderTop: "1px solid #999", paddingTop: "8pt" }}>{copy.footer}</p>
      </div>
    </div>
  );
}
