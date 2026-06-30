"use client";

import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { brRelatedAgentPropertiesCopy } from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import type { BrPropertyInventoryLang } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brAnalyticsContextFromListing,
  trackBrResultCardClickGlobal,
} from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";

const SECTION =
  "rounded-[20px] border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)] sm:p-5";

export function RelatedBrAgentProperties({
  listings,
  lang,
  groupId,
  brokerage = false,
}: {
  listings: BrNegocioListing[];
  lang: BrPropertyInventoryLang;
  groupId?: string | null;
  brokerage?: boolean;
}) {
  const copy = brRelatedAgentPropertiesCopy(lang, { brokerage });
  if (!listings.length) return null;

  const resultsHref = `/clasificados/bienes-raices/resultados?lang=${lang}${
    groupId ? `&inventoryGroup=${encodeURIComponent(groupId)}` : ""
  }`;

  return (
    <section className={SECTION} aria-labelledby="br-related-agent-properties-title">
      <div>
        <h2 id="br-related-agent-properties-title" className="text-lg font-bold tracking-tight text-[#1E1810]">
          {copy.title}
        </h2>
        <p className="mt-1 text-sm text-[#5C5346]">{copy.subtitle}</p>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((item) => (
          <article
            key={item.id}
            className="flex flex-col overflow-hidden rounded-[14px] border border-[#E8DFD0] bg-white shadow-sm"
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </div>
            <div className="flex flex-1 flex-col p-3 sm:p-4">
              <p className="text-lg font-bold text-[#1E1810]">{item.price}</p>
              <h3 className="mt-1 text-sm font-bold leading-snug text-[#2A2620]">{item.title}</h3>
              <p className="mt-1 text-xs font-medium text-[#5C5346]">{item.addressLine}</p>
              {(item.beds !== "—" || item.baths !== "—") && (
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
                  {[item.beds !== "—" ? `${item.beds} bd` : null, item.baths !== "—" ? `${item.baths} ba` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <Link
                href={`${leonixLiveAnuncioPath(item.id)}?lang=${lang}`}
                onClick={() => trackBrResultCardClickGlobal(brAnalyticsContextFromListing(item))}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FAF7F2]"
              >
                {copy.viewProperty}
                <FiChevronRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {listings.length >= 2 ? (
        <Link
          href={resultsHref}
          className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-[#FFF6E7] px-4 text-sm font-bold text-[#6E5418] sm:w-auto"
        >
          {copy.viewAll}
        </Link>
      ) : null}
    </section>
  );
}
