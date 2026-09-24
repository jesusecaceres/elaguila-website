"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { qt, quickCopy } from "@/app/lib/quickClassifieds/quickClassifiedCopy";
import { getQuickClassifiedDefinition, listQuickClassifiedDefinitions } from "@/app/lib/quickClassifieds/quickClassifiedRegistry";
import { isQuickClassifiedCategoryKey, quickClassifiedsChooserPath, quickClassifiedMyAdPath } from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import { QuickShell, quickCard, quickPrimaryBtn, quickSecondaryBtn } from "./QuickShell";

function withLang(path: string, lang: string): string {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

/**
 * Simple customer control doorway — VIEW / EDIT / END / RENEW / HELP.
 * Every verb is a link into the EXISTING owner surfaces (Mis Anuncios, /dashboard/empleos, contact). Nothing here
 * mutates a listing; category wording comes from the registry's lifecycle adapter (existing actions only).
 */
export function QuickMyAdClient() {
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(() => resolveClasificadosPublishLang(searchParams?.get("lang")), [searchParams]);
  const catParam = searchParams?.get("cat");
  const category = isQuickClassifiedCategoryKey(catParam) ? catParam : null;

  if (!category) {
    return (
      <QuickShell lang={lang} title={quickCopy("doorwayTitle", lang)} subtitle={quickCopy("doorwayPickCategory", lang)} backHref={quickClassifiedsChooserPath(routeLang)}>
        <ul className="grid grid-cols-2 gap-3">
          {listQuickClassifiedDefinitions().map((def) => (
            <li key={def.key}>
              <Link href={quickClassifiedMyAdPath(routeLang, def.key)} className={`${quickCard} flex min-h-[84px] flex-col items-center justify-center text-center hover:bg-[#FFF6E7]`}>
                <span className="text-2xl" aria-hidden="true">{def.emoji}</span>
                <span className="mt-1 text-sm font-bold">{qt(def.label, lang)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={withLang("/dashboard/mis-anuncios", routeLang)} className={`${quickSecondaryBtn} mt-4`}>
          {quickCopy("doorwayView", lang)}
        </Link>
      </QuickShell>
    );
  }

  const def = getQuickClassifiedDefinition(category);
  const lc = def.lifecycle;
  const manageHref = withLang(lc.manageHref, routeLang);

  return (
    <QuickShell
      lang={lang}
      title={`${def.emoji} ${quickCopy("doorwayTitle", lang)} · ${qt(def.label, lang)}`}
      subtitle={quickCopy("doorwayBody", lang)}
      backHref={quickClassifiedMyAdPath(routeLang)}
    >
      <div className="space-y-3">
        <Link href={manageHref} className={quickPrimaryBtn}>
          👀 {quickCopy("doorwayView", lang)}
        </Link>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">✏️ {quickCopy("doorwayEdit", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{lc.editSupported ? quickCopy("doorwayEditFrom", lang) : quickCopy("doorwayNotEditable", lang)}</p>
        </section>

        {lc.endLabel ? (
          <section className={quickCard}>
            <h2 className="text-base font-extrabold">✅ {qt(lc.endLabel, lang)}</h2>
            <p className="mt-1 text-sm text-[#5D4A25]/90">{quickCopy("doorwayEndFrom", lang)}</p>
          </section>
        ) : null}

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">🔁 {lc.renewSupported && lc.renewLabel ? qt(lc.renewLabel, lang) : quickCopy("doorwayNoRenew", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{lc.renewSupported ? quickCopy("doorwayRenewFrom", lang) : lc.note ? qt(lc.note, lang) : ""}</p>
          {lc.renewSupported && lc.note ? <p className="mt-1 text-xs text-[#7A7164]">{qt(lc.note, lang)}</p> : null}
        </section>

        <section className={quickCard}>
          <h2 className="text-base font-extrabold">🙋 {quickCopy("doorwayHelp", lang)}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/90">{quickCopy("doorwayHelpBody", lang)}</p>
          <Link href={withLang("/contact", routeLang)} className={`${quickSecondaryBtn} mt-3`}>
            {quickCopy("doorwayHelp", lang)}
          </Link>
        </section>

        <Link href={quickClassifiedsChooserPath(routeLang)} className={quickSecondaryBtn}>
          ➕ {quickCopy("doorwayPublishAnother", lang)}
        </Link>
      </div>
    </QuickShell>
  );
}
