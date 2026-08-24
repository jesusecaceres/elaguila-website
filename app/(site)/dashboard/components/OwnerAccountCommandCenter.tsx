"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";
import { accountCommandCenterCopy, type Lang } from "../lib/dashboardI18n";

export function OwnerAccountCommandCenter({
  lang,
  q,
  userName,
  homeCity,
  children,
}: {
  lang: Lang;
  q: string;
  userName: string | null;
  homeCity: string | null;
  children: ReactNode;
}) {
  const t = accountCommandCenterCopy(lang);
  const firstName = userName?.trim().split(/\s+/)[0] || null;

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden xl:gap-8">
      <header className={LX_DASH.pageHero}>
        <p className={LX_DASH.contextLabel}>{t.eyebrow}</p>
        <h1 className={`mt-2 ${LX_DASH.pageTitle}`}>{firstName ? t.greetingNamed(firstName) : t.greetingAnon}</h1>
        <p className={`mt-2 max-w-2xl ${LX_DASH.bodyMuted}`}>{t.subtitle}</p>
        {homeCity ? (
          <p className="mt-3 inline-flex rounded-full border border-[#C9A84A]/35 bg-[#FBF7EF]/90 px-3 py-1 text-xs font-semibold text-[#5C5346]">
            {lang === "es" ? "Ciudad" : "City"}: {homeCity}
          </p>
        ) : null}
        <div className="mt-5">
          <Link href={`/publicar?${q}`} className={`${LX_DASH.btnPrimary} min-h-[44px] w-full sm:w-auto`}>
            {t.publish}
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
