"use client";

/**
 * Shared business-hours editor — generalized from Restaurantes' working day-row hours editor
 * (app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx, section C). Fully
 * controlled: the caller supplies the day list, the current schedule per day, and the update
 * callback, so no category's draft shape or persistence is touched by this component.
 *
 * Worktree A builds this component only; wiring it into any category's live application form
 * is category-adapter work for a later worktree.
 */

export type HoursEditorDaySchedule = {
  closed: boolean;
  /** Local time 24h `HH:mm`. */
  openTime?: string;
  closeTime?: string;
};

export type HoursEditorDayRow = {
  key: string;
  label: string;
  schedule: HoursEditorDaySchedule;
};

export type HoursEditorProps = {
  days: HoursEditorDayRow[];
  onDayChange: (key: string, next: HoursEditorDaySchedule) => void;
  closedLabel: string;
  /** Optional freeform special-hours note, matching the current Restaurantes field shape. */
  specialHoursNote?: {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    helper?: string;
  };
  className?: string;
};

export function HoursEditor({ days, onDayChange, closedLabel, specialHoursNote, className }: HoursEditorProps) {
  return (
    <div className={className}>
      <div className="space-y-3">
        {days.map(({ key, label, schedule }) => (
          <div
            key={key}
            className="grid gap-2 rounded-xl border border-black/10 bg-black/[0.02] p-3 sm:grid-cols-[120px_1fr_1fr_auto]"
          >
            <div className="text-sm font-semibold">{label}</div>
            <label className="flex items-center gap-2 text-sm sm:col-span-3 lg:col-span-1">
              <input
                type="checkbox"
                checked={schedule.closed}
                onChange={(e) =>
                  onDayChange(key, { closed: e.target.checked, openTime: schedule.openTime, closeTime: schedule.closeTime })
                }
              />
              {closedLabel}
            </label>
            <input
              type="time"
              disabled={schedule.closed}
              className="rounded-lg border border-black/15 px-2 py-1 text-sm disabled:opacity-50"
              value={schedule.openTime ?? ""}
              onChange={(e) => onDayChange(key, { ...schedule, openTime: e.target.value || undefined })}
            />
            <input
              type="time"
              disabled={schedule.closed}
              className="rounded-lg border border-black/15 px-2 py-1 text-sm disabled:opacity-50"
              value={schedule.closeTime ?? ""}
              onChange={(e) => onDayChange(key, { ...schedule, closeTime: e.target.value || undefined })}
            />
          </div>
        ))}
      </div>

      {specialHoursNote ? (
        <div className="mt-4 grid gap-3">
          <div>
            {specialHoursNote.label ? (
              <p className="text-xs font-semibold uppercase tracking-wide">{specialHoursNote.label}</p>
            ) : null}
            {specialHoursNote.helper ? (
              <p className="text-xs leading-relaxed opacity-70">{specialHoursNote.helper}</p>
            ) : null}
            <input
              className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
              value={specialHoursNote.value}
              onChange={(e) => specialHoursNote.onChange(e.target.value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
