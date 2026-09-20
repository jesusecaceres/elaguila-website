"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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

/** Maps Quick Business category key to the billing-portal-session API category param. */
function toBillingApiCategory(catKey: string): string {
  if (catKey === "autos-dealer") return "autos-dealer";
  if (catKey === "bienes-negocio") return "bienes-negocio";
  return catKey; // servicios, restaurantes
}

/**
 * SIMPLE business control doorway — VIEW / EDIT / PAUSE / END / BILLING / HELP / UPGRADE.
 *
 * Billing: uses a server-side billing portal session (POST /api/stripe/billing-portal-session)
 * so the customer ID is resolved server-side and never exposed to the browser.
 * The billing section uses a POST request + redirect, not a static href.
 */
export function QuickBusinessMyBusinessClient() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
  const catParam = searchParams?.get("cat");
  const category = isQuickBusinessCategoryKey(catParam) ? catParam : null;

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  async function handleBillingPortal(catKey: string) {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const res = await fetch("/api/stripe/billing-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: toBillingApiCategory(catKey),
          returnPath: `/publicar/negocio-rapido/mi-negocio?cat=${catKey}&lang=${routeLang}`,
        }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setBillingError(
          lang === "en"
            ? "Could not open billing portal. Please try again or contact support."
            : "No se pudo abrir el portal de facturación. Inténtalo de nuevo o contacta soporte.",
        );
      }
    } catch {
      setBillingError(
        lang === "en"
          ? "Network error. Please try again."
          : "Error de red. Inténtalo de nuevo.",
      );
    } finally {
      setBillingLoading(false);
    }
  }

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
          {billingError && (
            <p className="mt-2 text-sm text-red-600">{billingError}</p>
          )}
          <button
            type="button"
            disabled={billingLoading}
            onClick={() => void handleBillingPortal(category)}
            className={`${quickSecondaryBtn} mt-3 disabled:opacity-60`}
          >
            {billingLoading
              ? lang === "en" ? "Opening…" : "Abriendo…"
              : quickBusinessCopy("myBusinessBilling", lang)}
          </button>
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">🙋 {quickBusinessCopy("myBusinessHelp", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{quickBusinessCopy("myBusinessHelpBody", lang)}</p>
          <Link href={withLang("/contact", routeLang)} className={`${quickSecondaryBtn} mt-3`}>
            {quickBusinessCopy("myBusinessHelp", lang)}
          </Link>
        </section>

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
