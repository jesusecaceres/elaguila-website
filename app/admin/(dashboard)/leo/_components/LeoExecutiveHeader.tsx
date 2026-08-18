import Image from "next/image";

export function LeoExecutiveHeader() {
  return (
    <header className="min-w-0 border-b border-[color:var(--lx-border)]/60 pb-5">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <Image
          src="/logo-clean.png"
          alt="Leonix Media"
          width={48}
          height={48}
          className="mt-0.5 h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12"
          priority
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#A67C52]">Leonix Media</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1E1810] sm:text-4xl">LEO</h1>
          <p className="mt-1 text-sm font-semibold text-[#5C5346] sm:text-base">
            Leonix Executive Operating Intelligence
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/90">
            Executive view of current Leonix operational truth. Evidence-first. Not autonomous monitoring.
          </p>
        </div>
      </div>
    </header>
  );
}
