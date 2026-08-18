function levelClass(level: string): string {
  switch (level) {
    case "GREEN":
      return "border-[#2A4536]/35 bg-[#EEF4F0] text-[#2A4536]";
    case "YELLOW":
      return "border-[#C9B46A]/60 bg-[#FFFCF7] text-[#5C4E2E]";
    case "RED":
      return "border-rose-300 bg-rose-50 text-rose-900";
    default:
      return "border-[#1E1810]/20 bg-[#F4F1EA] text-[#1E1810]";
  }
}

const LEVELS = [
  { level: "GREEN", meaning: "Read & analyze" },
  { level: "YELLOW", meaning: "Prepare only" },
  { level: "RED", meaning: "Chuy approval" },
  { level: "NEVER", meaning: "Blocked" },
] as const;

export function LeoGovernanceLegend() {
  return (
    <div className="min-w-0" aria-labelledby="leo-gov-heading">
      <h3 id="leo-gov-heading" className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">
        Governance
      </h3>
      <ul className="mt-2 flex min-w-0 flex-wrap gap-2">
        {LEVELS.map((row) => (
          <li key={row.level} className="inline-flex min-w-0 items-center gap-1.5">
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${levelClass(row.level)}`}>
              {row.level}
            </span>
            <span className="text-xs text-[#5C5346]">{row.meaning}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
