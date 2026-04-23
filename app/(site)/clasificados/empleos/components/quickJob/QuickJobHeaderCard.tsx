import Image from "next/image";

type Props = {
  title: string;
  businessName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
  filterRegionFootnote?: string;
};

export function QuickJobHeaderCard({
  title,
  businessName,
  logoSrc,
  logoAlt,
  city,
  state,
  filterRegionFootnote,
}: Props) {
  const locationLine = `${city}, ${state}`;
  return (
    <div className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_8px_28px_rgba(42,40,38,0.06)] sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#2A2826] sm:text-3xl">{title}</h1>
      <div className="mt-4 flex items-start gap-3">
        {logoSrc ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-black/[0.06] bg-neutral-100">
            <Image src={logoSrc} alt={logoAlt ?? businessName} fill className="object-cover" sizes="48px" />
          </div>
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-neutral-100 text-sm font-bold text-[color:var(--lx-muted)]"
            aria-hidden
          >
            {businessName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 pt-0.5">
          <p className="text-base font-semibold text-[#2A2826]">{businessName}</p>
          <p className="mt-0.5 text-sm text-[#5C564E]">{locationLine}</p>
          {filterRegionFootnote ? (
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#7A8899]">
              {filterRegionFootnote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
