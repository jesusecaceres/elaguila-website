"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  getAutosApplicationPlanReminder,
  type AutosListingPlanLane,
} from "@/app/lib/clasificados/autos/autosPricingCopy";

type Props = {
  lang: AutosNegociosLang;
  lane: AutosListingPlanLane;
};

export function AutosPricingPlanBanner({ lang, lane }: Props) {
  const { planLine, helperLine } = getAutosApplicationPlanReminder(lang, lane);

  return (
    <div
      className="rounded-xl border border-[color:var(--lx-gold-border)]/80 bg-[color:var(--lx-section)] px-3.5 py-3 sm:px-4"
      data-autos-pricing-plan-banner={lane}
    >
      <p className="text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{planLine}</p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">{helperLine}</p>
    </div>
  );
}
