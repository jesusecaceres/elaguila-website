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
    <section className="relative mt-16 sm:mt-20" aria-labelledby="viajes-publish-cta-heading">
      <div className="overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-gradient-to-br from-[#fffdf9] via-[#faf3e8] to-[#f0f4f8] shadow-[0_20px_50px_-28px_rgba(30,60,80,0.18)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(234,88,12,0.06)_0%,transparent_45%,rgba(14,116,144,0.05)_100%)]" aria-hidden />
        <div className="relative grid gap-6 px-6 py-8 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10 sm:px-10 sm:py-10">
          <div>
            <h2 id="viajes-publish-cta-heading" className="text-xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
              {copy.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-[0.9375rem]">{copy.body}</p>
          </div>
          <Link
            href={href}
            className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-2xl px-8 py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(234,88,12,0.45)] transition hover:brightness-[1.06] active:brightness-95 sm:min-w-[200px]"
            style={{ backgroundColor: CTA_ORANGE }}
          >
            {copy.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
