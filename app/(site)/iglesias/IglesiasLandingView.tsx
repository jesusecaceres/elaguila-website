import type { PublicChurchCard } from "@/app/lib/iglesias/types";
import type { IglesiasBrowseState } from "@/app/lib/iglesias/queryParams";
import { getIglesiasCopy } from "@/app/lib/iglesias/copy";
import { iglesiasHasActiveFilters } from "@/app/lib/iglesias/queryParams";
import { IglesiasPageShell } from "./components/IglesiasPageShell";
import { IglesiasHero } from "./components/IglesiasHero";
import { IglesiasCollage } from "./components/IglesiasCollage";
import { IglesiasPrayerLane } from "./components/IglesiasPrayerLane";
import { IglesiasSearch } from "./components/IglesiasSearch";
import { IglesiasNeedTiles } from "./components/IglesiasNeedTiles";
import { IglesiasDiscovery } from "./components/IglesiasDiscovery";
import { IglesiasTrust } from "./components/IglesiasTrust";

export function IglesiasLandingView({
  lang,
  browse,
  churches,
}: {
  lang: "es" | "en";
  browse: IglesiasBrowseState;
  churches: PublicChurchCard[];
}) {
  const copy = getIglesiasCopy(lang);
  const churchHref = `/iglesias/registrar?lang=${lang}`;

  return (
    <IglesiasPageShell>
      <IglesiasHero copy={copy} lang={lang} findHref="#buscar" prayerHref="#oracion" churchHref={churchHref} />
      <IglesiasCollage copy={copy} />

      <div className="mx-auto max-w-[88rem] overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section
          className="mb-10 overflow-hidden rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-8 shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)] sm:mb-12 sm:px-8 sm:py-10"
          aria-labelledby="iglesias-welcome-title"
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.welcomeEyebrow}</p>
          <h2 id="iglesias-welcome-title" className="mt-2 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
            {copy.welcomeTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-base">{copy.welcomeBody}</p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <IglesiasPrayerLane copy={copy} />
          <aside
            className="overflow-hidden rounded-[1.5rem] border border-[#D6C7AD]/80 bg-[#FAF6EE] p-6 shadow-[0_20px_50px_-36px_rgba(31,36,28,0.35)] sm:p-7"
            aria-labelledby="iglesias-lane-church-title"
          >
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.laneChurchEyebrow}</p>
            <h2 id="iglesias-lane-church-title" className="mt-2 font-serif text-2xl font-bold text-[#1F241C]">
              {copy.laneChurchTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#3D3428]">{copy.laneChurchSupport}</p>
            <a
              href="#buscar"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-semibold text-white hover:bg-[#6B1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]"
            >
              {copy.ctaFind}
            </a>
          </aside>
        </div>

        <div className="mt-12 space-y-10 sm:mt-14 sm:space-y-12">
          <IglesiasSearch copy={copy} lang={lang} browse={browse} />
          <IglesiasNeedTiles copy={copy} lang={lang} />
          <IglesiasDiscovery
            copy={copy}
            lang={lang}
            churches={churches}
            hasFilters={iglesiasHasActiveFilters(browse)}
            churchHref={churchHref}
          />
          <IglesiasTrust copy={copy} churchHref={churchHref} />
        </div>
      </div>
    </IglesiasPageShell>
  );
}
