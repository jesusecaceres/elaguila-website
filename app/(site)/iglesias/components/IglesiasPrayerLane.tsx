import type { IglesiasCopy } from "@/app/lib/iglesias/copy";
import type { PrayerPublicCard } from "@/app/lib/iglesias/prayerTypes";
import { getPrayerUiCopy } from "@/app/lib/iglesias/prayerCopy";
import { IglesiasPrayerForm } from "./IglesiasPrayerForm";
import { IglesiasPrayerCard } from "./IglesiasPrayerCard";

export function IglesiasPrayerLane({
  copy,
  lang,
  prayers,
}: {
  copy: IglesiasCopy;
  lang: "es" | "en";
  prayers: PrayerPublicCard[];
}) {
  const prayerCopy = getPrayerUiCopy(lang);

  return (
    <section
      id="oracion"
      className="scroll-mt-24 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_24px_60px_-36px_rgba(31,36,28,0.45)]"
      aria-labelledby="iglesias-prayer-title"
    >
      <div className="border-b border-[#C9A84A]/25 bg-gradient-to-br from-[#7A1E2C] to-[#4A1420] px-5 py-7 sm:px-8 sm:py-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#E8D7B5]">{copy.lanePrayerEyebrow}</p>
        <h2 id="iglesias-prayer-title" className="mt-3 font-serif text-2xl font-bold leading-tight text-[#FFFCF7] sm:text-3xl">
          {copy.lanePrayerTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">{copy.lanePrayerSupport}</p>
        <p className="mt-3 max-w-2xl font-serif text-sm italic leading-relaxed text-[#E8D7B5]">{copy.lanePrayerInvite}</p>
      </div>

      <div className="grid gap-4 p-4 sm:p-6">
        <IglesiasPrayerForm lang={lang} />

        <div>
          <h3 className="font-serif text-xl font-bold text-[#1F241C]">{prayerCopy.wallLiveEyebrow}</h3>
          {prayers.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-[#E8DFD0] bg-[#FAF6EE] px-4 py-6 text-sm leading-relaxed text-[#3D3428]">
              {prayerCopy.emptyWall}
            </p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {prayers.map((prayer) => (
                <li key={prayer.id}>
                  <IglesiasPrayerCard prayer={prayer} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-2xl border border-[#D6C7AD]/80 bg-[#FAF6EE] p-4">
          <h3 className="font-serif text-lg font-bold text-[#1F241C]">{prayerCopy.networkTitle}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{prayerCopy.networkBody}</p>
          <a
            href={`/iglesias/registrar?lang=${lang}#oracion-equipo`}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7A1E2C] px-4 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
          >
            {prayerCopy.networkJoin}
          </a>
        </aside>
      </div>
    </section>
  );
}
