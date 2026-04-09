import type { ReactNode } from "react";

/**
 * Minimal **bold** segments for sample copy (trusted template data only).
 */
export function richLineParts(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((chunk, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-[color:var(--lx-text)]">
        {chunk}
      </strong>
    ) : (
      <span key={i}>{chunk}</span>
    )
  );
}
