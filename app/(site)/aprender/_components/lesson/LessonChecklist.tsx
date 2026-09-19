"use client";

import { LEARNING_FOCUS_RING } from "../learningUi";
import { useLessonLocalState } from "./lessonLocalStore";

/** Gate G2 — lightweight self-check. Ticks are the learner's own attestation, kept on this device only. */
export function LessonChecklist({ lessonKey, items }: { lessonKey: string; items: { key: string; text: string }[] }) {
  const { state, update } = useLessonLocalState(lessonKey);
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const id = `lista-${lessonKey}-${item.key}`;
        const checked = Boolean(state.checklist[item.key]);
        return (
          <li key={item.key}>
            <label
              htmlFor={id}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition ${
                checked ? "border-[#2A4536]/40 bg-[#2A4536]/[0.06]" : "border-[#E8DFD0] bg-[#FFFDF7]"
              }`}
            >
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => update((prev) => ({ ...prev, checklist: { ...prev.checklist, [item.key]: e.target.checked } }))}
                className={`h-5 w-5 shrink-0 rounded border-[#5C5346] accent-[#2A4536] ${LEARNING_FOCUS_RING}`}
              />
              <span className="min-w-0 break-words text-[0.9375rem] leading-snug text-[#1E1810]">{item.text}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
