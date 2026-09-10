"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Lang } from "./businessIdentityCopy";

/**
 * ES/EN corner toggle for the Business Identity onboarding/completed pages — same
 * `router.replace(?lang=)` pattern as `AutosLandingLangSwitch.tsx`
 * (app/(site)/clasificados/autos/landing/), not a new i18n mechanism. Switching updates the URL
 * immediately, which is this app's single source of truth for the active language.
 */
export function BusinessIdentityLangSwitch({ lang, onBeforeSwitch }: { lang: Lang; onBeforeSwitch?: (next: Lang) => void }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();

  const hrefFor = useMemo(
    () => (next: Lang) => {
      const p = new URLSearchParams(sp?.toString() ?? "");
      p.set("lang", next);
      return `${pathname}?${p.toString()}`;
    },
    [pathname, sp],
  );

  function switchTo(next: Lang) {
    if (next === lang) return;
    onBeforeSwitch?.(next);
    router.replace(hrefFor(next));
  }

  return (
    <div className="inline-flex items-center rounded-full border border-[#E8DFD0] bg-white p-0.5 text-[11px] font-bold shadow-sm" role="group" aria-label="Language / Idioma">
      <button
        type="button"
        onClick={() => switchTo("es")}
        aria-current={lang === "es" ? "true" : undefined}
        className={`min-h-[32px] rounded-full px-2.5 py-1.5 transition ${lang === "es" ? "bg-[#F3EBDD] text-[#1E1810]" : "text-[#7A7164] hover:text-[#1E1810]"}`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-current={lang === "en" ? "true" : undefined}
        className={`min-h-[32px] rounded-full px-2.5 py-1.5 transition ${lang === "en" ? "bg-[#F3EBDD] text-[#1E1810]" : "text-[#7A7164] hover:text-[#1E1810]"}`}
      >
        EN
      </button>
    </div>
  );
}
