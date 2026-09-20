"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { businessAccessCopy } from "@/app/lib/listingPlans/businessAccessCopy";
import { quickBusinessCopy } from "@/app/lib/quickBusiness/quickBusinessCopy";
import { getQuickBusinessDefinition, listQuickBusinessDefinitions } from "@/app/lib/quickBusiness/quickBusinessRegistry";
import { isQuickBusinessCategoryKey, quickBusinessChooserPath, quickBusinessMyBusinessPath } from "@/app/lib/quickBusiness/quickBusinessRoutes";
import { qt } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import { QuickShell, quickCard, quickPrimaryBtn, quickSecondaryBtn } from "@/app/publicar/rapido/_components/QuickShell";

function withLang(path: string, lang: string): string {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

/**
 * SIMPLE business control doorway — VIEW / EDIT / PAUSE / END / BILLING / HELP / UPGRADE.
 *
 * The Quick Classifieds doorway (QuickMyAdClient) in spirit, for a business. Every verb is a
 * link into the category's EXISTING owner surface, taken from the registry's `manage` block —
 * nothing here mutates a listing, calls an API, or reads a commercial state of its own. That is
 * what keeps this a doorway rather than a second dashboard.
 *
 * Deliberately absent: analytics widgets, Business Hub modules, growth tools, reporting, a
 * sidebar. Those are FULL, they are enforced on the server, and showing them here would promise
 * a Simple customer something the server will refuse.
 */
export function QuickBusinessMyBusinessClient() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const catParam = searchParams?.get("cat");
  const category = isQuickBusinessCategoryKey(catParam) ? catParam : null;

  if (!category) {
    return (
      <QuickShell
        lang={lang}
        eyebrow={quickBusinessCopy("eyebrow", lang)}
        title={quickBusinessCopy("myBusinessTitle", lang)}
        subtitle={quickBusinessCopy("myBusinessPick", lang)}
        backHref={quickBusinessChooserPath(routeLang)}
      >
        <ul className="grid grid-cols-2 gap-3">
          {listQuickBusinessDefinitions().map((def) => (
            <li key={def.key}>
              <Link
                href={quickBusinessMyBusinessPath(routeLang, def.key)}
                className={`${quickCard} flex min-h-[84px] flex-col items-center justify-center text-center hover:bg-[#FFF6E7]`}
              >
                <span className="text-2xl" aria-hidden="true">{def.emoji}</span>
                <span className="mt-1 text-sm font-bold">{qt(def.label, lang)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={withLang("/dashboard/mis-anuncios", routeLang)} className={`${quickSecondaryBtn} mt-4`}>
          {quickBusinessCopy("myBusinessView", lang)}
        </Link>
      </QuickShell>
    );
  }

  const def = getQuickBusinessDefinition(category);
  const manage = def.manage;
  const manageHref = withLang(manage.dashboardHref, routeLang);
  const billingHref = withLang(manage.billingHref, routeLang);

  return (
    <QuickShell
      lang={lang}
      eyebrow={quickBusinessCopy("eyebrow", lang)}
      title={`${def.emoji} ${quickBusinessCopy("myBusinessTitle", lang)} · ${qt(def.label, lang)}`}
      subtitle={quickBusinessCopy("myBusinessBody", lang)}
      backHref={quickBusinessMyBusinessPath(routeLang)}
    >
      <div className="space-y-3">
        <Link href={manageHref} className={quickPrimaryBtn}>
          👀 {quickBusinessCopy("myBusinessView", lang)}
        </Link>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">✏️ {quickBusinessCopy("myBusinessEdit", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(manage.editNote, lang)}</p>
          <Link href={manageHref} className={`${quickSecondaryBtn} mt-3`}>
            {quickBusinessCopy("myBusinessEdit", lang)}
          </Link>
        </section>

        {/* REPAIR_REQUIRED: Direct pause/resume mutation requires listing ID + auth state that this
            doorway page does not hold. Removed the misleading "Pausar o reactivar" button; the
            canonical pause action lives in the existing dashboard for this category. The link below
            is honest navigation: it routes the owner to the surface that can actually act. */}
        <section className={quickCard}>
          <h2 className="text-base font-extrabold">
            ⏸️ {quickBusinessCopy("myBusinessPause", lang)} · {quickBusinessCopy("myBusinessEnd", lang)}
          </h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(manage.endNote, lang)}</p>
          <Link href={manageHref} className={`${quickSecondaryBtn} mt-3`}>
            {lang === "en" ? "Go to dashboard" : "Ir al panel"}
          </Link>
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">💳 {quickBusinessCopy("myBusinessBilling", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{qt(manage.billingNote, lang)}</p>
          <Link href={billingHref} className={`${quickSecondaryBtn} mt-3`}>
            {quickBusinessCopy("myBusinessBilling", lang)}
          </Link>
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">🙋 {quickBusinessCopy("myBusinessHelp", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{quickBusinessCopy("myBusinessHelpBody", lang)}</p>
          <Link href={withLang("/contact", routeLang)} className={`${quickSecondaryBtn} mt-3`}>
            {quickBusinessCopy("myBusinessHelp", lang)}
          </Link>
        </section>

        {/* Upgrade is an offer, not a nag: it states what stays the same, which is the customer's
            real worry. It routes to the dashboard rather than the category's public intake,
            because reopening the intake would start a SECOND listing — the dashboard reopens the
            existing application against the existing listing id, and its preview leads to the
            Full checkout for that same id. Said out loud so the destination is not a surprise. */}
        <section className={quickCard}>
          <h2 className="text-base font-extrabold">⬆️ {businessAccessCopy("upgradeCta", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{businessAccessCopy("upgradeReassurance", lang)}</p>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{businessAccessCopy("upgradeWhere", lang)}</p>
          <Link href={manageHref} className={`${quickSecondaryBtn} mt-3`}>
            {businessAccessCopy("upgradeCta", lang)}
          </Link>
        </section>
      </div>
    </QuickShell>
  );
}
