"use client";

import type { ShellHighlightTag } from "./restaurantDetailShellTypes";
import { traitIconForLabel } from "./restauranteShellTraitIcons";

const TRAIT_CARD =
  "group flex min-h-[72px] flex-col justify-center gap-1 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-3 shadow-[0_6px_24px_-12px_rgba(42,36,22,0.12)] transition hover:border-[color:var(--lx-gold-border)]/60 hover:shadow-[0_10px_32px_-14px_rgba(42,36,22,0.18)]";

export function RestauranteShellDestacadosSection({ tags }: { tags: ShellHighlightTag[] }) {
  if (!tags.length) return null;

  return (
    <section aria-labelledby="destacados-lugar-heading" className="scroll-mt-24">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">El lugar</p>
        <h2 id="destacados-lugar-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Destacados del lugar
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">Rasgos que marcan la experiencia.</p>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => {
          const Icon = traitIconForLabel(tag.label);
          return (
            <li key={tag.key}>
              <div className={TRAIT_CARD}>
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--lx-section)] text-[color:var(--lx-gold)] ring-1 ring-[color:var(--lx-gold-border)]/40"
                    aria-hidden
                  >
                    <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-[color:var(--lx-text)]">{tag.label}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
