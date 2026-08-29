"use client";

import { useState } from "react";
import type { DayHoursRow, DayKey } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { WEEK_DAY_LABELS } from "@/app/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { COMMUNITY_WEEK_ORDER } from "@/app/(site)/publicar/community/shared/lib/communityWeeklySchedule";

const COPY = {
  es: {
    title: "Aplicar horario a varios días",
    helper: "Selecciona los días y una hora compartida, luego aplica. Puedes ajustar cada día por separado abajo.",
    open: "Hora de inicio",
    close: "Hora de fin",
    apply: "Aplicar a los días seleccionados",
  },
  en: {
    title: "Apply schedule to multiple days",
    helper: "Pick days and a shared time, then apply. You can still fine-tune each day individually below.",
    open: "Start time",
    close: "End time",
    apply: "Apply to selected days",
  },
} as const;

/**
 * Bulk day-select + shared-time toolbar (Gate 2A Section R) that sits above
 * the shared, untouched `WeeklyScheduleEditor`. It only ever calls the same
 * `onApply` patch callback the caller already uses for individual day edits
 * — it never mutates the shared primitive directly.
 */
export function ClasesScheduleQuickApply({
  lang,
  rows,
  onApply,
}: {
  lang: "es" | "en";
  rows: DayHoursRow[];
  onApply: (days: DayKey[], open: string, close: string) => void;
}) {
  const t = COPY[lang];
  const [selected, setSelected] = useState<Set<DayKey>>(new Set());
  const [open, setOpen] = useState("09:00");
  const [close, setClose] = useState("17:00");

  const toggle = (day: DayKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const canApply = selected.size > 0 && open && close;

  return (
    <div className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-page)] px-3 py-3">
      <p className="text-xs font-semibold text-[color:var(--lx-text)]">{t.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{t.helper}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {COMMUNITY_WEEK_ORDER.map((day) => (
          <label
            key={day}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 text-xs"
          >
            <input
              type="checkbox"
              checked={selected.has(day)}
              onChange={() => toggle(day)}
              className="h-3.5 w-3.5 rounded border-black/20"
            />
            {WEEK_DAY_LABELS[day][lang]}
          </label>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="text-xs">
          <span className="block text-[color:var(--lx-text-2)]">{t.open}</span>
          <input
            type="time"
            value={open}
            onChange={(e) => setOpen(e.target.value)}
            className="mt-1 min-h-[36px] rounded-lg border border-black/10 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs">
          <span className="block text-[color:var(--lx-text-2)]">{t.close}</span>
          <input
            type="time"
            value={close}
            onChange={(e) => setClose(e.target.value)}
            className="mt-1 min-h-[36px] rounded-lg border border-black/10 px-2 py-1 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={!canApply}
          onClick={() => {
            onApply(Array.from(selected), open, close);
          }}
          className="min-h-[36px] rounded-lg border border-[color:var(--lx-cta-dark)]/40 bg-[color:var(--lx-card)] px-3 text-xs font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {t.apply}
        </button>
      </div>
    </div>
  );
}
