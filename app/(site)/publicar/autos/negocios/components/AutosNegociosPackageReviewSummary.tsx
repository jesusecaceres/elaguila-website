"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosDealerPackageReviewPaymentNote,
  autosDealerPackageReviewSectionTitle,
} from "@/app/lib/clasificados/autos/autosDealerPackageSelectionCopy";
import { AutosNegociosPackagePricingSummary } from "./AutosNegociosPackagePricingSummary";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:p-6";

type Props = {
  lang: AutosNegociosLang;
  inventoryBoostSelected: boolean;
};

export function AutosNegociosPackageReviewSummary({ lang, inventoryBoostSelected }: Props) {
  return (
    <section className={`${CARD} mt-6`} aria-labelledby="autos-negocios-package-review-heading" data-autos-package-review>
      <h2 id="autos-negocios-package-review-heading" className="text-lg font-bold text-[color:var(--lx-text)]">
        {autosDealerPackageReviewSectionTitle(lang)}
      </h2>
      <div className="mt-4">
        <AutosNegociosPackagePricingSummary lang={lang} inventoryBoostSelected={inventoryBoostSelected} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[color:var(--lx-muted)]">{autosDealerPackageReviewPaymentNote(lang)}</p>
    </section>
  );
}
