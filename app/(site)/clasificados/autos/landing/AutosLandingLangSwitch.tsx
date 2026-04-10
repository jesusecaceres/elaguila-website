"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";

export function AutosLandingLangSwitch({ lang }: { lang: AutosPublicLang }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const hrefEs = useMemo(() => {
    const p = new URLSearchParams(sp?.toString() ?? "");
    p.set("lang", "es");
    return `${pathname}?${p.toString()}`;
  }, [pathname, sp]);

  const hrefEn = useMemo(() => {
    const p = new URLSearchParams(sp?.toString() ?? "");
    p.set("lang", "en");
    return `${pathname}?${p.toString()}`;
  }, [pathname, sp]);

  return (
    <div
      className="inline-flex items-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-0.5 text-[11px] font-bold shadow-sm"
      role="group"
      aria-label="Language"
    >
      <Link
        href={hrefEs}
        className={`rounded-full px-2.5 py-1.5 transition ${
          lang === "es" ? "bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]" : "text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]"
        }`}
        aria-current={lang === "es" ? "true" : undefined}
      >
        ES
      </Link>
      <Link
        href={hrefEn}
        className={`rounded-full px-2.5 py-1.5 transition ${
          lang === "en" ? "bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]" : "text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)]"
        }`}
        aria-current={lang === "en" ? "true" : undefined}
      >
        EN
      </Link>
    </div>
  );
}
