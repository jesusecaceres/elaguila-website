"use client";

import {
  compose24HourFrom12Parts,
  DEALER_HOUR_12_OPTIONS,
  DEALER_MINUTE_OPTIONS,
  parse24HourTo12Parts,
  type AmPm,
} from "@/app/lib/clasificados/autos/autosDealerHoursTimeUi";

import {
  EMPLEOS_DAY_BLOCK_OPTIONS_EN,
  EMPLEOS_DAY_BLOCK_OPTIONS_ES,
  joinScheduleRowsForPublish,
} from "../lib/empleosScheduleDisplay";
import type { EmpleosQuickScheduleRow } from "../types/empleosQuickDraft";

const SELECT = "mt-1 w-full min-h-[44px] rounded-lg border border-black/10 bg-white px-2 py-2 text-sm";
const INPUT = "mt-1 w-full min-h-[44px] rounded-lg border border-black/10 px-3 py-2 text-sm";

type Props = {
  lang: "es" | "en";
  rows: EmpleosQuickScheduleRow[];
  onChange: (rows: EmpleosQuickScheduleRow[], scheduleJoined: string) => void;
};

function TimeSelect({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const parts = parse24HourTo12Parts(value, { hour: "8", minute: "00", ampm: "AM" });
  const setPart = (patch: Partial<{ hour: string; minute: string; ampm: AmPm }>) => {
    const next = { ...parts, ...patch };
    onChange(compose24HourFrom12Parts(next.hour, next.minute, next.ampm));
  };

  return (
    <div>
      <span className="text-xs font-semibold text-[#5C564E]">{label}</span>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        <select className={SELECT} disabled={disabled} value={parts.hour} onChange={(e) => setPart({ hour: e.target.value })}>
          {DEALER_HOUR_12_OPTIONS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select className={SELECT} disabled={disabled} value={parts.minute} onChange={(e) => setPart({ minute: e.target.value })}>
          {DEALER_MINUTE_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select className={SELECT} disabled={disabled} value={parts.ampm} onChange={(e) => setPart({ ampm: e.target.value as AmPm })}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export function EmpleosShiftScheduleEditor({ lang, rows, onChange }: Props) {
  const es = lang === "es";
  const dayOptions = es ? EMPLEOS_DAY_BLOCK_OPTIONS_ES : EMPLEOS_DAY_BLOCK_OPTIONS_EN;

  const patchRow = (idx: number, patch: Partial<EmpleosQuickScheduleRow>) => {
    const next = rows.map((r, j) => (j === idx ? { ...r, ...patch } : r));
    onChange(next, joinScheduleRowsForPublish(next));
  };

  const removeRow = (idx: number) => {
    const next = rows.filter((_, j) => j !== idx);
    const fallback = [{ day: "", dayCustom: "", shift: "", startTime: "", endTime: "", note: "" }];
    onChange(next.length ? next : fallback, joinScheduleRowsForPublish(next.length ? next : fallback));
  };

  const addRow = () => {
    const next = [...rows, { day: "", dayCustom: "", shift: "", startTime: "", endTime: "", note: "" }];
    onChange(next, joinScheduleRowsForPublish(next));
  };

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const isFlexible = row.day === "Flexible";
        const isOther = row.day === "otro";
        const knownDays = dayOptions.map((o) => o.value).filter(Boolean);
        const showCustomDay = isOther || (row.day && !knownDays.includes(row.day) && row.day !== "Flexible");

        return (
          <div key={idx} className="rounded-xl border border-[#D6C7AD]/60 bg-[#FFFDF7] p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold text-[#5C564E]">
                  {es ? "Día / bloque" : "Day / block"}
                </span>
                <select
                  className={SELECT}
                  value={knownDays.includes(row.day) || row.day === "otro" ? row.day : row.day ? "otro" : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchRow(idx, { day: val, dayCustom: val === "otro" ? row.dayCustom : "" });
                  }}
                >
                  {dayOptions.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {showCustomDay ? (
                <div>
                  <span className="text-xs font-semibold text-[#5C564E]">
                    {es ? "Etiqueta personalizada" : "Custom label"}
                  </span>
                  <input
                    className={INPUT}
                    value={row.dayCustom ?? (isOther ? "" : row.day)}
                    placeholder={es ? "Ej. Turno rotativo" : "e.g. Rotating shift"}
                    onChange={(e) => patchRow(idx, { day: "otro", dayCustom: e.target.value })}
                  />
                </div>
              ) : null}
            </div>

            {!isFlexible ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TimeSelect
                  label={es ? "Hora de inicio" : "Start time"}
                  value={row.startTime}
                  onChange={(startTime) => patchRow(idx, { startTime })}
                />
                <TimeSelect
                  label={es ? "Hora de fin" : "End time"}
                  value={row.endTime}
                  onChange={(endTime) => patchRow(idx, { endTime })}
                />
              </div>
            ) : null}

            <div className="mt-3">
              <span className="text-xs font-semibold text-[#5C564E]">
                {es ? "Nota (opcional)" : "Note (optional)"}
              </span>
              <input
                className={INPUT}
                value={row.note ?? ""}
                placeholder={es ? "Ej. Descanso de 30 min" : "e.g. 30 min break"}
                onChange={(e) => patchRow(idx, { note: e.target.value })}
              />
            </div>

            {rows.length > 1 ? (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-[#9A3A3A] hover:underline"
                onClick={() => removeRow(idx)}
              >
                {es ? "Quitar turno" : "Remove shift"}
              </button>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        className="min-h-[36px] rounded-lg border border-[#C9B46A]/50 bg-[#FFFDF5] px-3 text-xs font-semibold text-[#6B5320] transition hover:bg-[#FFF8E0]"
        onClick={addRow}
      >
        {es ? "+ Añadir turno" : "+ Add shift"}
      </button>
    </div>
  );
}
