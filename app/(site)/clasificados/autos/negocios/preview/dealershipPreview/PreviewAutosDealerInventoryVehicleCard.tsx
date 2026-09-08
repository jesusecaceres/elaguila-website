"use client";

import Image from "next/image";
import Link from "next/link";
import { FiChevronRight, FiMapPin } from "react-icons/fi";
import { formatCityStateLabel, formatMiles, formatUsd } from "../../components/autoDealerFormatters";
import { withLangParam } from "../../lib/autosNegociosLang";
import type { AutosNegociosLang } from "../../lib/autosNegociosLang";
import {
  autosRelatedInventoryAvailableAfterPublish,
  autosRelatedInventoryDraftCardLabel,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { trackAutosResultCardClick } from "../../../lib/autosCtaTracking";
import { autosPreviewQuietDraftLabelClass } from "./previewPremiumTokens";

export type PreviewAutosDealerInventoryVehicleCardRow = {
  id: string;
  imageUrl: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  city?: string;
  state?: string;
  href: string;
};

const RESULT_CARD =
  "group flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-[#D6C7AD]/80 bg-[#FFFDF7] shadow-[0_10px_28px_-16px_rgba(31,36,28,0.12)] transition-all duration-200";

const RESULT_CARD_INTERACTIVE =
  "hover:border-[#C9A84A] hover:shadow-[0_14px_32px_-18px_rgba(31,36,28,0.18)] active:opacity-95";

function isDraftPreviewHref(href: string): boolean {
  const h = href.trim();
  return h.startsWith("#") || h.includes("draft-preview");
}

export function PreviewAutosDealerInventoryVehicleCard({
  car,
  lang,
  ctaLabel,
  previewOnly = false,
}: {
  car: PreviewAutosDealerInventoryVehicleCardRow;
  lang: AutosNegociosLang;
  ctaLabel: string;
  previewOnly?: boolean;
}) {
  const title = `${new Intl.NumberFormat("en-US").format(car.year)} ${car.make} ${car.model}${car.trim ? ` ${car.trim}` : ""}`;
  const loc = formatCityStateLabel(car.city, car.state);
  const href = car.href.startsWith("/") ? withLangParam(car.href, lang) : car.href;
  const heroSrc = car.imageUrl?.trim() ?? "";
  const readOnlyDraft = previewOnly || isDraftPreviewHref(car.href);

  const body = (
    <>
      <div className="relative w-full overflow-hidden bg-[#F3EEE4] aspect-[4/3]">
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt={title}
            fill
            className={`object-cover transition duration-300 ${readOnlyDraft ? "" : "group-hover:scale-[1.03]"}`}
            sizes="(max-width:640px) 78vw, 280px"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-[#F3EEE4] text-sm font-semibold tracking-wide text-[#8A8074]"
            aria-hidden
          >
            Autos
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
        {readOnlyDraft ? (
          <p className={autosPreviewQuietDraftLabelClass}>{autosRelatedInventoryDraftCardLabel(lang)}</p>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug tracking-tight text-[#1F241C]">
          {title}
        </h3>
        <p className="text-xl font-extrabold tabular-nums text-[#7A1E2C]">{formatUsd(car.price)}</p>
        <div className="flex items-center gap-2 text-sm text-[#5C5346]">
          {loc ? (
            <>
              <FiMapPin className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
              <span className="truncate">{loc}</span>
              <span className="text-[#8A8074]">•</span>
            </>
          ) : null}
          <span>{formatMiles(car.mileage)} {lang === "es" ? "millas" : "miles"}</span>
        </div>
        {readOnlyDraft ? (
          <span
            className="mt-auto inline-flex min-h-[40px] w-full cursor-default items-center justify-center rounded-[10px] border border-[#D6C7AD]/70 bg-[#FBF7EF] px-3 text-[11px] font-semibold text-[#8A8074]"
            aria-disabled="true"
            data-autos-related-inventory-draft-cta="1"
          >
            {autosRelatedInventoryAvailableAfterPublish(lang)}
          </span>
        ) : (
          <span className="mt-auto inline-flex min-h-[40px] w-full items-center justify-center gap-1 rounded-[10px] border border-[#7A1E2C]/35 bg-[#FFFCF7] px-3 text-[12px] font-bold text-[#7A1E2C] transition group-hover:border-[#7A1E2C]">
            {ctaLabel}
            <FiChevronRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  return (
    <article
      className={`${RESULT_CARD} h-full ${readOnlyDraft ? "" : RESULT_CARD_INTERACTIVE}`}
      data-autos-related-inventory-draft={readOnlyDraft ? "1" : undefined}
    >
      {readOnlyDraft ? (
        <div className="flex min-h-0 flex-1 flex-col" aria-disabled="true">
          {body}
        </div>
      ) : (
        <Link
          href={href}
          className="flex min-h-0 flex-1 flex-col"
          onClick={() => trackAutosResultCardClick({ id: car.id, lane: "negocios" })}
        >
          {body}
        </Link>
      )}
    </article>
  );
}
