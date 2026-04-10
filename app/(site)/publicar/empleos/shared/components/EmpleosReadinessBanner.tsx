"use client";

/**
 * Calm readiness line for preview/publish gates (shown under header, not as a command panel).
 */
export function EmpleosReadinessBanner({
  visible,
  intro,
  issues,
}: {
  visible: boolean;
  intro: string;
  issues: string[];
}) {
  if (!visible || issues.length === 0) return null;
  return (
    <div
      className="mb-6 rounded-xl border border-amber-300/70 bg-amber-50/90 px-3 py-2.5 text-[13px] font-medium text-amber-950 sm:text-sm"
      role="status"
    >
      <p className="leading-snug">
        <span className="font-semibold">{intro}</span> {issues.join(", ")}
      </p>
    </div>
  );
}
