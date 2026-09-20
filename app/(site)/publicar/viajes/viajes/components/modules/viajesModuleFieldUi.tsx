"use client";

export const MOD_LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
export const MOD_INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
export const MOD_TEXTAREA = `${MOD_INPUT} min-h-[80px] resize-y`;
export const MOD_CARD =
  "rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 shadow-[0_6px_20px_-14px_rgba(42,36,22,0.14)] sm:p-4";

export const viajesModuleFieldClass = {
  LABEL: MOD_LABEL,
  INPUT: MOD_INPUT,
  TEXTAREA: MOD_TEXTAREA,
  CARD: MOD_CARD,
};

export function ViajesModuleTextField({
  id,
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={MOD_LABEL} htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className={MOD_TEXTAREA}
          value={value}
          placeholder={placeholder}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className={MOD_INPUT}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/** @deprecated Prefer ViajesModuleTextField */
export const ModField = ViajesModuleTextField;
