export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#111111]/40 focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/35";

export const labelClass = "block text-xs font-semibold uppercase tracking-wide text-[#111111]/65";
