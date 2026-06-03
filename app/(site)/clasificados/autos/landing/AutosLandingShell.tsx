import type { ReactNode } from "react";
import { CATEGORY_STANDARD_PAGE_BG } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";

/** Autos landing — cream Leonix shell without full-bleed scenic band (CAT-STD-ALL). */
export function AutosLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className={`relative ${CATEGORY_STANDARD_PAGE_BG} text-[#1F241C]`}>
      <div className="relative z-[1] mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </div>
    </div>
  );
}
