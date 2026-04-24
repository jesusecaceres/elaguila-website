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
  negocio: "bg-[#2A2620]/94 text-[#FAF7F2] ring-1 ring-black/10",
  destacada: "bg-gradient-to-r from-[#B8954A] to-[#C5A059] text-[#1E1810] ring-1 ring-[#8A6F3A]/25",
  reducida: "bg-[#C17A3A]/95 text-white ring-1 ring-[#A65F28]/30",
  open_house: "bg-[#4A7C59]/92 text-white ring-1 ring-[#2F5239]/20",
  tour_virtual: "bg-[#3D3630]/90 text-[#FAF7F2] ring-1 ring-black/10",
  nuevo: "bg-[#2A2620]/88 text-[#FFFCF7] ring-1 ring-black/10",
  planos: "bg-[#6E5418]/90 text-[#FFFCF7] ring-1 ring-[#4A3810]/25",
  comercial: "bg-[#4A4438]/90 text-[#FAF7F2] ring-1 ring-black/10",
  promocionada: "bg-gradient-to-r from-[#8B6914] to-[#A67C32] text-[#FFFCF7] ring-1 ring-[#6E5418]/35",
};

const OP_STYLE = {
  venta: "bg-[#1E1810]/92 text-[#FAF7F2] ring-1 ring-black/15",
  renta: "bg-[#2A4A6E]/90 text-[#F4F8FC] ring-1 ring-[#1E3550]/25",
} as const;

const LANE_STYLE = {
  privado: "border border-[#E8DFD0]/95 bg-[#FFFCF7]/95 text-[#3D3630] ring-1 ring-[#C9B46A]/20",
  negocio: "border border-[#C9B46A]/45 bg-[#FFF8E8]/95 text-[#6E5418] ring-1 ring-[#C9B46A]/25",
} as const;

export function BadgeStack({
  badges,
  operation,
  lane,
}: {
  badges: BrListingBadge[];
  /** Sale / rent pill (from listing contract / card). */
  operation?: "venta" | "renta" | null;
  /** Particular vs negocio lane (UI; may hide duplicate `negocio` badge). */
  lane?: "privado" | "negocio" | null;
}) {
  const rest = badges.filter((b) => !(lane === "negocio" && b === "negocio"));
  const showPills = Boolean(operation || lane || rest.length);

  if (!showPills) return null;

  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[2] flex max-w-[min(100%-1.25rem,260px)] flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {operation ? (
          <span
            className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm ${OP_STYLE[operation]}`}
          >
            {operation === "venta" ? "Venta" : "Renta"}
          </span>
        ) : null}
        {lane ? (
          <span
            className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm ${LANE_STYLE[lane]}`}
          >
            {lane === "negocio" ? "Negocio" : "Privado"}
          </span>
        ) : null}
        {rest.map((b) => (
          <span
            key={b}
            className={
              "rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] shadow-sm " + STYLE[b]
            }
          >
            {LABEL[b]}
          </span>
        ))}
      </div>
    </div>
  );
}
