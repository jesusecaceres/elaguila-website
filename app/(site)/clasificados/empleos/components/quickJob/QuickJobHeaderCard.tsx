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
    <span className="inline-flex items-center rounded-full border border-[#C9A85A]/55 bg-[#FFF8ED] px-2.5 py-0.5 text-[11px] font-semibold text-[#6B5320]">
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
    <div className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_8px_28px_rgba(42,40,38,0.06)] sm:p-6">
      <div className="flex items-start gap-3">
        {logoSrc ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E8DFD0] bg-neutral-100 shadow-sm">
            <Image src={logoSrc} alt={logoAlt ?? businessName} fill className="object-cover" sizes="56px" />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#E8DFD0] bg-[#F5F0E8] text-lg font-bold text-[#8A7A60]"
            aria-hidden
          >
            {businessName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-bold text-[#2A2826]">{businessName}</p>
          <p className="mt-0.5 text-xs text-[#5C564E]">{locationLine}</p>
          {filterRegionFootnote ? (
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#7A8899]">
              {filterRegionFootnote}
            </p>
          ) : null}
        </div>
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#2A2826] sm:text-3xl">{title}</h1>
      {(chips.length > 0 || payHighlight) ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((c) => <Chip key={c} label={c} />)}
          {payHighlight ? (
            <span className="inline-flex items-center rounded-full border border-[#B8943F]/40 bg-[#FFF3D6] px-3 py-0.5 text-[11px] font-bold text-[#8A5A18]">
              {payHighlight}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
