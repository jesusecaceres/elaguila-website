import type { LeoSystemHealthSnapshot } from "@/app/leo/_lib/leoTypes";

export function LeoSystemHealthCard({ health }: { health: LeoSystemHealthSnapshot }) {
  const degraded = health.components.filter(
    (c) => c.state === "DEGRADED" || c.state === "UNAVAILABLE" || c.state === "NOT_CONFIGURED",
  );
  const show = degraded.filter((c) => c.key !== "push_alerts" || c.state !== "NOT_CONFIGURED");

  if (health.overall === "HEALTHY" && show.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/80 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">System status</p>
        <p className="mt-1 text-sm font-semibold text-[#2A4536]">Connected systems available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--lx-border)]/60 bg-[color:var(--lx-section)]/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">System status</p>
      <ul className="mt-2 space-y-1.5">
        {show.map((c) => (
          <li key={c.key} className="text-sm text-[#5C5346]">
            <span className="font-semibold text-[#1E1810]">{c.label}:</span>{" "}
            {c.ownerMessage ??
              (c.state === "NOT_CONFIGURED" ? "Not configured" : c.state === "UNAVAILABLE" ? "Unavailable" : "Degraded")}
          </li>
        ))}
      </ul>
    </div>
  );
}
