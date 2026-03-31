"use client";

export const brLabelClass = "block text-xs font-bold uppercase tracking-wide text-[#5C5346]/90";
export const brHintClass = "mt-1 text-xs text-[#5C5346]/75";
export const brInputClass =
  "mt-1.5 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#2C2416] outline-none focus:border-[#C9B46A]/70";
export const brTextareaClass = `${brInputClass} min-h-[120px] resize-y`;
export const brCardClass =
  "rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.1)] sm:p-6";
export const brSectionTitleClass = "text-lg font-bold text-[#1E1810]";
export const brSubTitleClass = "mt-1 text-sm text-[#5C5346]/88";

/** Línea breve que conecta el paso con la vista previa aprobada (usar con moderación). */
export function BrPreviewHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-lg border border-[#E8DFD0]/85 bg-[#FFFCF7] px-3 py-2 text-xs leading-relaxed text-[#5C5346]/90">
      <span className="font-semibold text-[#B8954A]">En el preview: </span>
      {children}
    </p>
  );
}

export function BrField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={brLabelClass}>{label}</span>
      {hint ? <p className={brHintClass}>{hint}</p> : null}
      {children}
    </label>
  );
}
