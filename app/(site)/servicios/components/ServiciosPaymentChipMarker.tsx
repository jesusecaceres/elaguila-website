import type { ServiciosPaymentChipLeading } from "../lib/serviciosPaymentChipVisual";

const BRAND_DISPLAY: Record<
  "zelle" | "venmo" | "cash_app" | "paypal" | "visa" | "mastercard" | "amex" | "affirm" | "capital_one",
  string
> = {
  zelle: "Zelle",
  venmo: "Venmo",
  cash_app: "Cash App",
  paypal: "PayPal",
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "AMEX",
  affirm: "Affirm",
  capital_one: "Capital One",
};

const BRAND_CLASS: Record<
  "zelle" | "venmo" | "cash_app" | "paypal" | "visa" | "mastercard" | "amex" | "affirm" | "capital_one",
  string
> = {
  zelle: "bg-[#6D1ED4]",
  venmo: "bg-[#008CFF]",
  cash_app: "bg-[#00D632]",
  paypal: "bg-[#003087]",
  visa: "bg-[#1A1F71]",
  mastercard: "bg-[#EB001B]",
  amex: "bg-[#2E77BC]",
  affirm: "bg-[#4A4AF4]",
  capital_one: "bg-[#004977]",
};

/** Compact payment chip marker — adapted from RestaurantePublishChipMarker (Servicios-only). */
export function ServiciosPaymentChipMarker({
  leading,
}: {
  leading: ServiciosPaymentChipLeading;
}) {
  const emojiCls = "shrink-0 select-none text-sm leading-none";
  const brandCls =
    "inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white";
  const pillCls =
    "inline-flex shrink-0 items-center rounded px-1 py-0.5 text-[9px] font-bold leading-none tracking-wide text-white";

  if (leading.kind === "emoji") {
    return (
      <span className={emojiCls} aria-hidden="true">
        {leading.emoji}
      </span>
    );
  }
  if (leading.kind === "brand") {
    return (
      <span className={`${brandCls} ${BRAND_CLASS[leading.brand]}`} aria-hidden="true">
        {BRAND_DISPLAY[leading.brand]}
      </span>
    );
  }
  return (
    <span className={`${pillCls} ${leading.className}`} aria-hidden="true">
      {leading.text}
    </span>
  );
}
