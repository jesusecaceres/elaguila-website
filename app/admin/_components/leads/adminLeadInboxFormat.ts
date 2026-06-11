export function formatLeadWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** Compact created column: date and time on separate lines to avoid status collision. */
export function formatLeadCreatedParts(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return { date: "—", time: "" };
    return {
      date: d.toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" }),
    };
  } catch {
    return { date: "—", time: "" };
  }
}

export function leadStatusBadgeClass(status: string): string {
  switch (status.trim().toLowerCase()) {
    case "new":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
    case "contacted":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-200";
    case "qualified":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    case "closed":
      return "bg-neutral-200 text-neutral-800 ring-1 ring-neutral-300";
    case "archived":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200";
    default:
      return "bg-[#F4F0E8] text-[#5C5346] ring-1 ring-[#E8DFD0]";
  }
}

export function clipLeadText(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t || "—";
  return `${t.slice(0, max)}…`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
