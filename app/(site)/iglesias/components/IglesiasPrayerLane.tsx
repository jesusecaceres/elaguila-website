import Image from "next/image";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";
import { IglesiasComingSoonBadge } from "./IglesiasPageShell";

const PRAYER_CARDS = [
  {
    key: "wall",
    src: "/iglesias/editorial/need-prayer.jpg",
    title: (c: IglesiasCopy) => c.prayerCardWallTitle,
    body: (c: IglesiasCopy) => c.prayerCardWallBody,
  },
  {
    key: "request",
    src: "/iglesias/editorial/need-study.jpg",
    title: (c: IglesiasCopy) => c.prayerCardRequestTitle,
    body: (c: IglesiasCopy) => c.prayerCardRequestBody,
  },
  {
    key: "network",
    src: "/iglesias/editorial/need-community.jpg",
    title: (c: IglesiasCopy) => c.prayerCardNetworkTitle,
    body: (c: IglesiasCopy) => c.prayerCardNetworkBody,
  },
] as const;

export function IglesiasPrayerLane({ copy }: { copy: IglesiasCopy }) {
  return (
    <section
      id="oracion"
      className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_24px_60px_-36px_rgba(31,36,28,0.45)]"
      aria-labelledby="iglesias-prayer-title"
    >
      <div className="border-b border-[#C9A84A]/25 bg-gradient-to-br from-[#7A1E2C] to-[#4A1420] px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#E8D7B5]">{copy.lanePrayerEyebrow}</p>
          <IglesiasComingSoonBadge label={copy.comingSoon} />
        </div>
        <h2 id="iglesias-prayer-title" className="mt-3 font-serif text-2xl font-bold leading-tight text-[#FFFCF7] sm:text-3xl">
          {copy.lanePrayerTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">{copy.lanePrayerSupport}</p>
        <p className="mt-3 max-w-2xl font-serif text-sm italic leading-relaxed text-[#E8D7B5]">{copy.lanePrayerInvite}</p>
      </div>
      <ul className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
        {PRAYER_CARDS.map((card) => (
          <li
            key={card.key}
            className="overflow-hidden rounded-2xl border border-[#D6C7AD]/80 bg-[#FAF6EE] shadow-[0_10px_28px_-22px_rgba(31,36,28,0.4)]"
          >
            <div className="relative aspect-[16/9] w-full">
              <Image src={card.src} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F241C]/55 to-transparent" aria-hidden />
              <div className="absolute left-3 top-3">
                <IglesiasComingSoonBadge label={copy.comingSoon} />
              </div>
            </div>
            <div className="px-4 py-4">
              <h3 className="font-serif text-lg font-bold text-[#1F241C]">{card.title(copy)}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{card.body(copy)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
