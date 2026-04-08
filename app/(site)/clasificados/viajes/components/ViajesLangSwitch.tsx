"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

function buildHref(pathname: string, sp: URLSearchParams, lang: Lang) {
  const p = new URLSearchParams(sp.toString());
  p.set("lang", lang);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : `${pathname}?lang=${lang}`;
}

export function ViajesLangSwitch({ compact }: { compact?: boolean }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const params = sp ?? new URLSearchParams();
  const current: Lang = params.get("lang") === "en" ? "en" : "es";

  const pill = (lang: Lang, label: string) => {
    const active = current === lang;
    return (
      <Link
        href={buildHref(pathname ?? "/", params, lang)}
        className={`min-h-[36px] min-w-[2.25rem] touch-manipulation rounded-full px-2.5 py-1.5 text-center text-[11px] font-bold transition ${
          active
            ? "bg-[color:var(--lx-cta-dark)] text-[#FFFCF7] shadow-sm"
            : "text-[color:var(--lx-muted)] hover:bg-[color:var(--lx-nav-hover)] hover:text-[color:var(--lx-text)]"
        }`}
        hrefLang={lang === "en" ? "en" : "es"}
        aria-current={active ? "true" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/90 p-0.5 shadow-sm backdrop-blur-sm ${compact ? "scale-95" : ""}`}
      role="group"
      aria-label={current === "en" ? "Language" : "Idioma"}
    >
      {pill("es", "ES")}
      {pill("en", "EN")}
    </div>
  );
}
