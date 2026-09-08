import Image from "next/image";
import Link from "next/link";
import { IGLESIAS_NEED_CATALOG, type IglesiasNeedKey } from "@/app/lib/iglesias/taxonomy";
import { iglesiasVisibleNeedImageSrc } from "@/app/lib/iglesias/images";
import { buildIglesiasHref, emptyIglesiasBrowseState } from "@/app/lib/iglesias/queryParams";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";

export function IglesiasNeedTiles({ copy, lang }: { copy: IglesiasCopy; lang: "es" | "en" }) {
  const tiles = IGLESIAS_NEED_CATALOG.filter((n) => n.landingTile);

  return (
    <section
      className="overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-7 shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)] sm:px-7 sm:py-8"
      aria-labelledby="iglesias-need-title"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.needSectionEyebrow}</p>
      <h2 id="iglesias-need-title" className="mt-2 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
        {copy.needSectionTitle}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#3D3428]">{copy.needSectionSupport}</p>
      <p className="mt-1 text-xs text-[#7A7164]">{copy.needNavNote}</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => {
          const href =
            tile.key === "PRAYER"
              ? `/iglesias?lang=${lang}#oracion`
              : buildIglesiasHref({ ...emptyIglesiasBrowseState(), need: tile.key as IglesiasNeedKey }, lang, "iglesias");
          const src = iglesiasVisibleNeedImageSrc(tile.key);
          return (
            <li key={tile.key}>
              <Link
                href={href}
                className="group relative flex min-h-[10.5rem] flex-col overflow-hidden rounded-2xl border border-[#D6C7AD]/80 bg-[#1F241C] shadow-[0_12px_28px_-22px_rgba(31,36,28,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C] focus-visible:ring-offset-2"
              >
                <div className="absolute inset-0">
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                      className="object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,#F7F0E2_0%,#E8D7B5_55%,#D4C08A_100%)]" aria-hidden />
                  )}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#1F241C] via-[#1F241C]/35 to-[#1F241C]/10"
                    aria-hidden
                  />
                </div>
                <span className="relative mt-auto px-3 pb-3.5 pt-16 text-sm font-semibold leading-snug text-[#FFFCF7] sm:px-4 sm:text-[0.95rem]">
                  {lang === "en" ? tile.labelEn : tile.labelEs}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
