"use client";

/**
 * Shared, category-agnostic "be ready before you start" checklist — informational only, never a
 * completion gate. A category passes its own `title`/`items`; this component owns only the
 * collapsible presentation, matching the Golden reconciliation's "one reusable component, many
 * category configs" doctrine (no per-category checklist engine).
 *
 * Collapsed by default (native `<details>`, no extra state) so it never gets in the way of an
 * owner who already knows what they need — it's there to open when useful, not a required step.
 */
export function ApplicationReadinessChecklist({
  title,
  intro,
  items,
  className,
}: {
  title: string;
  intro?: string;
  items: string[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <details
      className={`rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3 text-sm text-[color:var(--lx-text-2)] ${className ?? ""}`}
      data-application-readiness-checklist="1"
    >
      <summary className="cursor-pointer font-semibold text-[color:var(--lx-text)]">{title}</summary>
      {intro ? <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{intro}</p> : null}
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-baseline gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--lx-gold)]" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
