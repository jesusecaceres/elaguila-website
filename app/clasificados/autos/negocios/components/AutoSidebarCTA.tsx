"use client";

import { FiCalendar, FiMessageCircle, FiPhone } from "react-icons/fi";
import { TbWorldWww } from "react-icons/tb";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { formatCityStateLabel, formatUsd, hrefForUserWebsiteUrl, polishMonthlyEstimateDisplay } from "./autoDealerFormatters";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)]";

const BTN_PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99] max-lg:min-h-[52px] max-lg:text-[15px] max-lg:shadow-[0_10px_28px_-8px_rgba(26,22,18,0.5)] max-lg:ring-1 max-lg:ring-[color:var(--lx-gold-border)]/25";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-2 text-center text-[13px] font-semibold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] sm:px-3 sm:text-sm active:scale-[0.99] max-lg:min-h-[46px] max-lg:gap-1.5 max-lg:px-2.5 max-lg:text-[12px] max-lg:leading-snug";

const BTN_TERTIARY =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[color:var(--lx-gold-border)]/90 bg-[color:var(--lx-section)] px-3 text-sm font-semibold text-[color:var(--lx-text-2)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] max-lg:min-h-[50px] max-lg:border-[color:var(--lx-gold-border)] max-lg:bg-[#FFFCF7]";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function AutoSidebarCTA({ data, className }: { data: AutoDealerListing; className?: string }) {
  const { t } = useAutosNegociosPreviewCopy();
  const sb = t.preview.sidebar;

  const loc = formatCityStateLabel(data.city, data.state);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const monthlyLine = nonEmpty(data.monthlyEstimate ?? undefined)
    ? polishMonthlyEstimateDisplay(data.monthlyEstimate ?? undefined)
    : "";
  const showPriceBlock = priceOk || nonEmpty(monthlyLine) || nonEmpty(loc);

  return (
    <div className={`${CARD} ${className ?? ""}`}>
      {showPriceBlock ? (
        <div className="border-b border-[color:var(--lx-nav-border)] pb-4 max-lg:border-[color:var(--lx-nav-border)]/70 max-lg:pb-5">
          {priceOk ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)] max-lg:text-[11px] max-lg:tracking-[0.16em]">
                {sb.priceAdvertised}
              </p>
              <p className="mt-1 text-[1.85rem] font-bold leading-none tracking-tight text-[color:var(--lx-text)] max-lg:mt-1.5 max-lg:text-[2.05rem] max-lg:tracking-tight">
                {formatUsd(data.price)}
              </p>
            </>
          ) : null}
          {nonEmpty(monthlyLine) ? (
            <p
              className={`text-sm font-semibold text-[color:var(--lx-text-2)] max-lg:text-[15px] ${priceOk ? "mt-2" : ""}`}
            >
              {monthlyLine}
            </p>
          ) : null}
          {nonEmpty(loc) ? (
            <p className={`text-sm max-lg:text-[15px] ${priceOk || nonEmpty(monthlyLine) ? "mt-3" : ""}`}>
              <span className="font-semibold text-[color:var(--lx-text-2)] max-lg:text-[color:var(--lx-text)]">{loc}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`flex flex-col gap-3 max-lg:gap-3.5 ${showPriceBlock ? "mt-4 max-lg:mt-5" : ""}`}>
        <button type="button" className={BTN_PRIMARY}>
          {sb.availability}
        </button>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 max-lg:grid-cols-3 max-lg:gap-2">
          <button type="button" className={BTN_SECONDARY}>
            <FiPhone className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {sb.call}
          </button>
          <button type="button" className={BTN_SECONDARY}>
            <FiMessageCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {sb.chat}
          </button>
          <button type="button" className={BTN_SECONDARY}>
            <FiCalendar className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="max-[380px]:[font-size:11px]">{sb.scheduleDrive}</span>
          </button>
        </div>
        {nonEmpty(data.dealerWebsite ?? undefined) ? (
          <a
            href={hrefForUserWebsiteUrl(data.dealerWebsite) ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={BTN_TERTIARY}
          >
            <TbWorldWww className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {sb.viewWebsite}
          </a>
        ) : null}
      </div>
    </div>
  );
}
