import { adminCardBase } from "@/app/admin/_components/adminTheme";

const LEVELS = [
  { level: "GREEN", meaning: "Read / analyze — safe interpretation of existing truth." },
  { level: "YELLOW", meaning: "Prepare only — drafts and plans; no external execution." },
  { level: "RED", meaning: "Chuy approval required — execution unavailable in LEO v0." },
  { level: "NEVER", meaning: "Blocked — authority abuse, concealment, or bypass attempts." },
] as const;

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

export function LeoGovernanceLegend() {
  return (
    <section className={`${adminCardBase} min-w-0 p-4 sm:p-5`} aria-labelledby="leo-gov-heading">
      <h2 id="leo-gov-heading" className="text-base font-bold text-[#1E1810]">
        Governance
      </h2>
      <p className="mt-1 text-xs text-[#5C5346]">Authority classes from LEO-6. Conversation cannot change them.</p>
      <ul className="mt-3 space-y-2">
        {LEVELS.map((row) => (
          <li key={row.level} className="flex min-w-0 gap-2">
            <span
              className={`mt-0.5 inline-flex h-fit shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${levelClass(row.level)}`}
            >
              {row.level}
            </span>
            <span className="break-words text-xs leading-relaxed text-[#5C5346]">{row.meaning}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
