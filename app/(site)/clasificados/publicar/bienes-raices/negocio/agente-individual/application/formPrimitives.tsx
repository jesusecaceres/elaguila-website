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

/**
 * Full-only capability shown to a Quick (Simple) session IN PLACE of the field (the field is hidden, not
 * merely disabled). Any stored Full value is kept: it is never deleted here, and the server enforces the
 * same boundary (restore-else-empty) on every write.
 */
export function QuickFullOnlyNote({ lang, what }: { lang: "es" | "en"; what: string }) {
  return (
    <div className="rounded-xl border border-[#D8C79A]/70 bg-[#FFF6E7] p-4" data-quick-full-only-locked="1">
      <p className="text-sm font-bold text-[#3D2C12]">{lang === "en" ? "Available with Full" : "Disponible con Full"}</p>
      <p className="mt-1 text-xs text-[#5D4A25]">
        {lang === "en"
          ? `${what} — your Quick plan keeps the same professional presentation with one primary website.`
          : `${what} — tu plan Quick conserva la misma presentación profesional con un sitio web principal.`}
      </p>
    </div>
  );
}

export function AiField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  /** Visual * for required-for-preview / trust fields. */
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={aiLabelClass}>
        {label}
        {required ? <span className="text-[#B8954A]" aria-hidden> *</span> : null}
      </span>
      {hint ? <p className={aiHintClass}>{hint}</p> : null}
      {children}
    </label>
  );
}
