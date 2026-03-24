import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function LeonixTextField({
  label,
  helper,
  optional,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helper?: string;
  optional?: boolean;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="flex flex-wrap items-baseline gap-2 text-sm font-semibold text-[#111111]">
        {label}
        {optional ? <span className="text-xs font-medium text-[#111111]/50">(opcional)</span> : null}
      </span>
      {helper ? <p className="mt-0.5 text-xs text-[#111111]/65">{helper}</p> : null}
      <input
        {...props}
        className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#111111] shadow-sm outline-none placeholder:text-[#111111]/35 focus:border-[#A98C2A]/50 focus:ring-2 focus:ring-[#A98C2A]/20"
      />
    </label>
  );
}

export function LeonixTextarea({
  label,
  helper,
  optional,
  rows = 4,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helper?: string;
  optional?: boolean;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="flex flex-wrap items-baseline gap-2 text-sm font-semibold text-[#111111]">
        {label}
        {optional ? <span className="text-xs font-medium text-[#111111]/50">(opcional)</span> : null}
      </span>
      {helper ? <p className="mt-0.5 text-xs text-[#111111]/65">{helper}</p> : null}
      <textarea
        rows={rows}
        {...props}
        className="mt-1.5 w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#111111] shadow-sm outline-none placeholder:text-[#111111]/35 focus:border-[#A98C2A]/50 focus:ring-2 focus:ring-[#A98C2A]/20"
      />
    </label>
  );
}

export function LeonixSelect({
  label,
  helper,
  optional,
  children,
  className,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & {
  label: string;
  helper?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="flex flex-wrap items-baseline gap-2 text-sm font-semibold text-[#111111]">
        {label}
        {optional ? <span className="text-xs font-medium text-[#111111]/50">(opcional)</span> : null}
      </span>
      {helper ? <p className="mt-0.5 text-xs text-[#111111]/65">{helper}</p> : null}
      <select
        {...props}
        className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-[#111111] shadow-sm outline-none focus:border-[#A98C2A]/50 focus:ring-2 focus:ring-[#A98C2A]/20"
      >
        {children}
      </select>
    </label>
  );
}

export function LeonixCheckboxRow({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-white p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-black/20 text-[#111111] focus:ring-[#A98C2A]/30"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="text-sm font-semibold text-[#111111]">{label}</span>
        {helper ? <p className="mt-0.5 text-xs text-[#111111]/65">{helper}</p> : null}
      </span>
    </label>
  );
}
