"use client";

import type { ReactNode } from "react";

/**
 * Wraps a status-change/delete submit button with a native confirmation dialog.
 * The surrounding `<form>` (slug + status hidden inputs) is untouched — this only
 * gates the click, so the existing server action wiring keeps working as-is.
 */
export function ExecutiveHubConfirmSubmitButton({
  confirmMessage,
  className,
  children,
}: {
  confirmMessage: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
