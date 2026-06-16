"use client";

type Props = {
  selectedCount: number;
  onClear: () => void;
  onSoftDelete: () => void;
  onPermanentDelete: () => void;
  busy: boolean;
  showPermanentDelete: boolean;
  statusFilter?: string;
};

export function ClassifiedAdminQueueBulkBar({
  selectedCount,
  onClear,
  onSoftDelete,
  onPermanentDelete,
  busy,
  showPermanentDelete,
  statusFilter,
}: Props) {
  if (selectedCount <= 0) return null;

  const isFlaggedFilter = statusFilter === "flagged";

  return (
    <div
      className="mb-4 rounded-2xl border border-[#C9B46A]/60 bg-[#FFFCF7] p-4 shadow-sm"
      data-testid="clasificados-bulk-action-bar"
      role="region"
      aria-label="Bulk queue actions"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm font-bold text-[#1E1810]" data-testid="clasificados-selected-count">
          {selectedCount} selected
        </p>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="min-h-[44px] rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-4 py-2.5 text-sm font-semibold text-[#5C5346] disabled:opacity-50 sm:min-h-0"
          data-testid="clasificados-clear-selection"
        >
          Clear selection
        </button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
        Bulk cleanup only affects selected visible rows. Use filters/search first, then select rows.
        {isFlaggedFilter ? " Showing flagged/review rows from current filter." : null}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSoftDelete}
          disabled={busy}
          className="min-h-[44px] rounded-xl border border-[#6B2E2E]/40 bg-[#F5E8E8] px-4 py-3 text-sm font-bold text-[#6B2E2E] disabled:opacity-50"
          data-testid="clasificados-bulk-soft-delete"
          title="Sets selected listings to removed. Not permanent."
        >
          Delete / remove selected
          <span className="mt-0.5 block text-[11px] font-semibold normal-case text-[#7A4A4A]">
            Sets selected listings to removed. Not permanent.
          </span>
        </button>

        {showPermanentDelete ? (
          <button
            type="button"
            onClick={onPermanentDelete}
            disabled={busy}
            className="min-h-[44px] rounded-xl border border-red-700 bg-red-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            data-testid="clasificados-bulk-permanent-delete"
            title="Permanently deletes selected rows from public.listings. Cannot be undone."
          >
            Permanent delete selected
            <span className="mt-0.5 block text-[11px] font-semibold normal-case text-red-100">
              This cannot be undone. public.listings only.
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
