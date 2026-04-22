"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { ShellMenuHighlight } from "./restaurantDetailShellTypes";
import { RestauranteShellInlineDataAssetButton } from "./RestauranteShellInlineDataAssetButton";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

export function RestauranteShellPlatillosBlock({
  dishes,
  fullMenuCta,
}: {
  dishes: ShellMenuHighlight[];
  fullMenuCta?: { label: string; href: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const n = dishes.length;

  const { visible, showExpand } = useMemo(() => {
    if (n === 0) {
      return { visible: [] as ShellMenuHighlight[], showExpand: false };
    }
    if (n === 1 || n === 2 || n === 4) {
      return { visible: dishes, showExpand: false };
    }
    if (n === 3) {
      return {
        visible: expanded ? dishes : dishes.slice(0, 2),
        showExpand: true,
      };
    }
    return { visible: dishes, showExpand: false };
  }, [dishes, expanded, n]);

  if (!n) return null;

  const gridClass =
    n === 1
      ? "mx-auto mt-6 max-w-lg grid grid-cols-1 gap-5"
      : "mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2";

  return (
    <section aria-labelledby="platillos-destacados-heading" className="scroll-mt-24">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Carta</p>
        <h2 id="platillos-destacados-heading" className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Platillos destacados
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          Un adelanto curado de la cocina — ideal para decidir con confianza.
        </p>
      </div>
      <div className={gridClass}>
        {visible.map((dish, idx) => (
          <article key={`${dish.name}-${idx}`} className={`${CARD} group overflow-hidden p-0`}>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--lx-section)]">
              {dish.imageUrl ? (
                <Image
                  src={dish.imageUrl}
                  alt={dish.name}
                  fill
                  unoptimized={dish.imageUrl.startsWith("data:")}
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width:640px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[color:var(--lx-section)] to-[color:var(--lx-card)] p-4 text-center">
                  <span className="text-4xl opacity-50" aria-hidden>
                    🍽
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--lx-muted)]">Sin foto aún</span>
                </div>
              )}
              {dish.badge ? (
                <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {dish.badge}
                </span>
              ) : null}
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{dish.name}</h3>
              {dish.supportingLine?.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{dish.supportingLine}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {showExpand ? (
        <div className="mt-6 flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="min-h-[44px] rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-6 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {expanded ? "Mostrar menos" : "Ver tercer platillo"}
          </button>
        </div>
      ) : null}
      {fullMenuCta ? (
        <div className="mt-8 border-t border-[color:var(--lx-nav-border)]/80 pt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">Carta completa</p>
          <RestauranteShellInlineDataAssetButton
            href={fullMenuCta.href}
            label={`${fullMenuCta.label} →`}
            className="mt-3 flex w-full min-h-[52px] items-center justify-center rounded-2xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] px-4 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-active)]"
          />
        </div>
      ) : null}
    </section>
  );
}
