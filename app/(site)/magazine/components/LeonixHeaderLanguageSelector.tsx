"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADDITIONAL_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_SHORT,
  PRIMARY_LANGUAGES,
  getLanguageLabel,
  isAdditionalLanguageActive,
  languageAriaLabel,
  normalizeLang,
  UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER,
  writePersistedLangPreference,
  type SupportedLang,
} from "@/app/lib/language";
import {
  getGoogleTranslatePlacementCopy,
  getGoogleTranslateWebsitesPasteHint,
  googleTranslateWebsitesPasteHintClass,
  translateSiteHref,
} from "@/app/lib/googleTranslateWebsite";

type LeonixHeaderLanguageSelectorProps = {
  /** compact = shorter primary labels on xs; full = full Español/English on sm+ */
  variant?: "compact" | "full";
  /** Fixed path when not using current pathname (e.g. Coming Soon). */
  pathnameOverride?: string;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const pillBase =
  "inline-flex min-h-[1.875rem] shrink-0 items-center justify-center rounded-full px-2 py-1 transition-colors sm:min-h-[2rem] sm:px-2.5";
const pillActive = "bg-[#7A1E2C] text-[#FFFDF7]";
const pillIdle = "text-[#3D3428] hover:bg-[#EDE6D6]";

export function LeonixHeaderLanguageSelector({
  variant = "compact",
  pathnameOverride,
  className,
}: LeonixHeaderLanguageSelectorProps) {
  const pathnameFromHook = usePathname() ?? "";
  const pathname = pathnameOverride ?? pathnameFromHook;
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = normalizeLang(searchParams?.get("lang"));
  const isFull = variant === "full";
  const googleCopy = getGoogleTranslatePlacementCopy(lang);
  const googleTranslateHref = translateSiteHref({
    lang,
    sourcePage: pathname.replace(/^\//, "") || "site",
    sourceCta: "language_dropdown_google_translate",
    returnTo: pathname,
  });
  const websitesPasteHint = getGoogleTranslateWebsitesPasteHint(lang);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const switchLang = useCallback(
    (target: SupportedLang) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("lang", target);
      const q = next.toString();
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const nextPath = q ? `${pathname}?${q}${hash}` : `${pathname}${hash}`;
      router.replace(nextPath, { scroll: false });
      writePersistedLangPreference(target);
      setDropdownOpen(false);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dropdownOpen]);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname, searchParams?.toString()]);

  const dropdownLabel = UNIVERSAL_LANGUAGES_DROPDOWN_TRIGGER;
  const additionalActive = isAdditionalLanguageActive(lang);

  const primaryLabel = (code: (typeof PRIMARY_LANGUAGES)[number]) => {
    if (isFull) {
      return (
        <>
          <span className="hidden sm:inline">{LANGUAGE_LABELS[code]}</span>
          <span className="sm:hidden">{LANGUAGE_SHORT[code]}</span>
        </>
      );
    }
    return (
      <>
        <span className="hidden min-[380px]:inline">{LANGUAGE_LABELS[code]}</span>
        <span className="min-[380px]:hidden">{LANGUAGE_SHORT[code]}</span>
      </>
    );
  };

  const aria = languageAriaLabel(lang);

  return (
    <div
      ref={rootRef}
      className={cx(
        "flex shrink-0 items-center gap-0.5 rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 font-semibold text-[#3D3428] sm:gap-1",
        isFull ? "text-[0.6875rem] sm:text-xs" : "text-[0.6875rem] sm:text-xs",
        className
      )}
      role="group"
      aria-label={aria}
    >
      {PRIMARY_LANGUAGES.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLang(code)}
            aria-pressed={active}
            title={LANGUAGE_LABELS[code]}
            className={cx(pillBase, active ? pillActive : pillIdle)}
          >
            {primaryLabel(code)}
          </button>
        );
      })}

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          aria-label={additionalActive ? `${dropdownLabel} (${getLanguageLabel(lang)})` : dropdownLabel}
          title={dropdownLabel}
          className={cx(
            pillBase,
            "gap-0.5 border-l border-[#D6C7AD]/80 pl-1.5 sm:pl-2",
            additionalActive ? `${pillActive} ring-1 ring-[#C9A84A]/50` : pillIdle,
            "max-w-[8.5rem] truncate sm:max-w-[9.5rem]"
          )}
        >
          <span className="truncate">{dropdownLabel}</span>
          {additionalActive ? (
            <span className="sr-only">{getLanguageLabel(lang)}</span>
          ) : null}
          <span className="text-[0.6rem] leading-none opacity-80" aria-hidden>
            ▾
          </span>
        </button>

        {dropdownOpen ? (
          <ul
            role="listbox"
            aria-label={dropdownLabel}
            className="absolute right-0 top-[calc(100%+0.35rem)] z-[120] max-h-[min(70vh,22rem)] min-w-[11.5rem] overflow-y-auto overflow-x-hidden rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] py-1 shadow-[0_12px_32px_rgba(31,36,28,0.18)]"
          >
            {ADDITIONAL_LANGUAGES.map((code) => {
              const selected = lang === code;
              return (
                <li key={code} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => switchLang(code)}
                    className={cx(
                      "flex w-full min-h-[2.75rem] items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold transition",
                      selected
                        ? "bg-[#7A1E2C]/10 text-[#7A1E2C]"
                        : "text-[#1F241C] hover:bg-[#FBF7EF]"
                    )}
                  >
                    <span>{LANGUAGE_LABELS[code]}</span>
                    {selected ? (
                      <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#7A1E2C]" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
            <li role="separator" aria-hidden className="my-1 border-t border-[#D6C7AD]/80" />
            <li role="presentation" className="px-2 pb-1 pt-0.5">
              <p className="px-1 py-1.5 text-[0.65rem] leading-snug text-[#3D3428]/75 sm:text-xs">
                {googleCopy.dropdownHelper}
              </p>
              <a
                href={googleTranslateHref}
                className="flex min-h-[2.75rem] w-full items-center rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#2A4536] transition hover:bg-[#FBF7EF]"
              >
                {googleCopy.dropdownCta}
              </a>
              <p className={`px-1 ${googleTranslateWebsitesPasteHintClass}`}>{websitesPasteHint}</p>
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
