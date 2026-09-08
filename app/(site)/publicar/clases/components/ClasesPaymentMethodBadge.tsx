"use client";

import { SiAfterpay, SiApplepay, SiGooglepay, SiKlarna } from "react-icons/si";
import {
  getClasesPaymentMethodLabel,
  getClasesPaymentMethodVisual,
  isClasesPaymentMethodId,
  type ClasesPaymentMethodId,
} from "@/app/(site)/publicar/clases/lib/clasesPaymentMethods";

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

/** Real, canonical brand marks (react-icons/si — Simple Icons) for brands the platform already
 * has an installed icon asset for. Gate 2D — do not fabricate a logo for a brand without one. */
const BRAND_ICON: Record<"apple_pay" | "google_pay" | "klarna" | "afterpay", { Icon: typeof SiApplepay; color: string }> = {
  apple_pay: { Icon: SiApplepay, color: "#000000" },
  google_pay: { Icon: SiGooglepay, color: "#4285F4" },
  klarna: { Icon: SiKlarna, color: "#FFB3C7" },
  afterpay: { Icon: SiAfterpay, color: "#B2FCE4" },
};

/** Clases-owned payment-method chip (Gate 2A/2D) — mirrors the Servicios badge pattern without importing it. */
export function ClasesPaymentMethodBadge({
  lang,
  id,
  otherLabel,
}: {
  lang: "es" | "en";
  id: string;
  otherLabel?: string;
}) {
  if (!isClasesPaymentMethodId(id)) return null;
  const isOtro = id === "otro";
  const label: string = isOtro ? (otherLabel ?? "").trim() || getClasesPaymentMethodLabel(id, lang) : getClasesPaymentMethodLabel(id as ClasesPaymentMethodId, lang);
  const visual = getClasesPaymentMethodVisual(id as ClasesPaymentMethodId, otherLabel);

  let marker: JSX.Element;
  if (visual.kind === "emoji") {
    marker = (
      <span className="select-none text-sm leading-none" aria-hidden>
        {visual.emoji}
      </span>
    );
  } else if (visual.kind === "brandIcon") {
    const { Icon, color } = BRAND_ICON[visual.brand];
    marker = (
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center" style={{ color }} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
    );
  } else {
    marker = (
      <span
        className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white ${BRAND_CLASS[visual.brand]}`}
      >
        {BRAND_DISPLAY[visual.brand]}
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2.5 py-1 text-xs font-medium text-[#2A2826]">
      {marker}
      <span className="min-w-0 leading-snug">{label}</span>
    </span>
  );
}
