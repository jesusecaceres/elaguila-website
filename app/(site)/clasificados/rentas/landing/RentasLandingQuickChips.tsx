import Link from "next/link";
import { FiHome } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import {
  rentasChipPrimaryBrowseClass,
  rentasChipSecondaryBrowseClass,
  rentasQuickExplorePanelClass,
  rentasSectionHeadingClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";

export type RentasQuickChip = { label: string; href: string; Icon: typeof FiHome };

type Props = {
  copy: RentasLandingCopy["quickExplore"];
  chipsProperty: RentasQuickChip[];
  chipsSeller: RentasQuickChip[];
  chipsDetails: RentasQuickChip[];
};

function ChipRail({
  label,
  chips,
  tier,
}: {
  label: string;
  chips: RentasQuickChip[];
  tier: "primary" | "secondary";
}) {
  const tierClass = tier === "primary" ? rentasChipPrimaryBrowseClass : rentasChipSecondaryBrowseClass;
  return (
    <div className="min-w-0">
      <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/88">{label}</p>
      <div
        className={
          "flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-pl-3 scroll-pr-3 pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] " +
          "sm:snap-none sm:flex-wrap sm:overflow-visible sm:scroll-pl-0 sm:scroll-pr-0 [&::-webkit-scrollbar]:hidden"
        }
      >
        {chips.map(({ label: chipLabel, href, Icon }) => (
          <Link key={chipLabel} href={href} className={`${tierClass} shrink-0 snap-start`}>
            <Icon className="h-4 w-4 shrink-0 text-[#5B7C99]/88" aria-hidden />
            {chipLabel}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RentasLandingQuickChips({ copy, chipsProperty, chipsSeller, chipsDetails }: Props) {
  return (
    <section className="mt-14 sm:mt-16" aria-labelledby="rentas-quick-chips-heading">
      <h2 id="rentas-quick-chips-heading" className={rentasSectionHeadingClass}>
        {copy.title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A4338]/90">{copy.subtitle}</p>
      <div className={`mt-7 ${rentasQuickExplorePanelClass}`}>
        <div className="flex flex-col gap-6">
          <ChipRail label={copy.groupProperty} chips={chipsProperty} tier="primary" />
          <ChipRail label={copy.groupSeller} chips={chipsSeller} tier="primary" />
          <ChipRail label={copy.groupDetails} chips={chipsDetails} tier="secondary" />
        </div>
      </div>
    </section>
  );
}
