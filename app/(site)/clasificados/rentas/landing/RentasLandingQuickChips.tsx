import Link from "next/link";
import { FiHome } from "react-icons/fi";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { rentasChipPrimaryBrowseClass } from "@/app/clasificados/rentas/rentasLandingTheme";

export type RentasQuickChip = { label: string; href: string; Icon: typeof FiHome };

type Props = {
  copy: RentasLandingCopy["quickExplore"];
  chipsProperty: RentasQuickChip[];
  chipsSeller: RentasQuickChip[];
  chipsDetails: RentasQuickChip[];
};

const MAX_VISIBLE = 8;

export function RentasLandingQuickChips({ copy, chipsProperty, chipsSeller, chipsDetails }: Props) {
  const all = [...chipsProperty, ...chipsSeller, ...chipsDetails].slice(0, MAX_VISIBLE);

  if (!all.length) return null;

  return (
    <div className="mt-3 min-w-0" aria-label={copy.title}>
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {all.map(({ label, href, Icon }) => (
          <Link key={label} href={href} className={`${rentasChipPrimaryBrowseClass} shrink-0 snap-start`}>
            <Icon className="h-3.5 w-3.5 shrink-0 text-[#556B3E]" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
