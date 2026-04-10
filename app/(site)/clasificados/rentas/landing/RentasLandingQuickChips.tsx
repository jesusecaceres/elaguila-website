import Link from "next/link";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { rentasChipInactiveClass, rentasSectionHeadingClass } from "@/app/clasificados/rentas/rentasLandingTheme";

type Chip = { label: string; href: string; Icon: typeof FiHome };

type Props = {
  copy: RentasLandingCopy["quickExplore"];
  chips: Chip[];
};

export function RentasLandingQuickChips({ copy, chips }: Props) {
  return (
    <section className="mt-12 sm:mt-14" aria-labelledby="rentas-quick-chips-heading">
      <h2 id="rentas-quick-chips-heading" className={rentasSectionHeadingClass}>
        {copy.title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4338]/90">{copy.subtitle}</p>
      <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
        {chips.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={rentasChipInactiveClass}>
            <Icon className="h-4 w-4 shrink-0 text-[#5B7C99]/9" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
