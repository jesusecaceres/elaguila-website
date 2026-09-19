"use client";

import { FiCircle } from "react-icons/fi";
import { useLessonLocalState } from "./lessonLocalStore";

/**
 * Gate G2 — the visual completion PATTERN only. "Lesson ready" is a device-local moment that turns
 * on when the learner has done the work (activity answered + checklist ticked). It has no timer and
 * grants nothing: server progress and capability records keep their existing semantics until G5.
 */
export function LessonLocalCompletion({
  lessonKey,
  activityFieldKeys,
  checklistKeys,
  copy,
}: {
  lessonKey: string;
  activityFieldKeys: string[];
  checklistKeys: string[];
  copy: { readyTitle: string; readyBody: string; pendingTitle: string; pendingActivity: string; pendingChecklist: string; localNote: string };
}) {
  const { state, hydrated } = useLessonLocalState(lessonKey);
  const activityDone = activityFieldKeys.every((k) => (state.answers[k] ?? "").trim().length > 0);
  const checklistDone = checklistKeys.every((k) => Boolean(state.checklist[k]));
  const ready = hydrated && activityDone && checklistDone;

  return (
    <div className={`rounded-2xl border-2 p-5 sm:p-6 ${ready ? "border-[#C9A84A] bg-[#FFFDF7]" : "border-dashed border-[#D6C7AD] bg-[#FFFDF7]/70"}`} role="status">
      <div className="flex items-start gap-4">
        {ready ? (
          <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden focusable="false">
            <circle cx="32" cy="32" r="28" fill="#F3D98A" stroke="#C9A84A" strokeWidth="3" />
            <circle cx="32" cy="32" r="21" fill="none" stroke="#2A4536" strokeWidth="1.5" strokeDasharray="3 4" />
            <path d="M21 33 l8 8 l15 -17" fill="none" stroke="#2A4536" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[#D6C7AD] text-[#5C5346]" aria-hidden>
            <FiCircle className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="font-serif text-xl font-bold leading-snug text-[#2A4536]">{ready ? copy.readyTitle : copy.pendingTitle}</p>
          {ready ? (
            <p className="mt-1 text-sm leading-relaxed text-[#3D3428]">{copy.readyBody}</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm leading-relaxed text-[#3D3428]">
              {activityFieldKeys.length > 0 && !activityDone ? <li>• {copy.pendingActivity}</li> : null}
              {checklistKeys.length > 0 && !checklistDone ? <li>• {copy.pendingChecklist}</li> : null}
            </ul>
          )}
          <p className="mt-2 text-xs text-[#5C5346]">{copy.localNote}</p>
        </div>
      </div>
    </div>
  );
}
