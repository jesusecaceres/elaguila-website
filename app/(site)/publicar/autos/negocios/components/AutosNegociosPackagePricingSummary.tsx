"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosDealerPackageActiveVehicleLimitLine,
  autosDealerPackageBaseMonthlyPrice,
  autosDealerPackageBaseTitle,
  autosDealerPackageBoostAddsLine,
  autosDealerPackageBoostMonthlyPrice,
  autosDealerPackageBoostSelectedBadge,
  autosDealerPackageBoostTitle,
  autosDealerPackageTotalMonthlyLabel,
  autosDealerPackageTotalMonthlyPrice,
} from "@/app/lib/clasificados/autos/autosDealerPackageSelectionCopy";

type Props = {
  lang: AutosNegociosLang;
  inventoryBoostSelected: boolean;
  compact?: boolean;
};

export function AutosNegociosPackagePricingSummary({ lang, inventoryBoostSelected, compact = false }: Props) {
  return (
    <div
      className={`rounded-xl border border-[color:var(--lx-gold-border)]/60 bg-[#FFFCF7] ${
        compact ? "px-3.5 py-3" : "px-4 py-4 sm:px-5"
      }`}
      data-autos-dealer-package-summary
      data-autos-inventory-boost-selected={inventoryBoostSelected ? "1" : "0"}
    >
      <div className="space-y-2.5 text-sm text-[color:var(--lx-text)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-semibold">{autosDealerPackageBaseTitle(lang)}</span>
          <span className="font-bold tabular-nums">{autosDealerPackageBaseMonthlyPrice(lang)}</span>
        </div>
        <p className="text-xs leading-relaxed text-[color:var(--lx-text-2)]">
          {autosDealerPackageActiveVehicleLimitLine(false, lang)}
        </p>

        {inventoryBoostSelected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--lx-nav-border)]/60 pt-2.5">
              <div>
                <p className="font-semibold">{autosDealerPackageBoostTitle(lang)}</p>
                <p className="mt-0.5 text-xs text-[color:var(--lx-text-2)]">{autosDealerPackageBoostAddsLine(lang)}</p>
              </div>
              <span className="font-bold tabular-nums text-[#6E5418]">{autosDealerPackageBoostMonthlyPrice(lang)}</span>
            </div>
            <p className="inline-flex rounded-full border border-[#C9B46A]/50 bg-[#FBF7EF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#6E5418]">
              {autosDealerPackageBoostSelectedBadge(lang)}
            </p>
          </>
        ) : null}

        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-[color:var(--lx-nav-border)]/60 pt-2.5">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">
            {autosDealerPackageTotalMonthlyLabel(lang)}
          </span>
          <span className="text-base font-extrabold tabular-nums text-[color:var(--lx-text)]">
            {autosDealerPackageTotalMonthlyPrice(inventoryBoostSelected, lang)}
          </span>
        </div>
        {inventoryBoostSelected ? (
          <p className="text-xs leading-relaxed text-[color:var(--lx-text-2)]">
            {autosDealerPackageActiveVehicleLimitLine(true, lang)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
