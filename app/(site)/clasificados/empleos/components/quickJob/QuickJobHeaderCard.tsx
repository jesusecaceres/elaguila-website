import Image from "next/image";

type Props = {
  title: string;
  businessName: string;
  logoSrc?: string;
  logoAlt?: string;
  city: string;
  state: string;
};

export function QuickJobHeaderCard({ title, businessName, logoSrc, logoAlt, city, state }: Props) {
  const locationLine = `${city}, ${state}`;
  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(30,24,16,0.06)] sm:p-6">
      <h1 className="text-2xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-3xl">{title}</h1>
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
          <p className="text-base font-semibold text-[color:var(--lx-text)]">{businessName}</p>
          <p className="mt-0.5 text-sm text-[color:var(--lx-muted)]">{locationLine}</p>
        </div>
      </div>
    </div>
  );
}
