"use client";

import type { ReactNode } from "react";

type Props = {
  lang: "es" | "en";
  title: string;
  priceLine: string;
  negotiable?: boolean;
  statusLine?: string;
  /** Condition, category, city/ZIP — shown as one tidy line. */
  metadataParts?: string[];
  primaryCta?: { label: string; onClick: () => void; disabled?: boolean; title?: string };
  engagementRow?: ReactNode;
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function EnVentaListingHero({
  lang,
  title,
  priceLine,
  negotiable = false,
  statusLine,
  metadataParts = [],
  primaryCta,
  engagementRow,
}: Props) {
  const negotiableLabel = lang === "es" ? "Precio negociable" : "Negotiable price";
  const meta = metadataParts.filter(Boolean);

  return (
    <header className="text-left">
      <h1 className="font-serif text-[1.65rem] font-bold leading-tight tracking-tight text-[#1E1810] sm:text-[1.9rem]">
        {title}
      </h1>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[1.75rem] font-bold leading-none tracking-tight text-[#1E1810] sm:text-[2rem]">{priceLine}</p>
        {negotiable ? (
          <span className="rounded-md border border-[#C9B46A]/50 bg-[#FBF7EF] px-2 py-0.5 text-xs font-semibold text-[#5C4E2E]">
            {negotiableLabel}
          </span>
        ) : null}
      </div>

      {statusLine ? (
        <p className="mt-2 text-xs font-medium tracking-wide text-[#7A7164]">{statusLine}</p>
      ) : null}

      {meta.length > 0 ? (
        <p className="mt-3 text-sm leading-snug text-[#5C5346]">{meta.join(" · ")}</p>
      ) : null}

      {primaryCta ? (
        <button
          type="button"
          disabled={primaryCta.disabled}
          title={primaryCta.title}
          onClick={primaryCta.onClick}
          className={cx(
            "mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-bold transition sm:w-auto sm:min-w-[12rem]",
            primaryCta.disabled
              ? "cursor-not-allowed border border-[#E8DFD0] bg-[#EFEAE0] text-[#7A7164]"
              : "border border-[#7A1E2C]/20 bg-[#7A1E2C] text-[#FFFCF7] shadow-sm hover:bg-[#631824]"
          )}
        >
          {primaryCta.label}
        </button>
      ) : null}

      {engagementRow ? <div className="mt-4 flex flex-wrap items-center gap-2">{engagementRow}</div> : null}
    </header>
  );
}
