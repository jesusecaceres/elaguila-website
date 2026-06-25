"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADDITIONAL_LANGUAGES,
  PRIMARY_LANGUAGES,
  UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER,
  isAdditionalLanguageActive,
  resolveRouteLang,
  withPublicLangAndTracking,
  writePersistedLangPreference,
  type SupportedLang,
} from "@/app/lib/language";
import { ROOT_INTRO_COPY, getRootIntroCopy } from "@/app/lib/rootIntroCopy";

function langPillClass(active: boolean): string {
  return [
    "inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition sm:min-h-[3rem]",
    active
      ? "bg-[#FFD700] text-[#1F241C] shadow-[0_0_24px_rgba(255,215,0,0.45)]"
      : "border border-amber-400/55 bg-[#FFFDF7]/10 text-[#F8F4EA] hover:bg-[#FFFDF7]/20",
  ].join(" ");
}

export function RootIntroLanguagePanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = resolveRouteLang(searchParams?.get("lang"));
  const copy = getRootIntroCopy(lang);
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
      className="relative w-full min-w-0 overflow-visible rounded-2xl border border-amber-400/40 bg-black/80 p-5 shadow-2xl backdrop-blur-md sm:max-w-none md:p-7"
    >
      <p className="text-center text-sm font-semibold leading-snug text-[#F8F4EA] sm:text-base">
        {copy.heading}
      </p>

      <p
        className="mt-2 break-words text-center text-base font-bold leading-snug text-[#FFD700] sm:text-lg"
        aria-live="polite"
      >
        {copy.selectedLabel}
      </p>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        {PRIMARY_LANGUAGES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => selectLang(code)}
            aria-pressed={lang === code}
            className={langPillClass(lang === code)}
          >
            {ROOT_INTRO_COPY[code].selectedLabel}
          </button>
        ))}

        <div className="relative min-w-0 sm:col-span-1">
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-label={
              additionalActive
                ? `${UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER} (${copy.selectedLabel})`
                : UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER
            }
            className={[
              "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition",
              additionalActive
                ? "bg-[#FFD700] text-[#1F241C] shadow-[0_0_24px_rgba(255,215,0,0.45)]"
                : "border border-amber-400/55 bg-[#FFFDF7]/10 text-[#F8F4EA] hover:bg-[#FFFDF7]/20",
            ].join(" ")}
          >
            <span className="shrink-0" aria-hidden>
              🌐
            </span>
            <span className="text-center leading-snug">Languages</span>
            <span className="shrink-0 text-[0.65rem] leading-none opacity-80" aria-hidden>
              ▾
            </span>
          </button>

          {dropdownOpen ? (
            <ul
              role="listbox"
              aria-label={UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER}
              className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-[280px] max-h-[320px] overflow-y-auto overflow-x-hidden rounded-xl border border-amber-300/40 bg-black/90 py-1 shadow-2xl backdrop-blur-md sm:left-auto sm:right-0 sm:w-[min(20rem,calc(100vw-2rem))]"
            >
              {ADDITIONAL_LANGUAGES.map((code) => {
                const selected = lang === code;
                const optionCopy = ROOT_INTRO_COPY[code];
                return (
                  <li key={code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => selectLang(code)}
                      className={[
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition",
                        selected
                          ? "bg-[#FFD700]/15 text-[#FFD700]"
                          : "text-[#F8F4EA] hover:bg-[#FFFDF7]/10",
                      ].join(" ")}
                    >
                      <span className="min-w-0 break-words leading-snug">
                        {optionCopy.selectedLabel}
                      </span>
                      {selected ? (
                        <span className="shrink-0 text-sm font-bold text-[#FFD700]" aria-hidden>
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
        className="mt-5 inline-flex min-h-[3.25rem] w-full min-w-0 items-center justify-center rounded-xl bg-emerald-600 px-6 py-4 text-center text-sm font-bold text-white shadow-lg transition hover:bg-emerald-700 active:bg-emerald-800 sm:text-base"
      >
        {copy.enter}
      </Link>
    </div>
  );
}
