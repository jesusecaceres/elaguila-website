import type { ReactNode } from "react";
import {
  promoFieldBadgeClass,
  promoFieldBadgeLabel,
  type PromoFieldBadgeKind,
} from "@/app/admin/_lib/promoCodeOsV2Theme";
import { adminInputClass } from "@/app/admin/_components/adminTheme";

type PromoCodeFieldGuidanceProps = {
  label: string;
  badge?: PromoFieldBadgeKind;
  hint?: string;
  className?: string;
  children: ReactNode;
};

function fieldBorderClass(badge?: PromoFieldBadgeKind): string {
  if (badge === "required") return "border-l-2 border-[#C9B46A] pl-2.5";
  if (badge === "risk") return "border-l-2 border-[#7A1E2C]/50 pl-2.5";
  if (badge === "coming_later") return "border-l-2 border-[#D4C4A8] pl-2.5 opacity-90";
  return "";
}

export function PromoCodeFieldGuidance({
  label,
  badge,
  hint,
  className = "",
  children,
}: PromoCodeFieldGuidanceProps) {
  return (
    <label className={`block text-xs font-semibold text-[#5C5346] ${fieldBorderClass(badge)} ${className}`}>
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-[#1E1810]">{label}</span>
        {badge ? (
          <span className={promoFieldBadgeClass(badge)}>{promoFieldBadgeLabel(badge)}</span>
        ) : null}
      </span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">{hint}</span> : null}
    </label>
  );
}

export { adminInputClass };
