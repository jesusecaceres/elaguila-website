"use client";

/**
 * Gate 2B — presentation-only mobile overflow sheet for secondary/lifecycle/specialized
 * listing actions. Renders whatever `actions` array it's given via the existing
 * `DashboardListingActionBar` (same component real cards already use) — no route/callback
 * logic lives here, and no action is invented. This is purely a place to put actions that
 * don't fit inline on a narrow screen; Gate 2C owns which actions exist and what they're
 * labeled.
 */
import { useEffect, useId, useRef, useState } from "react";
import { DashboardListingActionBar, type ActionItem } from "./DashboardListingActionBar";

export function DashboardMobileActionSheet({
  triggerLabel,
  sheetTitle,
  closeLabel,
  actions,
}: {
  triggerLabel: string;
  sheetTitle: string;
  closeLabel: string;
  actions: ActionItem[];
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-[color:var(--lx-border)] bg-[color:var(--lx-section)] px-4 text-sm font-semibold text-[color:var(--lx-text)] transition hover:opacity-90 md:hidden"
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl border-t border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4 pb-6 shadow-[0_-16px_40px_-12px_rgba(31,36,28,0.25)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={titleId} className="text-sm font-bold text-[color:var(--lx-text)]">
                {sheetTitle}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--lx-border)] text-[color:var(--lx-text)]"
                aria-label={closeLabel}
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-2 [&>div]:flex-col [&>div]:items-stretch [&_a]:w-full [&_button]:w-full">
              <DashboardListingActionBar actions={actions} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
