"use client";

import { EN_VENTA_MODERATION_REASONS } from "../contracts/enVentaPublishContract";

type Lang = "es" | "en";

const LABELS: Record<(typeof EN_VENTA_MODERATION_REASONS)[number], { es: string; en: string }> = {
  prohibited_item: { es: "Artículo prohibido", en: "Prohibited item" },
  counterfeit: { es: "Falso / réplica", en: "Counterfeit" },
  misleading_price: { es: "Precio engañoso", en: "Misleading price" },
  spam: { es: "Spam", en: "Spam" },
  duplicate: { es: "Duplicado", en: "Duplicate" },
};

export function EnVentaModerationFields({ lang }: { lang: Lang }) {
  return (
    <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 text-sm text-[#2C2416]/90">
      <div className="font-semibold text-[#6B5B2E]">{lang === "es" ? "Moderación En Venta" : "En Venta moderation"}</div>
      <ul className="mt-2 list-inside list-disc text-[#5C5346]/90">
        {EN_VENTA_MODERATION_REASONS.map((r) => (
          <li key={r}>{LABELS[r][lang]}</li>
        ))}
      </ul>
    </div>
  );
}
