"use client";

export default function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full",
        "border border-yellow-500/25 bg-yellow-500/10",
        "px-2 py-0.5 text-xs font-semibold text-yellow-200",
        className,
      ].join(" ")}
      aria-label="LEONIX Pro"
      title="LEONIX Pro"
    >
      <span aria-hidden="true">💎</span>
      <span>Pro</span>
    </span>
  );
}
