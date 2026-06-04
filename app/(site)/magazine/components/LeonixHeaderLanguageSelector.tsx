"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LEONIX_LANG_CODES,
  LEONIX_LANG_LABELS,
  LEONIX_LANG_SHORT,
  leonixLangAria,
  resolveLeonixSiteLang,
  type LeonixSiteLang,
} from "@/app/lib/lang";

type LeonixHeaderLanguageSelectorProps = {
  /** compact = ES/EN/VI pills; full = Español / English / Tiếng Việt on sm+ */
  variant?: "compact" | "full";
  /** Fixed path when not using current pathname (e.g. Coming Soon). */
  pathnameOverride?: string;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function LeonixHeaderLanguageSelector({
  variant = "compact",
  pathnameOverride,
  className,
}: LeonixHeaderLanguageSelectorProps) {
  const pathnameFromHook = usePathname() ?? "";
  const pathname = pathnameOverride ?? pathnameFromHook;
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = resolveLeonixSiteLang(searchParams?.get("lang"));

  const switchLang = (target: LeonixSiteLang) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("lang", target);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const aria = leonixLangAria(lang);
  const isFull = variant === "full";

  return (
    <div
      className={cx(
        "flex shrink-0 rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 font-semibold text-[#3D3428]",
        isFull ? "text-[0.6875rem] sm:text-xs" : "text-[0.6875rem] sm:text-xs",
        className
      )}
      role="group"
      aria-label={aria}
    >
      {LEONIX_LANG_CODES.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchLang(code)}
            aria-pressed={active}
            title={LEONIX_LANG_LABELS[code]}
            className={cx(
              "rounded-full transition-colors",
              isFull
                ? "min-h-[1.875rem] px-2 py-1 sm:min-h-[2rem] sm:px-2.5"
                : "min-h-[1.875rem] px-2 py-1 sm:min-h-[2rem] sm:px-2.5",
              isFull ? "min-w-[2.75rem] sm:min-w-0" : "min-w-[2.35rem] sm:min-w-[2.75rem]",
              active ? "bg-[#7A1E2C] text-[#FFFDF7]" : "text-[#3D3428] hover:bg-[#EDE6D6]"
            )}
          >
            {isFull ? (
              <>
                <span className="hidden sm:inline">{LEONIX_LANG_LABELS[code]}</span>
                <span className="sm:hidden">{LEONIX_LANG_SHORT[code]}</span>
              </>
            ) : (
              LEONIX_LANG_SHORT[code]
            )}
          </button>
        );
      })}
    </div>
  );
}
