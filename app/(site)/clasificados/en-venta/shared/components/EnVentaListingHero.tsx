"use client";

import type { ReactNode } from "react";
import { EN_VENTA_TYPO } from "../styles/enVentaTypography";

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
      <h1 className={EN_VENTA_TYPO.listingTitle}>{title}</h1>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className={EN_VENTA_TYPO.listingPrice}>{priceLine}</p>
        {negotiable ? (
          <span className={EN_VENTA_TYPO.negotiableChip}>{negotiableLabel}</span>
        ) : null}
      </div>

      {statusLine ? (
        <p className={`mt-2 ${EN_VENTA_TYPO.listingStatus}`}>{statusLine}</p>
      ) : null}

      {meta.length > 0 ? (
        <p className={`mt-3 ${EN_VENTA_TYPO.listingMeta}`}>{meta.join(" · ")}</p>
      ) : null}

      {primaryCta ? (
        <button
          type="button"
          disabled={primaryCta.disabled}
          title={primaryCta.title}
          onClick={primaryCta.onClick}
          className={cx(
            `mt-4 ${EN_VENTA_TYPO.primaryCta}`,
            primaryCta.disabled
              ? "cursor-not-allowed border border-[#E8DFD0] bg-[#EFEAE0] text-[#7A7164]"
              : "border border-[#7A1E2C]/20 bg-[#7A1E2C] text-[#FFFCF7] shadow-sm hover:bg-[#631824]"
          )}
        >
          {primaryCta.label}
        </button>
      ) : null}

      {engagementRow ? <div className={`mt-4 ${EN_VENTA_TYPO.engagementWrap}`}>{engagementRow}</div> : null}
    </header>
  );
}
