"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { formatRevenuePriceLabel, getRevenuePackagePriceCents } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import { listQuickClassifiedDefinitions } from "@/app/lib/quickClassifieds/quickClassifiedRegistry";
import { quickClassifiedCategoryPath, quickClassifiedMyAdPath } from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import type { QuickClassifiedDefinition, QuickLang } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { QuickShell, quickCard } from "./QuickShell";

function priceBadge(def: QuickClassifiedDefinition, lang: QuickLang): string {
  if (def.pricing.kind === "free") return quickCopy("chooserFree", lang);
  const { priceCents } = getRevenuePackagePriceCents({ category: def.pricing.category, packageKey: def.pricing.packageKey });
  return priceCents == null ? "" : formatRevenuePriceLabel(priceCents);
}

export function QuickCategoryChooser() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(() => resolveClasificadosPublishLang(searchParams?.get("lang")), [searchParams]);
  const src = searchParams?.get("src") === "staff" ? "staff" : undefined;
  const definitions = listQuickClassifiedDefinitions();

  return (
    <QuickShell lang={lang} title={quickCopy("chooserTitle", lang)} subtitle={quickCopy("chooserBody", lang)}>
      {src === "staff" ? (
        <p className="mb-3 rounded-xl border border-[#C9A84A]/60 bg-[#FFF6E7] px-3 py-2 text-xs text-[#6E4E18]">{quickCopy("fromStaffBanner", lang)}</p>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {definitions.map((def) => {
          const blocked = def.status === "blocked";
          const href = blocked ? `${def.standardApplicationPath}?lang=${routeLang}` : quickClassifiedCategoryPath(def.key, routeLang, src);
          const badge = priceBadge(def, lang);
          return (
            <li key={def.key}>
              <Link href={href} className={`${quickCard} flex min-h-[96px] items-start gap-3 hover:bg-[#FFF6E7] active:scale-[0.99]`}>
                <span className="text-3xl leading-none" aria-hidden="true">{def.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold">{qt(def.label, lang)}</span>
                    {badge ? (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${def.pricing.kind === "free" ? "bg-emerald-100 text-emerald-900" : "bg-[#FFF1C9] text-[#6E4E18]"}`}>{badge}</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-[#5D4A25]/90">{qt(def.tagline, lang)}</span>
                  <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-[#9A8B6A]">
                    {blocked ? quickCopy("chooserStandard", lang) : `≈ ${def.essentialQuestionCount} ${quickCopy("chooserQuestions", lang)} · 📷`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 space-y-2 text-center text-sm">
        <Link href={quickClassifiedMyAdPath(routeLang)} className="block font-semibold text-[#7A1E2C] underline">
          {quickCopy("myAdEntry", lang)}
        </Link>
        <p className="text-xs text-[#7A7164]">
          {quickCopy("chooserFullLink", lang)}{" "}
          <Link href={`/publicar?lang=${routeLang}`} className="font-semibold text-[#7A1E2C] underline">
            {quickCopy("chooserFullLinkCta", lang)}
          </Link>
        </p>
      </div>
    </QuickShell>
  );
}
