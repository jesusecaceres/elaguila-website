import Link from "next/link";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";

export function IglesiasTrust({ copy, churchHref }: { copy: IglesiasCopy; churchHref: string }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" aria-labelledby="iglesias-trust-title">
      <div className="rounded-[1.5rem] border border-[#C9A84A]/35 bg-[#FFFDF7] px-5 py-7 shadow-[0_20px_50px_-36px_rgba(31,36,28,0.4)] sm:px-7 sm:py-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.trustEyebrow}</p>
        <h2 id="iglesias-trust-title" className="mt-2 font-serif text-2xl font-bold text-[#1F241C] sm:text-3xl">
          {copy.trustTitle}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-base">{copy.trustBody}</p>
      </div>
      <div className="rounded-[1.5rem] border border-[#7A1E2C]/25 bg-gradient-to-br from-[#7A1E2C] to-[#4A1420] px-5 py-7 text-[#FFFCF7] shadow-[0_20px_50px_-36px_rgba(31,36,28,0.45)] sm:px-7 sm:py-8">
        <h3 className="font-serif text-xl font-bold sm:text-2xl">{copy.churchCtaTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90">{copy.churchCtaBody}</p>
        <Link
          href={churchHref}
          className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#C9A84A] px-5 text-sm font-semibold text-[#1F241C] hover:bg-[#D4BC6A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {copy.churchCtaButton}
        </Link>
      </div>
    </section>
  );
}
