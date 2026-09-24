import type { PrayerPublicCard } from "@/app/lib/iglesias/prayerTypes";
import { getPrayerUiCopy } from "@/app/lib/iglesias/prayerCopy";
import { IglesiasPrayerCard } from "./IglesiasPrayerCard";

export function IglesiasPrayerWallList({
  prayers,
  lang,
}: {
  prayers: PrayerPublicCard[];
  lang: "es" | "en";
}) {
  const copy = getPrayerUiCopy(lang);

  if (prayers.length === 0) {
    return (
      <p className="rounded-2xl border border-[#E8DFD0] bg-[#FAF6EE] px-4 py-6 text-sm leading-relaxed text-[#3D3428]">
        {copy.emptyWall}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {prayers.map((prayer) => (
        <li key={prayer.id}>
          <IglesiasPrayerCard prayer={prayer} lang={lang} />
        </li>
      ))}
    </ul>
  );
}
