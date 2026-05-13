"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { DayHoursRow } from "@/app/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";

import { getActiveWeeklyScheduleGridItems } from "../lib/communityWeeklySchedule";

type Props = {
  rows: DayHoursRow[];
  lang: Lang;
  /** Optional section label (e.g. “Horario”) — omit when the parent already has a dt. */
  title?: string;
  emptyFallback?: string;
};

export function CommunityWeeklyScheduleAligned({ rows, lang, title, emptyFallback = "—" }: Props) {
  const lg = lang === "en" ? "en" : "es";
  const items = getActiveWeeklyScheduleGridItems(rows, lg);
  if (!items.length) {
    return <span className="text-sm text-[#5C564E]">{emptyFallback}</span>;
  }
  return (
    <div className="max-w-lg min-w-0">
      {title ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B5E4E]">{title}</p>
      ) : null}
      <dl className="grid grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px] sm:grid-cols-[minmax(0,12.5rem)_1fr]">
        {items.map((it) => (
          <div key={it.dayKey} className="contents">
            <dt className="min-w-0 font-medium leading-snug text-[#5C564E]">{it.dayLabel}</dt>
            <dd className="min-w-0 font-semibold leading-snug tabular-nums text-[#2A2826]">{it.timeRange}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
