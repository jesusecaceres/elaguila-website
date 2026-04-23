import Image from "next/image";

type Props = {
  title: string;
  companyName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
  filterRegionFootnote?: string;
  modalityLine?: string;
};

export function PremiumJobHeaderCard({
  title,
  companyName,
  logoSrc,
  logoAlt,
  city,
  state,
  filterRegionFootnote,
  modalityLine,
}: Props) {
  const locationLine = `${city}, ${state}`;
  return (
    <div className="rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_10px_32px_rgba(42,40,38,0.06)] sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#2A2826] sm:text-3xl md:text-[2.1rem]">{title}</h1>
      <div className="mt-5 flex items-start gap-4">
        {logoSrc ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#E8DFD0] bg-white sm:h-16 sm:w-16">
            <Image src={logoSrc} alt={logoAlt ?? companyName} fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2] text-lg font-bold text-[#7A756E] sm:h-16 sm:w-16"
            aria-hidden
          >
            {companyName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 pt-1">
          <p className="text-lg font-semibold text-[#2A2826]">{companyName}</p>
          <p className="mt-1 text-sm text-[#5C564E]">{locationLine}</p>
          {modalityLine ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#7A8899]">{modalityLine}</p>
          ) : null}
          {filterRegionFootnote ? (
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#7A8899]">{filterRegionFootnote}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
