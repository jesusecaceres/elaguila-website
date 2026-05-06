"use client";

import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  getCustomPaymentMethodVisual,
  getServiciosPaymentMethodLabel,
  getStandardPaymentMethodVisual,
  isServiciosPaymentMethodId,
} from "../lib/serviciosPaymentMethodCatalog";

const BRAND_DISPLAY: Record<"zelle" | "venmo" | "cash_app" | "paypal", string> = {
  zelle: "Zelle",
  venmo: "Venmo",
  cash_app: "Cash App",
  paypal: "PayPal",
};

const BRAND_CLASS: Record<"zelle" | "venmo" | "cash_app" | "paypal", string> = {
  zelle: "bg-[#6D1ED4]",
  venmo: "bg-[#008CFF]",
  cash_app: "bg-[#00D632]",
  paypal: "bg-[#003087]",
};

export function ServiciosPaymentMethodBadge({
  lang,
  standardId,
  customLabel,
  compact,
}: {
  lang: ServiciosLang;
  standardId?: string | null;
  customLabel?: string | null;
  compact?: boolean;
}) {
  const visual =
    standardId && isServiciosPaymentMethodId(standardId)
      ? getStandardPaymentMethodVisual(standardId)
      : getCustomPaymentMethodVisual();
  const text =
    standardId && isServiciosPaymentMethodId(standardId)
      ? getServiciosPaymentMethodLabel(standardId, lang)
      : (customLabel ?? "").trim();

  const gap = compact ? "gap-1.5" : "gap-2";
  const textCls = compact ? "text-xs font-medium" : "text-sm font-medium";

  const marker =
    visual.kind === "emoji" ? (
      <span className="select-none text-base leading-none" aria-hidden>
        {visual.emoji}
      </span>
    ) : (
      <span
        className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${BRAND_CLASS[visual.brand]}`}
      >
        {BRAND_DISPLAY[visual.brand]}
      </span>
    );

  return (
    <span className={`inline-flex min-w-0 items-center ${gap} ${textCls} text-[color:var(--lx-text)]`}>
      {marker}
      <span className="min-w-0 leading-snug">{text}</span>
    </span>
  );
}
