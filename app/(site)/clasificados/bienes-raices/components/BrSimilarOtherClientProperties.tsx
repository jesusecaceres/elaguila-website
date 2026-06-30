"use client";

import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { brSimilarOtherClientPropertiesCopy } from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import type { BrPropertyInventoryLang } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brAnalyticsContextFromListing,
  trackBrSimilarListingClickGlobal,
} from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";

const SECTION =
  "rounded-[20px] border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)] sm:p-5";

export function BrSimilarOtherClientProperties({
  listings,
  lang,
  loading,
  sourceListingId,
}: {
  listings: BrNegocioListing[];
  lang: BrPropertyInventoryLang;
  loading?: boolean;
  sourceListingId: string;
}) {
  const copy = brSimilarOtherClientPropertiesCopy(lang);

  if (!loading && !listings.length) return null;

  return (
    <section className={SECTION} aria-labelledby="br-similar-other-client-title">
      <div>
        <h2 id="br-similar-other-client-title" className="text-lg font-bold tracking-tight text-[#1E1810]">
          {copy.title}
        </h2>
        <p className="mt-1 text-sm text-[#5C5346]">{copy.subtitle}</p>
      </div>
      {loading ? (
        <p className="mt-5 text-sm text-[#7A7164]">{copy.loading}</p>
      ) : (
        <>
          <div className="-mx-1 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {listings.map((item) => (
              <article
                key={item.id}
                className="min-w-[min(88vw,280px)] shrink-0 snap-start sm:min-w-0 sm:shrink"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[#E8DFD0] bg-white shadow-sm">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 88vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <p className="text-lg font-bold text-[#1E1810]">{item.price}</p>
                    <h3 className="mt-1 text-sm font-bold leading-snug text-[#2A2620]">{item.title}</h3>
                    <p className="mt-1 text-xs font-medium text-[#5C5346]">{item.addressLine}</p>
                    <Link
                      href={`${leonixLiveAnuncioPath(item.id)}?lang=${lang}`}
                      onClick={() =>
                        trackBrSimilarListingClickGlobal(
                          brAnalyticsContextFromListing(item),
                          sourceListingId,
                        )
                      }
                      className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FAF7F2]"
                    >
                      {copy.viewProperty}
                      <FiChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Link
            href={`/clasificados/bienes-raices/resultados?lang=${lang}`}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-[#FFF6E7] px-4 text-sm font-bold text-[#6E5418] sm:w-auto"
          >
            {copy.browseAll}
          </Link>
        </>
      )}
    </section>
  );
}
