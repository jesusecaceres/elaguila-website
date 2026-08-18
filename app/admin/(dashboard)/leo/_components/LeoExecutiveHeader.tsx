import Image from "next/image";

export function LeoExecutiveHeader() {
  return (
    <header className="min-w-0 border-b border-[color:var(--lx-border)]/50 pb-3 sm:pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src="/logo-clean.png"
          alt="Leonix Media"
          width={40}
          height={40}
          className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
          priority
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">LEO</h1>
            <p className="text-xs font-semibold text-[#5C5346] sm:text-sm">
              Leonix Executive Operating Intelligence
            </p>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-snug text-[#5C5346]">
            Your executive view of what needs attention across Leonix.
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#5C5346]/80">
            Built from available Leonix evidence. No background monitoring yet.
          </p>
        </div>
      </div>
    </header>
  );
}
