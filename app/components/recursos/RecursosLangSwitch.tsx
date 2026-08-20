"use client";

/**
 * Recursos-specific language switcher — same `?lang=` query-param strategy already proven at
 * `app/(site)/clasificados/viajes/components/ViajesLangSwitch.tsx`. No route-segment locale.
 */
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { normalizeLang, navCopyLang, type SupportedLang } from "@/app/lib/language";

function buildHref(pathname: string, sp: URLSearchParams, lang: SupportedLang) {
  const p = new URLSearchParams(sp.toString());
  p.set("lang", lang);
  return `${pathname}?${p.toString()}`;
}

export function RecursosLangSwitch({ compact }: { compact?: boolean }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const params = sp ?? new URLSearchParams();
  const current = navCopyLang(normalizeLang(params.get("lang")));

  const pill = (lang: "es" | "en", label: string) => {
    const active = current === lang;
    return (
      <Link
        href={buildHref(pathname ?? "/recursos-comunitarios", params, lang)}
        className={`min-h-[36px] min-w-[2.25rem] touch-manipulation rounded-full px-2.5 py-1.5 text-center text-[11px] font-bold transition ${
          active ? "bg-[#2A4536] text-[#FFFDF7] shadow-sm" : "text-[#3D3428]/70 hover:bg-[#F4EFE1] hover:text-[#1F241C]"
        }`}
        hrefLang={lang}
        aria-current={active ? "true" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full border border-[#D6C7AD] bg-[#FFFDF7]/90 p-0.5 shadow-sm backdrop-blur-sm ${compact ? "scale-95" : ""}`}
      role="group"
      aria-label={current === "en" ? "Language" : "Idioma"}
    >
      {pill("es", "ES")}
      {pill("en", "EN")}
    </div>
  );
}
