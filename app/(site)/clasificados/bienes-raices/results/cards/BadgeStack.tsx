import type { BrListingBadge } from "./listingTypes";

const LABEL: Record<BrListingBadge, string> = {
  negocio: "NEGOCIO",
  destacada: "DESTACADA",
  reducida: "REDUCIDA",
  open_house: "OPEN HOUSE",
  tour_virtual: "TOUR VIRTUAL",
  nuevo: "NUEVO",
  planos: "PLANOS",
  comercial: "COMERCIAL",
  promocionada: "PROMO",
};

const STYLE: Record<BrListingBadge, string> = {
  negocio: "bg-[#2A2620]/92 text-[#FAF7F2]",
  destacada: "bg-[#C5A059]/95 text-[#1E1810]",
  reducida: "bg-[#C17A3A]/95 text-white",
  open_house: "bg-[#4A7C59]/92 text-white",
  tour_virtual: "bg-[#5C5346]/88 text-[#FAF7F2]",
  nuevo: "bg-[#3D3630]/90 text-[#FAF7F2]",
  planos: "bg-[#6E5418]/88 text-[#FFFCF7]",
  comercial: "bg-[#5C5346]/85 text-[#FAF7F2]",
  promocionada: "bg-[#8B6914]/95 text-[#FFFCF7]",
};

export function BadgeStack({ badges }: { badges: BrListingBadge[] }) {
  if (!badges.length) return null;
  return (
    <div className="absolute left-2 top-2 z-[2] flex max-w-[min(100%-1rem,220px)] flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b}
          className={
            "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm " + STYLE[b]
          }
        >
          {LABEL[b]}
        </span>
      ))}
    </div>
  );
}
