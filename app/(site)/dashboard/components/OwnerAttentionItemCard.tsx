"use client";

import Link from "next/link";
import { LX_DASH, lxDashStatusChipClass } from "../lib/dashboardLeonixTheme";
import { ownerAttentionSeverityTone } from "../lib/ownerAccountCommandCenter";
import type { OwnerAttentionItem } from "../lib/ownerAttentionModel";
import type { Lang } from "../lib/dashboardI18n";

const SEVERITY_LABEL: Record<OwnerAttentionItem["severity"], { es: string; en: string }> = {
  critical: { es: "Crítico", en: "Critical" },
  warning: { es: "Atención", en: "Attention" },
  opportunity: { es: "Oportunidad", en: "Opportunity" },
  info: { es: "Informativo", en: "Informational" },
};

const PROVENANCE_LABEL: Record<OwnerAttentionItem["provenanceState"], { es: string; en: string }> = {
  PROVEN: { es: "Verificado", en: "Verified" },
  PARTIAL: { es: "Evidencia parcial", en: "Partial evidence" },
  NEEDS_TRIAGE: { es: "Necesita revisión", en: "Needs triage" },
};

/**
 * Owner Attention Truth Gate — the ONE rendering of an OwnerAttentionItem, shared by
 * `/dashboard` (OwnerNeedsAttention) and `/dashboard/business-tools` (BusinessConciergeOwnerHome)
 * so an Advisor signal and a derived-feed item never get two different visual interpretations.
 */
export function OwnerAttentionItemCard({ item, lang }: { item: OwnerAttentionItem; lang: Lang }) {
  const es = lang === "es";
  const tone = ownerAttentionSeverityTone(item.severity);
  return (
    <Link
      href={item.actionHref}
      className="flex min-h-[44px] flex-col gap-1.5 rounded-xl border border-[#D6C7AD]/80 bg-[#FFFCF7] px-4 py-3 transition hover:border-[#C9A84A]/45"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={lxDashStatusChipClass(tone)}>{es ? SEVERITY_LABEL[item.severity].es : SEVERITY_LABEL[item.severity].en}</span>
        {item.provenanceState !== "PROVEN" ? (
          <span className={LX_DASH.subtleBadge}>{es ? PROVENANCE_LABEL[item.provenanceState].es : PROVENANCE_LABEL[item.provenanceState].en}</span>
        ) : null}
      </div>
      <span className="text-sm font-semibold text-[#1F241C]">{item.title}</span>
      <span className="text-sm leading-relaxed text-[#3D3428]">{item.reason}</span>
      <span className="text-xs font-medium text-[#8A6B1F]">→ {item.recommendedAction}</span>
    </Link>
  );
}
