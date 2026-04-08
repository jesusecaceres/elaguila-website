"use client";

import type { RestauranteAppSectionItem } from "./restauranteApplicationSectionModel";

export type { RestauranteAppSectionItem };

const BTN_BASE =
  "w-full rounded-xl border px-3 py-2 text-left text-sm transition touch-manipulation";
const BTN_IDLE = "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]";
const BTN_ACTIVE =
  "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] font-semibold text-[color:var(--lx-text)] shadow-sm ring-1 ring-[color:var(--lx-gold-border)]/30";

export function scrollToRestauranteSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Desktop: vertical lettered section list. Mobile: `variant="chips"` horizontal scroll.
 * Active highlight is controlled by the parent (scroll spy).
 */
export function RestauranteApplicationSectionNav({
  sections,
  variant = "sidebar",
  activeId,
  onSelect,
}: {
  sections: RestauranteAppSectionItem[];
  variant?: "sidebar" | "chips";
  activeId: string;
  onSelect?: (id: string) => void;
}) {
  const pick = (id: string) => {
    scrollToRestauranteSection(id);
    onSelect?.(id);
  };

  if (variant === "chips") {
    return (
      <nav aria-label="Ir a sección" className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                activeId === s.id
                  ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] text-[color:var(--lx-text)]"
                  : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text-2)]"
              }`}
            >
              <span className="text-[color:var(--lx-gold)]">{s.letter}</span>
              <span className="ml-1.5 max-w-[9rem] truncate sm:max-w-[12rem]">{s.shortTitle}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Secciones del formulario" className="w-full">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">Secciones</p>
      <ul className="space-y-1.5">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => pick(s.id)}
              className={`${BTN_BASE} ${activeId === s.id ? BTN_ACTIVE : BTN_IDLE}`}
            >
              <span className="font-bold text-[color:var(--lx-gold)]">{s.letter}</span>
              <span className="mt-0.5 block text-xs leading-snug text-[color:var(--lx-text-2)]">{s.shortTitle}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
