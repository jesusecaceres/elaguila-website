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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  const additionalActive = isAdditionalLanguageActive(lang);

  return (
    <div
      ref={rootRef}
      className="relative w-full min-w-0 overflow-visible rounded-2xl border border-[#C9A84A]/45 bg-black/70 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-5 md:bg-black/75"
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

          <div className="min-w-0 flex-1">
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
                "inline-flex min-h-[2.75rem] w-full items-center justify-center gap-1.5 rounded-xl px-2.5 py-2.5 text-sm font-bold transition sm:min-h-[3rem] sm:px-3",
                additionalActive
                  ? "bg-[#FFD700] text-[#1F241C] shadow-[0_0_24px_rgba(255,215,0,0.45)]"
                  : "border border-[#C9A84A]/55 bg-[#FFFDF7]/10 text-[#F8F4EA] hover:bg-[#FFFDF7]/20",
              ].join(" ")}
            >
              <span className="shrink-0" aria-hidden>
                🌐
              </span>
              <span className="min-w-0 truncate">
                {additionalActive ? (
                  <>
                    <span className="sm:hidden">{LANGUAGE_SHORT[lang]}</span>
                    <span className="hidden sm:inline">{getLanguageLabel(lang)}</span>
                  </>
                ) : (
                  "Languages"
                )}
              </span>
              <span className="shrink-0 text-[0.6rem] leading-none opacity-80" aria-hidden>
                ▾
              </span>
            </button>
          </div>
        </div>

        {dropdownOpen ? (
          <ul
            role="listbox"
            aria-label={UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER}
            className="absolute bottom-full left-1/2 z-50 mb-2.5 w-[min(20rem,calc(100vw-2rem))] max-h-[min(22.5rem,50vh)] -translate-x-1/2 overflow-y-auto overflow-x-hidden rounded-xl border border-[#C9A84A]/45 bg-[#141812]/95 py-1.5 shadow-[0_20px_48px_rgba(0,0,0,0.55)] backdrop-blur-md"
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
                      "flex w-full min-h-[2.875rem] items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold transition",
                      selected
                        ? "bg-[#FFD700]/15 text-[#FFD700]"
                        : "text-[#F8F4EA] hover:bg-[#FFFDF7]/10",
                    ].join(" ")}
                  >
                    <span className="min-w-0 leading-snug">{LANGUAGE_LABELS[code]}</span>
                    {selected ? (
                      <span
                        className="shrink-0 text-sm font-bold text-[#FFD700]"
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
