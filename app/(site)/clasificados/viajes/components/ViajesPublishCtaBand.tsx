import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";

const CTA_ORANGE = "#EA580C";

type ViajesPublishCtaBandProps = {
  ui: ViajesUi;
  href: string;
};

export function ViajesPublishCtaBand({ ui, href }: ViajesPublishCtaBandProps) {
  const copy = ui.publishCtaBand;
  return (
    <section className="relative mt-10 sm:mt-12" aria-labelledby="viajes-publish-cta-heading">
      <div className="overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-gradient-to-br from-[#fffdf9] via-[#faf3e8] to-[#eef6fa] shadow-[0_20px_50px_-28px_rgba(30,60,80,0.16)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(234,88,12,0.05)_0%,transparent_42%,rgba(14,116,144,0.04)_100%)]" aria-hidden />
        <div className="relative flex flex-col gap-6 px-5 py-7 sm:px-10 sm:py-9 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="min-w-0 flex-1">
            <h2 id="viajes-publish-cta-heading" className="text-[1.15rem] font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[color:var(--lx-text-2)] sm:text-[0.9375rem]">{copy.body}</p>
            <p className="mt-3 max-w-2xl border-l-2 border-[color:var(--lx-gold)]/50 pl-3 text-[11px] leading-snug text-[color:var(--lx-muted)] sm:text-xs">
              {copy.reinforcement}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-[52px] w-full shrink-0 items-center justify-center rounded-2xl px-8 py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(234,88,12,0.45)] transition hover:brightness-[1.06] active:brightness-95 sm:w-auto sm:min-w-[200px]"
            style={{ backgroundColor: CTA_ORANGE }}
          >
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
