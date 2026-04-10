"use client";

import type { ViajesDateMode } from "../lib/viajesResolveFechasDisplay";
import { viajesResolveFechasDisplay } from "../lib/viajesResolveFechasDisplay";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const MODE_BTN =
  "rounded-xl border px-3 py-2 text-xs font-bold transition sm:text-sm";

type DateUxCopy = {
  modeFixed: string;
  modeFlexible: string;
  modeSeasonal: string;
  start: string;
  end: string;
  note: string;
  previewHint: string;
};

export function ViajesDateRangeFields({
  lang,
  dateMode,
  fechaInicio,
  fechaFin,
  fechasNota,
  fechas,
  onPatch,
  copy,
}: {
  lang: "es" | "en";
  dateMode: ViajesDateMode;
  fechaInicio: string;
  fechaFin: string;
  fechasNota: string;
  fechas: string;
  onPatch: (p: {
    dateMode?: ViajesDateMode;
    fechaInicio?: string;
    fechaFin?: string;
    fechasNota?: string;
    fechas?: string;
  }) => void;
  copy: DateUxCopy;
}) {
  const preview = viajesResolveFechasDisplay({ dateMode, fechas, fechaInicio, fechaFin, fechasNota }, lang);

  const modes: { id: ViajesDateMode; label: string }[] = [
    { id: "fixed", label: copy.modeFixed },
    { id: "flexible", label: copy.modeFlexible },
    { id: "seasonal", label: copy.modeSeasonal },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/40 p-4">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${MODE_BTN} ${
              dateMode === m.id
                ? "border-[#D97706] bg-[#D97706]/12 text-[color:var(--lx-text)] shadow-sm"
                : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-muted)] hover:bg-[color:var(--lx-nav-hover)]"
            }`}
            onClick={() => onPatch({ dateMode: m.id })}
          >
            {m.label}
          </button>
        ))}
      </div>

      {dateMode === "fixed" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="lx-fecha-ini">
              {copy.start}
            </label>
            <input
              id="lx-fecha-ini"
              type="date"
              className={`${INPUT} min-h-[44px]`}
              value={fechaInicio}
              onChange={(e) => onPatch({ fechaInicio: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="lx-fecha-fin">
              {copy.end}
            </label>
            <input
              id="lx-fecha-fin"
              type="date"
              className={`${INPUT} min-h-[44px]`}
              value={fechaFin}
              min={fechaInicio || undefined}
              onChange={(e) => onPatch({ fechaFin: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      {dateMode === "seasonal" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="lx-season-a">
              {copy.start}
            </label>
            <input
              id="lx-season-a"
              type="date"
              className={`${INPUT} min-h-[44px]`}
              value={fechaInicio}
              onChange={(e) => onPatch({ fechaInicio: e.target.value })}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="lx-season-b">
              {copy.end}
            </label>
            <input
              id="lx-season-b"
              type="date"
              className={`${INPUT} min-h-[44px]`}
              value={fechaFin}
              onChange={(e) => onPatch({ fechaFin: e.target.value })}
            />
          </div>
        </div>
      ) : null}

      {(dateMode === "flexible" || dateMode === "seasonal") && (
        <div>
          <label className={LABEL} htmlFor="lx-fechas-nota">
            {copy.note}
          </label>
          <textarea
            id="lx-fechas-nota"
            className={`${INPUT} min-h-[72px] resize-y`}
            value={fechasNota}
            onChange={(e) => onPatch({ fechasNota: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {dateMode === "flexible" ? (
        <div>
          <label className={LABEL} htmlFor="lx-fechas-legacy">
            {lang === "en" ? "Additional date notes (optional)" : "Notas adicionales de fechas (opcional)"}
          </label>
          <input
            id="lx-fechas-legacy"
            className={INPUT}
            value={fechas}
            onChange={(e) => onPatch({ fechas: e.target.value })}
            placeholder={lang === "en" ? "e.g. Spring break, flexible weekends…" : "Ej. Semana Santa, fines flexibles…"}
          />
        </div>
      ) : null}

      {preview ? (
        <p className="rounded-xl border border-dashed border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-card)] px-3 py-2 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
          <span className="font-bold text-[color:var(--lx-text)]">{copy.previewHint}</span> {preview}
        </p>
      ) : null}
    </div>
  );
}
