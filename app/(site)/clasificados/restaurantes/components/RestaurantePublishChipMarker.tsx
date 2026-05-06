import type { RestaurantePublishChipLeading } from "@/app/clasificados/restaurantes/lib/restaurantePublishChipVisual";

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

export function RestaurantePublishChipMarker({
  leading,
  compact = true,
}: {
  leading: RestaurantePublishChipLeading;
  compact?: boolean;
}) {
  const emojiCls = compact ? "text-sm leading-none" : "text-base leading-none";
  const brandCls = compact
    ? "rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-white"
    : "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white";
  const pillCls = compact
    ? "rounded px-1 py-0.5 text-[9px] font-bold leading-none tracking-wide text-white"
    : "rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white";

  if (leading.kind === "emoji") {
    return (
      <span className={`shrink-0 select-none ${emojiCls}`} aria-hidden="true">
        {leading.emoji}
      </span>
    );
  }
  if (leading.kind === "brand") {
    return (
      <span
        className={`inline-flex shrink-0 items-center ${brandCls} ${BRAND_CLASS[leading.brand]}`}
        aria-hidden="true"
      >
        {BRAND_DISPLAY[leading.brand]}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center ${pillCls} ${leading.className}`}
      aria-hidden="true"
    >
      {leading.text}
    </span>
  );
}
