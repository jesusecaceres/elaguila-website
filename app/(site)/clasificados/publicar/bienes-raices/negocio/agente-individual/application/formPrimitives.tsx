"use client";

export const aiLabelClass = "block text-xs font-bold uppercase tracking-wide text-[#5C5346]/90";
export const aiHintClass = "mt-1 text-xs text-[#5C5346]/75";
export const aiInputClass =
  "mt-1.5 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-3 text-base text-[#2C2416] outline-none focus:border-[#C9B46A]/70 sm:min-h-0 sm:py-2.5 sm:text-sm";
export const aiTextareaClass = `${aiInputClass} min-h-[100px] resize-y`;
export const aiCardClass =
  "rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.1)] sm:p-5 md:p-6";
export const aiTitleClass = "text-lg font-bold text-[#1E1810]";
export const aiSubClass = "mt-1 text-sm text-[#5C5346]/88";

export function AiField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={aiLabelClass}>{label}</span>
      {hint ? <p className={aiHintClass}>{hint}</p> : null}
      {children}
    </label>
  );
}
