"use client";

/**
 * TODAY-2 — one personalized DIY action card. Presents the three service paths (Do It Myself /
 * Guide Me / Let Leonix Handle It) for every eligible action, and full step-by-step content —
 * never withholding educational knowledge from an entitled owner.
 */
import { useState } from "react";
import { DIMENSION_LABELS, STATUS_LABELS, type ConciergeLang } from "../conciergeCopy";

export type ActionCardData = {
  actionKey: string;
  dimensionKey: string;
  status: string;
  conditionEs: string;
  conditionEn: string;
  whyItMattersEs: string;
  whyItMattersEn: string;
  consequenceEs: string;
  consequenceEn: string;
  isFree: boolean;
  estimatedCost: string | null;
  stepsEs: readonly string[];
  stepsEn: readonly string[];
  toolsEs: readonly string[];
  toolsEn: readonly string[];
  estimatedMinutes: number;
  ownerConfirmable: boolean;
  relatedLessonKey: string | null;
};

const COPY = {
  en: {
    minutes: "min",
    free: "Free",
    steps: "Steps",
    tools: "Tools",
    start: "Start",
    continueBtn: "Continue",
    markReady: "Mark ready for review",
    confirmDone: "Confirm completion",
    postpone: "Postpone",
    resume: "Resume",
    decline: "Decline",
    guideMe: "Guide me (paid)",
    handleIt: "Let Leonix handle it (paid)",
    lesson: "Related lesson",
  },
  es: {
    minutes: "min",
    free: "Gratis",
    steps: "Pasos",
    tools: "Herramientas",
    start: "Empezar",
    continueBtn: "Continuar",
    markReady: "Marcar listo para revisión",
    confirmDone: "Confirmar terminado",
    postpone: "Posponer",
    resume: "Reanudar",
    decline: "Descartar",
    guideMe: "Guíame (pagado)",
    handleIt: "Que Leonix lo haga (pagado)",
    lesson: "Lección relacionada",
  },
} as const;

export function ActionCard({
  data,
  lang,
  onDecision,
  onRequestService,
  busy,
}: {
  data: ActionCardData;
  lang: ConciergeLang;
  onDecision: (actionKey: string, decision: string) => void;
  onRequestService: (actionKey: string, requestType: "guide_me_concierge" | "let_leonix_handle_it") => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = COPY[lang];
  const steps = lang === "es" ? data.stepsEs : data.stepsEn;
  const tools = lang === "es" ? data.toolsEs : data.toolsEn;

  return (
    <div className="min-w-0 rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#9A9184]">
          {DIMENSION_LABELS[data.dimensionKey]?.[lang] ?? data.dimensionKey}
        </span>
        <span className="rounded-full bg-[#FAF7F2] px-2 py-0.5 text-[11px] font-semibold text-[#5C5346]">
          {STATUS_LABELS[data.status]?.[lang] ?? data.status}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-[#1E1810]">{lang === "es" ? data.conditionEs : data.conditionEn}</p>
      <p className="mt-1 break-words text-sm text-[#5C5346]">{lang === "es" ? data.whyItMattersEs : data.whyItMattersEn}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#7A7164]">
        <span>{data.estimatedMinutes} {t.minutes}</span>
        <span>·</span>
        <span>{data.isFree ? t.free : data.estimatedCost ?? ""}</span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 min-h-11 text-left text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline"
      >
        {expanded ? (lang === "es" ? "Ocultar pasos" : "Hide steps") : (lang === "es" ? "Ver pasos" : "View steps")}
      </button>

      {expanded ? (
        <div className="mt-2 space-y-3 rounded-xl bg-[#FAF7F2] p-3">
          <div>
            <p className="text-xs font-bold text-[#3D3428]">{t.steps}</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-[#5C5346]">
              {steps.map((s, i) => (
                <li key={i} className="break-words">{s}</li>
              ))}
            </ol>
          </div>
          {tools.length > 0 ? (
            <div>
              <p className="text-xs font-bold text-[#3D3428]">{t.tools}</p>
              <p className="mt-1 break-words text-sm text-[#5C5346]">{tools.join(", ")}</p>
            </div>
          ) : null}
          {data.relatedLessonKey ? (
            <a
              href={`/aprender/leccion/${data.relatedLessonKey}?lang=${lang}`}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-[#7A1E2C] underline-offset-2 hover:underline"
            >
              {t.lesson}
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {data.status === "available" ? (
          <button type="button" disabled={busy} onClick={() => onDecision(data.actionKey, "start")} className="min-h-11 rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] disabled:opacity-50">
            {t.start}
          </button>
        ) : null}
        {data.status === "in_progress" ? (
          <>
            <button type="button" disabled={busy} onClick={() => onDecision(data.actionKey, "mark_ready_for_review")} className="min-h-11 rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] disabled:opacity-50">
              {t.markReady}
            </button>
            <button type="button" disabled={busy} onClick={() => onDecision(data.actionKey, "postpone")} className="min-h-11 rounded-xl border border-[#E8DFD0] px-4 text-sm font-semibold text-[#3D3428] disabled:opacity-50">
              {t.postpone}
            </button>
          </>
        ) : null}
        {data.status === "awaiting_owner_confirmation" && data.ownerConfirmable ? (
          <button type="button" disabled={busy} onClick={() => onDecision(data.actionKey, "confirm_completion")} className="min-h-11 rounded-xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 text-sm font-semibold text-[#1E1810] disabled:opacity-50">
            {t.confirmDone}
          </button>
        ) : null}
        {data.status === "postponed" ? (
          <button type="button" disabled={busy} onClick={() => onDecision(data.actionKey, "resume")} className="min-h-11 rounded-xl border border-[#E8DFD0] px-4 text-sm font-semibold text-[#3D3428] disabled:opacity-50">
            {t.resume}
          </button>
        ) : null}
        {data.status !== "completed" && data.status !== "cancelled" ? (
          <>
            <button type="button" disabled={busy} onClick={() => onRequestService(data.actionKey, "guide_me_concierge")} className="min-h-11 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#3D3428] disabled:opacity-50">
              {t.guideMe}
            </button>
            <button type="button" disabled={busy} onClick={() => onRequestService(data.actionKey, "let_leonix_handle_it")} className="min-h-11 rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 text-sm font-semibold text-[#3D3428] disabled:opacity-50">
              {t.handleIt}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
