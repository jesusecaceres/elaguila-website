"use client";

import Image from "next/image";
import { useState } from "react";
import type { ShellMenuHighlight } from "./restaurantDetailShellTypes";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.1)]";

const INITIAL_VISIBLE = 2;

export function RestauranteShellPlatillosBlock({
  dishes,
  fullMenuCta,
}: {
  dishes: ShellMenuHighlight[];
  fullMenuCta?: { label: string; href: string };
}) {
  const [expanded, setExpanded] = useState(false);
  if (!dishes.length) return null;

  const showExpand = dishes.length > INITIAL_VISIBLE;
  const visible = !showExpand || expanded ? dishes : dishes.slice(0, INITIAL_VISIBLE);

  return (
    <section aria-labelledby="platillos-destacados-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="platillos-destacados-heading" className="text-xl font-bold tracking-tight text-[color:var(--lx-text)]">
          Platillos destacados
        </h2>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((dish, idx) => (
          <article key={`${dish.name}-${idx}`} className={`${CARD} group overflow-hidden p-0`}>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={dish.imageUrl}
                alt={dish.name}
                fill
                unoptimized={dish.imageUrl.startsWith("data:")}
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width:640px) 100vw, 50vw"
              />
              {dish.badge ? (
                <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {dish.badge}
                </span>
              ) : null}
            </div>
            <div className="p-4 sm:p-5">
              <h3 className="text-base font-bold text-[color:var(--lx-text)]">{dish.name}</h3>
              {dish.supportingLine?.trim() ? (
                <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{dish.supportingLine}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {showExpand ? (
        <div className="mt-5 flex justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="min-h-[44px] rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {expanded ? "Mostrar menos" : `Ver más platillos (${dishes.length - INITIAL_VISIBLE} más)`}
          </button>
        </div>
      ) : null}
      {fullMenuCta ? (
        <div className="mt-6">
          <a
            href={fullMenuCta.href}
            className="flex w-full min-h-[48px] items-center justify-center rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-4 py-3.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {fullMenuCta.label}
            <span className="ml-1 text-[color:var(--lx-gold)]" aria-hidden>
              →
            </span>
          </a>
        </div>
      ) : null}
    </section>
  );
}
