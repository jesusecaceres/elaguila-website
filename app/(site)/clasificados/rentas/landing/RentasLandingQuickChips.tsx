import Link from "next/link";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import {
  rentasChipPrimaryBrowseClass,
  rentasChipSecondaryBrowseClass,
  rentasQuickExplorePanelClass,
  rentasSectionHeadingClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";

type Chip = { label: string; href: string; Icon: typeof FiHome };

type Props = {
  copy: RentasLandingCopy["quickExplore"];
  chips: Chip[];
  /** First N chips use primary browse styling (property types + seller branch). */
  primaryBrowseCount?: number;
};

export function RentasLandingQuickChips({ copy, chips, primaryBrowseCount = 5 }: Props) {
  return (
    <section className="mt-14 sm:mt-16" aria-labelledby="rentas-quick-chips-heading">
      <h2 id="rentas-quick-chips-heading" className={rentasSectionHeadingClass}>
        {copy.title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4338]/90">{copy.subtitle}</p>
      <div className={`mt-7 ${rentasQuickExplorePanelClass}`}>
        <div
          className={
            "flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-pl-3 scroll-pr-3 pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] " +
            "sm:snap-none sm:flex-wrap sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 [&::-webkit-scrollbar]:hidden"
          }
        >
          {chips.map(({ label, href, Icon }, i) => {
            const tierClass = i < primaryBrowseCount ? rentasChipPrimaryBrowseClass : rentasChipSecondaryBrowseClass;
            return (
              <Link key={label} href={href} className={`${tierClass} shrink-0 snap-start`}>
                <Icon className="h-4 w-4 shrink-0 text-[#5B7C99]/88" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
