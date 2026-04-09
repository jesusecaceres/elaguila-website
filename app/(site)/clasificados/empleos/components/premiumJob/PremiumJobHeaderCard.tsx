import Image from "next/image";

type Props = {
  title: string;
  companyName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
};

export function PremiumJobHeaderCard({ title, companyName, logoSrc, logoAlt, city, state }: Props) {
  const locationLine = `${city}, ${state}`;
  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(30,24,16,0.06)] sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl md:text-4xl">{title}</h1>
      <div className="mt-5 flex items-start gap-4">
        {logoSrc ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-black/[0.06] bg-neutral-100 sm:h-16 sm:w-16">
            <Image src={logoSrc} alt={logoAlt ?? companyName} fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-neutral-100 text-lg font-bold text-[color:var(--lx-muted)] sm:h-16 sm:w-16"
            aria-hidden
          >
            {companyName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 pt-1">
          <p className="text-lg font-semibold text-[color:var(--lx-text)]">{companyName}</p>
          <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{locationLine}</p>
        </div>
      </div>
    </div>
  );
}
