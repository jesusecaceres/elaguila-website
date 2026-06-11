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
    case "needs_reply":
      return "bg-rose-100 text-rose-950 ring-1 ring-rose-200";
    case "contacted":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-200";
    case "waiting_on_client":
      return "bg-orange-100 text-orange-950 ring-1 ring-orange-200";
    case "qualified":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200";
    case "won":
    case "closed":
      return "bg-teal-100 text-teal-900 ring-1 ring-teal-200";
    case "lost":
      return "bg-neutral-200 text-neutral-800 ring-1 ring-neutral-300";
    case "archived":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200";
    default:
      return "bg-[#F4F0E8] text-[#5C5346] ring-1 ring-[#E8DFD0]";
  }
}

export function inquiryTypeBadgeClass(inquiryType: string): string {
  switch (inquiryType.trim()) {
    case "advertising":
      return "bg-[#7A1E2C]/10 text-[#7A1E2C] ring-1 ring-[#7A1E2C]/20";
    case "promotionalProducts":
      return "bg-amber-50 text-amber-950 ring-1 ring-amber-200";
    case "mediaKit":
      return "bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200";
    case "launch":
      return "bg-purple-50 text-purple-900 ring-1 ring-purple-200";
    default:
      return "bg-[#F4F0E8] text-[#5C5346] ring-1 ring-[#E8DFD0]";
  }
}

export function contactPreferenceBadgeClass(method: string): string {
  switch (method.trim().toLowerCase()) {
    case "phone":
      return "bg-sky-50 text-sky-900 ring-1 ring-sky-200";
    case "either":
      return "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200";
    default:
      return "bg-[#FAF7F2] text-[#5C5346] ring-1 ring-[#E8DFD0]";
  }
}

/** Parse newsletter interests into display chips (semicolon or comma separated). */
export function parseInterestChips(interests: string): string[] {
  const raw = interests.trim();
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
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
