"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADDITIONAL_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_SHORT,
  PRIMARY_LANGUAGES,
  UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER,
  getLanguageLabel,
  isAdditionalLanguageActive,
  resolveRouteLang,
  withPublicLangAndTracking,
  writePersistedLangPreference,
  type SupportedLang,
} from "@/app/lib/language";

function enterLabel(lang: SupportedLang): string {
  return lang === "es" ? "Entrar a Leonix" : "Enter Leonix";
}

function langPillClass(active: boolean): string {
  return [
    "inline-flex min-h-[2.75rem] min-w-[5.5rem] flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition sm:min-h-[3rem] sm:text-[0.9375rem]",
    active
      ? "bg-[#FFD700] text-[#1F241C] shadow-[0_0_24px_rgba(255,215,0,0.45)]"
      : "border border-[#C9A84A]/55 bg-[#FFFDF7]/10 text-[#F8F4EA] hover:bg-[#FFFDF7]/20",
  ].join(" ");
}

export function RootIntroLanguagePanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = resolveRouteLang(searchParams?.get("lang"));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const enterHref = withPublicLangAndTracking("/coming-soon-v2", {
    lang,
    sourcePage: "root_intro",
    sourceCta: "enter_site",
  });

  const selectLang = useCallback(
    (target: SupportedLang) => {
      router.replace(`/?lang=${target}`, { scroll: false });
      writePersistedLangPreference(target);
      setDropdownOpen(false);
    },
    [router],
  );

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dropdownOpen]);

  const additionalActive = isAdditionalLanguageActive(lang);

  return (
    <div
      ref={rootRef}
      className="w-full min-w-0 rounded-2xl border border-[#C9A84A]/45 bg-black/70 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-5 md:bg-black/75"
    >
        <p className="text-center text-xs font-semibold leading-snug text-[#F8F4EA] sm:text-sm">
          Elige tu idioma / Choose your language
        </p>

        <div className="mt-3 flex min-w-0 gap-2">
          {PRIMARY_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => selectLang(code)}
              aria-pressed={lang === code}
              className={langPillClass(lang === code)}
            >
              <span className="hidden sm:inline">{LANGUAGE_LABELS[code]}</span>
              <span className="sm:hidden">{LANGUAGE_SHORT[code]}</span>
            </button>
          ))}

          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              aria-label={
                additionalActive
                  ? `${UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER} (${getLanguageLabel(lang)})`
                  : UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER
              }
              className={[
                "inline-flex min-h-[2.75rem] w-full items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm font-bold transition sm:min-h-[3rem]",
                additionalActive
                  ? "bg-[#FFD700] text-[#1F241C] shadow-[0_0_24px_rgba(255,215,0,0.45)]"
                  : "border border-[#C9A84A]/55 bg-[#FFFDF7]/10 text-[#F8F4EA] hover:bg-[#FFFDF7]/20",
              ].join(" ")}
            >
              <span className="truncate">{UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER}</span>
              <span className="text-[0.6rem] leading-none opacity-80" aria-hidden>
                ▾
              </span>
            </button>

            {dropdownOpen ? (
              <ul
                role="listbox"
                aria-label={UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER}
                className="absolute bottom-[calc(100%+0.35rem)] left-0 right-0 z-30 max-h-[min(50vh,16rem)] overflow-y-auto rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
              >
                {ADDITIONAL_LANGUAGES.map((code) => {
                  const selected = lang === code;
                  return (
                    <li key={code} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => selectLang(code)}
                        className={[
                          "flex w-full min-h-[2.75rem] items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold transition",
                          selected
                            ? "bg-[#7A1E2C]/10 text-[#7A1E2C]"
                            : "text-[#1F241C] hover:bg-[#FBF7EF]",
                        ].join(" ")}
                      >
                        <span>{LANGUAGE_LABELS[code]}</span>
                        {selected ? (
                          <span
                            className="text-[0.65rem] font-bold uppercase tracking-wide text-[#7A1E2C]"
                            aria-hidden
                          >
                            ✓
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>

        <Link
          href={enterHref}
          onClick={() => writePersistedLangPreference(lang)}
          className="mt-4 inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-xl bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.65)] transition hover:bg-[#5e1721] sm:min-h-[3.125rem] sm:text-base"
        >
          {enterLabel(lang)}
        </Link>
    </div>
  );
}
