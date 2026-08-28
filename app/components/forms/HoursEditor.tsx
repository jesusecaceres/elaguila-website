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

export type HoursEditorSpecialHoursEntry = {
  id: string;
  /** Short label — e.g. a date, date range, or holiday name ("Dec 24-25", "Navidad"). */
  label: string;
  /** Freeform note describing the special hours for that label ("Cerrado", "10am-2pm"). */
  note: string;
};

/**
 * Multi-entry special-hours list — supersedes the single-string `specialHoursNote` below so more
 * than one special-hours entry can coexist (contract §3.4 items 46-48). Each entry lays its label
 * and note side by side (horizontal space) instead of one tall stacked field per entry.
 */
export type HoursEditorSpecialHoursListProps = {
  entries: HoursEditorSpecialHoursEntry[];
  onAdd: () => void;
  onEntryChange: (id: string, patch: Partial<Pick<HoursEditorSpecialHoursEntry, "label" | "note">>) => void;
  onRemove: (id: string) => void;
  sectionLabel?: string;
  sectionHelper?: string;
  addLabel: string;
  labelPlaceholder?: string;
  notePlaceholder?: string;
  removeAriaLabel?: (entry: HoursEditorSpecialHoursEntry) => string;
};

export type HoursEditorProps = {
  days: HoursEditorDayRow[];
  onDayChange: (key: string, next: HoursEditorDaySchedule) => void;
  closedLabel: string;
  /**
   * @deprecated Legacy single freeform special-hours note. Prefer `specialHoursList` (supports
   * multiple entries). Kept so existing callers keep working unchanged; a caller may pass both
   * during its own migration window.
   */
  specialHoursNote?: {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    helper?: string;
  };
  /** Multi-entry special hours (contract §3.4 items 46-48) — prefer this over `specialHoursNote`. */
  specialHoursList?: HoursEditorSpecialHoursListProps;
  className?: string;
};

export function HoursEditor({
  days,
  onDayChange,
  closedLabel,
  specialHoursNote,
  specialHoursList,
  className,
}: HoursEditorProps) {
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

      {specialHoursList ? (
        <div className="mt-4 grid gap-3">
          {specialHoursList.sectionLabel ? (
            <p className="text-xs font-semibold uppercase tracking-wide">{specialHoursList.sectionLabel}</p>
          ) : null}
          {specialHoursList.sectionHelper ? (
            <p className="text-xs leading-relaxed opacity-70">{specialHoursList.sectionHelper}</p>
          ) : null}
          <div className="space-y-2">
            {specialHoursList.entries.map((entry) => (
              <div
                key={entry.id}
                className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-center"
              >
                <input
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
                  placeholder={specialHoursList.labelPlaceholder}
                  value={entry.label}
                  onChange={(e) => specialHoursList.onEntryChange(entry.id, { label: e.target.value })}
                />
                <input
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
                  placeholder={specialHoursList.notePlaceholder}
                  value={entry.note}
                  onChange={(e) => specialHoursList.onEntryChange(entry.id, { note: e.target.value })}
                />
                <button
                  type="button"
                  className="justify-self-start rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold hover:bg-black/5 sm:justify-self-auto"
                  onClick={() => specialHoursList.onRemove(entry.id)}
                  aria-label={specialHoursList.removeAriaLabel?.(entry)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="justify-self-start rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
            onClick={specialHoursList.onAdd}
          >
            {specialHoursList.addLabel}
          </button>
        </div>
      ) : specialHoursNote ? (
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
