"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { formatRevenuePriceLabel, getRevenuePackagePriceCents } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { quickBusinessCopy } from "@/app/lib/quickBusiness/quickBusinessCopy";
import { listQuickBusinessDefinitions } from "@/app/lib/quickBusiness/quickBusinessRegistry";
import { quickBusinessCategoryPath } from "@/app/lib/quickBusiness/quickBusinessRoutes";
import type { QuickBusinessDefinition } from "@/app/lib/quickBusiness/quickBusinessTypes";
import { qt } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import type { QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { quickClassifiedsChooserPath } from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import { QuickShell, quickCard, quickSecondaryBtn } from "@/app/publicar/rapido/_components/QuickShell";

function withLang(path: string, lang: string): string {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

/** Monthly price badge, always from the server pricing authority at render time. */
function priceBadge(def: QuickBusinessDefinition, lang: QuickLang): string {
  const { priceCents } = getRevenuePackagePriceCents({ category: def.pricing.category, packageKey: def.pricing.packageKey });
  return priceCents == null ? "" : `${formatRevenuePriceLabel(priceCents)}${quickBusinessCopy("perMonth", lang)}`;
}

export function QuickBusinessChooser() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(() => resolveClasificadosPublishLang(searchParams?.get("lang")), [searchParams]);
  const src = searchParams?.get("src") === "staff" ? "staff" : undefined;
  const definitions = listQuickBusinessDefinitions();

  return (
    <QuickShell lang={lang} eyebrow={quickBusinessCopy("eyebrow", lang)} title={quickBusinessCopy("chooserTitle", lang)} subtitle={quickBusinessCopy("chooserBody", lang)}>
      {src === "staff" ? (
        <p className="mb-3 rounded-xl border border-[#C9A84A]/60 bg-[#FFF6E7] px-3 py-2 text-xs text-[#6E4E18]">{quickBusinessCopy("fromStaffBanner", lang)}</p>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {definitions.map((def) => {
          const direct = def.status === "direct";
          // Direct categories (Dealer / Real-estate business) open the EXISTING application: they require real inventory.
          const href = direct ? withLang(def.standardApplicationPath, routeLang) : quickBusinessCategoryPath(def.key, routeLang, src);
          const badge = priceBadge(def, lang);
          return (
            <li key={def.key}>
              <Link href={href} className={`${quickCard} flex min-h-[96px] items-start gap-3 hover:bg-[#FFF6E7] active:scale-[0.99]`}>
                <span className="text-3xl leading-none" aria-hidden="true">{def.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold">{qt(def.label, lang)}</span>
                    {badge ? <span className="rounded-full bg-[#FFF1C9] px-2 py-0.5 text-[11px] font-bold text-[#6E4E18]">{badge}</span> : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-[#5D4A25]/90">{qt(def.tagline, lang)}</span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-[#9A8B6A]">
                    {direct ? quickBusinessCopy("chooserDirect", lang) : `≈ ${def.essentialQuestionCount} ${quickBusinessCopy("chooserQuestions", lang)} · 📷`}
                  </span>
                  {direct && def.directReason ? <span className="mt-1 block text-xs text-[#7A7164]">{qt(def.directReason.reason, lang)}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className={`${quickCard} mt-6`}>
        <h2 className="text-sm font-bold">{quickBusinessCopy("manageTitle", lang)}</h2>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link href={withLang("/dashboard/servicios", routeLang)} className={quickSecondaryBtn}>{quickBusinessCopy("manageServicios", lang)}</Link>
          <Link href={withLang("/dashboard/restaurantes", routeLang)} className={quickSecondaryBtn}>{quickBusinessCopy("manageRestaurantes", lang)}</Link>
          <Link href={withLang("/dashboard/mis-anuncios", routeLang)} className={quickSecondaryBtn}>{quickBusinessCopy("manageOther", lang)}</Link>
        </div>
      </section>

      <div className="mt-6 space-y-2 text-center text-sm">
        <Link href={quickClassifiedsChooserPath(routeLang, src)} className="block font-semibold text-[#7A1E2C] underline">
          {quickBusinessCopy("chooserClassifiedsLink", lang)}
        </Link>
        <p className="text-xs text-[#7A7164]">
          {quickBusinessCopy("chooserFullLink", lang)}{" "}
          <Link href={`/publicar?lang=${routeLang}`} className="font-semibold text-[#7A1E2C] underline">
            {quickBusinessCopy("chooserFullLinkCta", lang)}
          </Link>
        </p>
      </div>
    </QuickShell>
  );
}
