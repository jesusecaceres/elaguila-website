import Image from "next/image";

type Props = {
  title: string;
  businessName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
  stateRegion?: string;
  country?: string;
  filterRegionFootnote?: string;
  /** Chips to show below company line. */
  chips?: string[];
  /** Formatted pay highlight (shown as secondary badge). */
  payHighlight?: string;
};

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-[#D6C7AD]/80 bg-[#FBF7EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C5346]">
      {label}
    </span>
  );
}

export function QuickJobHeaderCard({
  title,
  businessName,
  logoSrc,
  logoAlt,
  city,
  state,
  stateRegion,
  country,
  filterRegionFootnote,
  chips = [],
  payHighlight,
}: Props) {
  const st = stateRegion || state;
  const parts = [city, st, country].filter(Boolean);
  const locationLine = parts.join(", ");
  return (
    <div className="rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_14px_40px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10 sm:p-6">
      <div className="flex items-start gap-3">
        {logoSrc ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#D6C7AD]/80 bg-neutral-100 shadow-sm">
            <Image src={logoSrc} alt={logoAlt ?? businessName} fill className="object-cover" sizes="56px" />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#D6C7AD]/80 bg-gradient-to-br from-[#FFF8EC] to-[#F3E0C0] text-lg font-bold text-[#7A6B4A] shadow-inner"
            aria-hidden
          >
            {businessName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-bold text-[#3D3428]">{businessName}</p>
          <p className="mt-0.5 text-xs text-[#7A7164]">{locationLine}</p>
          {filterRegionFootnote ? (
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8A8A7A]">
              {filterRegionFootnote}
            </p>
          ) : null}
        </div>
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#3D3428] sm:text-3xl">{title}</h1>
      {(chips.length > 0 || payHighlight) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => <Chip key={c} label={c} />)}
          {payHighlight ? (
            <span className="inline-flex items-center rounded-lg border border-[#7A1E2C]/20 bg-[#F9EEF0] px-3 py-0.5 text-[11px] font-bold text-[#7A1E2C]">
              {payHighlight}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
