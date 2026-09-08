import Image from "next/image";
import Link from "next/link";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";
import type { PublicChurchCard } from "@/app/lib/iglesias/types";
import { IGLESIAS_NEUTRAL_FALLBACK } from "@/app/lib/iglesias/images";
import { IglesiasChurchCard } from "./IglesiasChurchCard";

export function IglesiasDiscovery({
  copy,
  lang,
  churches,
  hasFilters,
  churchHref,
}: {
  copy: IglesiasCopy;
  lang: "es" | "en";
  churches: PublicChurchCard[];
  hasFilters: boolean;
  churchHref: string;
}) {
  const empty = churches.length === 0;

  return (
    <section
      id="iglesias"
      className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)]"
      aria-labelledby="iglesias-discovery-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#C9A84A]/25 bg-[#FAF6EE] px-5 py-5 sm:px-7">
        <h2 id="iglesias-discovery-title" className="font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.discoveryTitle}
        </h2>
        {!empty ? <p className="text-sm font-semibold text-[#5C5346]">{copy.discoveryCount(churches.length)}</p> : null}
      </div>

      {empty ? (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative min-h-[12rem] lg:min-h-full">
            <Image
              src={IGLESIAS_NEUTRAL_FALLBACK.src}
              alt={copy.editorialImageNote}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[#1F241C]/25" aria-hidden />
          </div>
          <div className="px-5 py-7 sm:px-7 sm:py-8">
            <p className="font-serif text-xl font-bold text-[#1F241C] sm:text-2xl">
              {hasFilters ? copy.discoveryFilteredEmpty : copy.discoveryEmpty}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#3D3428]">{copy.discoveryEmptySupport}</p>
            <Link
              href={churchHref}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
            >
              {copy.churchCtaButton}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-3">
          {churches.map((church) => (
            <li key={church.id}>
              <IglesiasChurchCard church={church} copy={copy} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
