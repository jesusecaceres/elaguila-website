"use client";

import Link from "next/link";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosDealerInventoryAddTenSlotsCta,
  autosDealerInventoryAddVehicleCta,
  autosDealerInventoryValueBoost,
  autosDealerInventoryValueBullets,
  autosDealerInventoryValueDetail,
  autosDealerInventoryValueLead,
  autosDealerInventoryValueTitle,
} from "@/app/lib/clasificados/autos/autosDealerInventoryValueCopy";
import {
  autosDealerInventoryUpgradeContactHref,
  autosDealerInventoryUpgradeCtaLabel,
} from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";
import { buildAutosInventoryAddPublishHref } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";

export function AutosNegociosInventoryValueModule({
  lang,
  parentListingId,
  dealerInventoryGroupId,
  atLimit = false,
  showAddCta = true,
}: {
  lang: AutosNegociosLang;
  parentListingId?: string | null;
  dealerInventoryGroupId?: string | null;
  atLimit?: boolean;
  showAddCta?: boolean;
}) {
  const bullets = autosDealerInventoryValueBullets(lang);
  const addHref =
    parentListingId && showAddCta && !atLimit
      ? buildAutosInventoryAddPublishHref(
          {
            parentListingId,
            returnToListingId: parentListingId,
            dealerInventoryGroupId: dealerInventoryGroupId ?? null,
          },
          lang,
        )
      : null;

  return (
    <section className="mt-6 rounded-2xl border border-[color:var(--lx-gold-border)]/50 bg-gradient-to-br from-[color:var(--lx-section)] to-[#FFFCF7] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.12)]">
      <h3 className="text-base font-extrabold tracking-tight text-[color:var(--lx-text)]">
        {autosDealerInventoryValueTitle(lang)}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-[color:var(--lx-text)]">
        {autosDealerInventoryValueLead(lang)}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{autosDealerInventoryValueDetail(lang)}</p>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{autosDealerInventoryValueBoost(lang)}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-xs font-medium text-[color:var(--lx-text-2)]">
            <span className="mt-0.5 text-[color:var(--lx-gold)]" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {addHref ? (
          <Link
            href={addHref}
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[color:var(--lx-cta-dark)] px-5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)]"
          >
            {autosDealerInventoryAddVehicleCta(lang)}
          </Link>
        ) : null}
        {atLimit ? (
          <>
            <a
              href={autosDealerInventoryUpgradeContactHref(lang)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-5 text-sm font-bold text-[color:var(--lx-text)]"
            >
              {autosDealerInventoryUpgradeCtaLabel(lang)}
            </a>
            <a
              href={autosDealerInventoryUpgradeContactHref(lang)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-5 text-sm font-bold text-[color:var(--lx-text)]"
            >
              {autosDealerInventoryAddTenSlotsCta(lang)}
            </a>
          </>
        ) : null}
      </div>
    </section>
  );
}
