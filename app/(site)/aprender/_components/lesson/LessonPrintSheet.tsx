"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiPrinter } from "react-icons/fi";
import { buildCustomerStatement, type CustomerStatementAnswers } from "@/app/lib/business/learning/lessonPackage/customerStatement";
import { buildGuidedResult } from "@/app/lib/business/learning/lessonPackage/guidedResult";
import { renderPrompt, resolvePromptValues } from "@/app/lib/business/learning/lessonPackage/prompts";
import type { ActivityField, ActivityResult, LessonJourneyKey, LessonLang, LessonPrompt } from "@/app/lib/business/learning/lessonPackage/types";
import { LEARNING_BTN_OUTLINE } from "../learningUi";
import { useLessonLocalState } from "./lessonLocalStore";

export const LESSON_SHEET_ID = "leonix-lesson-sheet";
/** Set on <html> only while "Imprimir mi hoja" is printing, so a normal browser print of the lesson is left alone. */
const SHEET_PRINT_ATTR = "data-leonix-print-sheet";

/**
 * Gate G2 / G2.1 — SAVE. "Mi hoja": the learner's own result (sentence, plan or comparison), checklist, PRIMARY AI template and
 * the verification reminder on one print-friendly sheet. Pure print CSS (the browser's print dialog
 * can also save a PDF) — no PDF library.
 *
 * Printing must output ONLY the sheet. `visibility: hidden` is not enough: hidden content keeps
 * its layout, so the whole 13-screen lesson still paginated as blank pages. The sheet is therefore
 * portalled to <body> as a direct child, and the print stylesheet removes every other body child
 * with `display: none`, so the printed document is exactly as long as the sheet (1–2 pages). The
 * rules only apply while the button's print is running (an <html> attribute cleared on
 * `afterprint`), so a normal browser print of the lesson itself is untouched.
 */
export function LessonPrintSheet({
  lessonKey,
  lang,
  journey,
  lessonTitle,
  guided,
  checklist,
  prompt,
  copy,
}: {
  lessonKey: string;
  lang: LessonLang;
  journey: LessonJourneyKey | null;
  lessonTitle: string;
  /** A guided activity's declared result; null = the flagship customer sentence. */
  guided: { fields: ActivityField[]; result: ActivityResult } | null;
  checklist: { key: string; text: string }[];
  /** The primary template only. */
  prompt: LessonPrompt | null;
  copy: { button: string; hint: string; sheetEyebrow: string; sheetTitle: string; statement: string; checklist: string; prompt: string; footer: string };
}) {
  const { state } = useLessonLocalState(lessonKey);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const clear = () => document.documentElement.removeAttribute(SHEET_PRINT_ATTR);
    window.addEventListener("afterprint", clear);
    return () => {
      window.removeEventListener("afterprint", clear);
      clear();
    };
  }, []);

  function printSheet() {
    document.documentElement.setAttribute(SHEET_PRINT_ATTR, "");
    window.print();
  }

  const resultLabel = guided ? guided.result.printLabel[lang] : copy.statement;
  const resultText = guided ? buildGuidedResult(guided.fields, guided.result, state.answers, lang).text : buildCustomerStatement(state.answers as CustomerStatementAnswers, lang).text;
  const promptText = prompt ? renderPrompt(prompt, lang, resolvePromptValues(prompt, { answers: state.answers, typed: state.prompt, journey, lang }), journey).text : "";

  const sheet = (
    <div id={LESSON_SHEET_ID} aria-hidden>
      <style>{`
        #${LESSON_SHEET_ID} { display: none; }
        @media print {
          html[${SHEET_PRINT_ATTR}] body > *:not(#${LESSON_SHEET_ID}) { display: none !important; }
          html[${SHEET_PRINT_ATTR}] #${LESSON_SHEET_ID} { display: block !important; color: #000; background: #fff; font-family: Arial, Helvetica, sans-serif; }
          html[${SHEET_PRINT_ATTR}], html[${SHEET_PRINT_ATTR}] body { background: #fff !important; height: auto !important; overflow: visible !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
      <p style={{ fontSize: "10pt", letterSpacing: "0.12em", textTransform: "uppercase" }}>{copy.sheetEyebrow}</p>
      <p style={{ fontSize: "20pt", fontWeight: 700, fontFamily: "Georgia, serif", marginTop: "4pt" }}>
        {copy.sheetTitle}: {lessonTitle}
      </p>

      <p style={{ fontSize: "11pt", fontWeight: 700, marginTop: "16pt" }}>{resultLabel}</p>
      <p style={{ fontSize: guided ? "12pt" : "14pt", lineHeight: 1.5, fontFamily: "Georgia, serif", marginTop: "4pt", whiteSpace: "pre-wrap" }}>{resultText}</p>

      {checklist.length > 0 ? (
        <>
          <p style={{ fontSize: "11pt", fontWeight: 700, marginTop: "16pt" }}>{copy.checklist}</p>
          {checklist.map((item) => (
            <p key={item.key} style={{ fontSize: "11pt", lineHeight: 1.5, marginTop: "4pt" }}>
              {state.checklist[item.key] ? "☑" : "☐"} {item.text}
            </p>
          ))}
        </>
      ) : null}

      {prompt && promptText ? (
        <>
          <p style={{ fontSize: "11pt", fontWeight: 700, marginTop: "16pt" }}>
            {copy.prompt}: {prompt.title[lang]}
          </p>
          <p style={{ fontSize: "10.5pt", lineHeight: 1.45, whiteSpace: "pre-wrap", marginTop: "4pt" }}>{promptText}</p>
        </>
      ) : null}

      <p style={{ fontSize: "9.5pt", marginTop: "18pt", borderTop: "1px solid #999", paddingTop: "8pt" }}>
        {copy.footer}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <button type="button" onClick={printSheet} className={LEARNING_BTN_OUTLINE}>
        <FiPrinter className="h-4 w-4" aria-hidden />
        {copy.button}
      </button>
      <p className="max-w-md text-xs leading-relaxed text-[#5C5346]">{copy.hint}</p>
      {mounted ? createPortal(sheet, document.body) : null}
    </div>
  );
}
