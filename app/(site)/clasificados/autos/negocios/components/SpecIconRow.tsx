import type { ReactNode } from "react";
import {
  autosPreviewRectIconBoxClass,
  autosPreviewRectSpecRowClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

export function SpecIconRow({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string | undefined;
  /** e.g. `font-mono tracking-wide` for VIN */
  valueClassName?: string;
}) {
  if (value === undefined || value.trim() === "") return null;

  return (
    <div className={autosPreviewRectSpecRowClass}>
      <span className={autosPreviewRectIconBoxClass} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{label}</p>
        <p className={`mt-0.5 break-words text-sm font-bold leading-snug text-[#1F241C] ${valueClassName ?? ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
