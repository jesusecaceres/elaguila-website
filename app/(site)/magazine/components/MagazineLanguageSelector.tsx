"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  MAGAZINE_UI,
  resolveMagazineLang,
  type MagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";

const LANG_CODES: MagazineLang[] = ["es", "en", "vi"];

type MagazineLanguageSelectorProps = {
  /** Base path without query string, e.g. /magazine or /magazine/2026/june/read */
  basePath: string;
  className?: string;
};

export function MagazineLanguageSelector({ basePath, className }: MagazineLanguageSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = resolveMagazineLang(searchParams?.get("lang"));
  const ui = MAGAZINE_UI[lang];

  const selectLang = (code: MagazineLang) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("lang", code);
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
        {ui.languageEyebrow}
      </p>
      <p className="mt-2 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
        {ui.originalMagazineLabel}
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {ui.languageChooserHint}
      </p>
      <div
        className="mt-5 flex flex-wrap gap-2"
        role="group"
        aria-label={ui.languageEyebrow}
      >
        {LANG_CODES.map((code) => {
          const active = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => selectLang(code)}
              aria-pressed={active}
              className={
                active
                  ? "inline-flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFDF7] shadow-[0_8px_20px_-8px_rgba(122,30,44,0.45)] sm:flex-none sm:px-5"
                  : "inline-flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center rounded-full border-2 border-[#D6C7AD] bg-[#FFFDF7] px-4 py-2 text-sm font-bold text-[#1F241C] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] sm:flex-none sm:px-5"
              }
            >
              {ui.langLabels[code]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
