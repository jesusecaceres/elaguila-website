import Link from "next/link";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { rentasChipHoverClass, rentasChipInactiveClass } from "@/app/clasificados/rentas/rentasLandingTheme";

type Chip = { label: string; href: string; Icon: typeof FiHome };

type Props = {
  copy: RentasLandingCopy["quickExplore"];
  chips: Chip[];
};

export function RentasLandingQuickChips({ copy, chips }: Props) {
  return (
    <section className="mt-10" aria-labelledby="rentas-quick-chips-heading">
      <h2
        id="rentas-quick-chips-heading"
        className="border-l-[3px] border-[#C45C26]/50 pl-3 font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.75rem]"
      >
        {copy.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/88">{copy.subtitle}</p>
      <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
        {chips.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={`${rentasChipInactiveClass} ${rentasChipHoverClass}`}>
            <Icon className="h-4 w-4 shrink-0 text-[#5B7C99]/85" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
