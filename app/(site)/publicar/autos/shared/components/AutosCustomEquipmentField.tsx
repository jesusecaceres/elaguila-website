"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";

const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2.5 text-sm text-[color:var(--lx-text)] outline-none focus:border-[color:var(--lx-gold-border)]";
const LABEL = "text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

export function AutosCustomEquipmentField({
  items,
  onChange,
  lang,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  lang: "es" | "en";
}) {
  const [draft, setDraft] = useState("");
  const copy =
    lang === "es"
      ? {
          heading: "Añadir equipo o mejora",
          placeholder: "Ejemplo: Apple CarPlay, rines nuevos, cámara 360, llantas nuevas",
          helper:
            "Agrega equipo, mejoras o detalles que no estén en la lista.",
          add: "Agregar",
        }
      : {
          heading: "Add equipment or upgrade",
          placeholder: "Example: Apple CarPlay, new wheels, 360 camera, new tires",
          helper: "Add equipment, upgrades, or details not listed.",
          add: "Add",
        };

  function addItem() {
    const v = draft.trim();
    if (!v) return;
    const exists = items.some((x) => x.toLowerCase() === v.toLowerCase());
    if (!exists) onChange([...items, v]);
    setDraft("");
  }

  return (
    <div className="mt-6 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/80 p-4">
      <p className={LABEL}>{copy.heading}</p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-muted)]">{copy.helper}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          className={`${INPUT} mt-0 flex-1`}
          value={draft}
          placeholder={copy.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] hover:bg-[color:var(--lx-cta-dark-hover)]"
        >
          {copy.add}
        </button>
      </div>
      {items.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] py-1.5 pl-3 pr-1.5 text-sm font-semibold text-[color:var(--lx-text)]"
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--lx-muted)] hover:bg-[color:var(--lx-nav-hover)] hover:text-red-700"
                aria-label={lang === "es" ? `Quitar ${item}` : `Remove ${item}`}
                onClick={() => onChange(items.filter((x) => x !== item))}
              >
                <FiX className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
