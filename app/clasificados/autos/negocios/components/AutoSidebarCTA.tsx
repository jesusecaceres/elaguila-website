import { FiCalendar, FiMessageCircle, FiPhone } from "react-icons/fi";
import { TbWorldWww } from "react-icons/tb";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { formatCityStateLabel, formatUsd, hrefForUserWebsiteUrl, polishMonthlyEstimateDisplay } from "./autoDealerFormatters";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)]";

const BTN_PRIMARY =
  "inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)]";

const BTN_SECONDARY =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-2 text-center text-[13px] font-semibold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] sm:px-3 sm:text-sm";

const BTN_TERTIARY =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-3 text-sm font-semibold text-[color:var(--lx-text-2)] transition hover:bg-[color:var(--lx-nav-hover)]";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function AutoSidebarCTA({ data }: { data: AutoDealerListing }) {
  const loc = formatCityStateLabel(data.city, data.state);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const monthlyLine = nonEmpty(data.monthlyEstimate ?? undefined)
    ? polishMonthlyEstimateDisplay(data.monthlyEstimate ?? undefined)
    : "";
  const showPriceBlock = priceOk || nonEmpty(monthlyLine) || nonEmpty(loc);

  return (
    <div className={CARD}>
      {showPriceBlock ? (
        <div className="border-b border-[color:var(--lx-nav-border)] pb-4">
          {priceOk ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">Precio anunciado</p>
              <p className="mt-1 text-[1.85rem] font-bold leading-none tracking-tight text-[color:var(--lx-text)]">
                {formatUsd(data.price)}
              </p>
            </>
          ) : null}
          {nonEmpty(monthlyLine) ? (
            <p className={`text-sm font-semibold text-[color:var(--lx-text-2)] ${priceOk ? "mt-2" : ""}`}>{monthlyLine}</p>
          ) : null}
          {nonEmpty(loc) ? (
            <p className={`text-sm ${priceOk || nonEmpty(monthlyLine) ? "mt-3" : ""}`}>
              <span className="font-semibold text-[color:var(--lx-text-2)]">{loc}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={`flex flex-col gap-3 ${showPriceBlock ? "mt-4" : ""}`}>
        <button type="button" className={BTN_PRIMARY}>
          Solicitar disponibilidad
        </button>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button type="button" className={BTN_SECONDARY}>
            <FiPhone className="h-[18px] w-[18px] shrink-0" aria-hidden />
            Llamar
          </button>
          <button type="button" className={BTN_SECONDARY}>
            <FiMessageCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
            Chatear
          </button>
          <button type="button" className={BTN_SECONDARY}>
            <FiCalendar className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="max-[380px]:[font-size:11px]">Agendar prueba de manejo</span>
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
            Ver sitio web
          </a>
        ) : null}
      </div>
    </div>
  );
}
