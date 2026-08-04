"use client";

import { useId, useState } from "react";
import { newViajesStableId } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
const INPUT =
  "mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";
const BTN_SECONDARY =
  "inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 text-xs font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]";

export type ViajesPillEditorItem = { id: string; label: string };

type ViajesPillCollectionEditorProps = {
  items: ViajesPillEditorItem[];
  onChange: (items: ViajesPillEditorItem[]) => void;
  label: string;
  placeholder?: string;
  max?: number;
};

export function ViajesPillCollectionEditor({
  items,
  onChange,
  label,
  placeholder,
  max,
}: ViajesPillCollectionEditorProps) {
  const baseId = useId();
  const [draft, setDraft] = useState("");
  const atMax = typeof max === "number" && items.length >= max;

  const add = () => {
    const text = draft.trim();
    if (!text || atMax) return;
    onChange([...items, { id: newViajesStableId("pill"), label: text }]);
    setDraft("");
  };

  const updateLabel = (id: string, nextLabel: string) => {
    onChange(items.map((it) => (it.id === id ? { ...it, label: nextLabel } : it)));
  };

  const remove = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <label className={LABEL} htmlFor={`${baseId}-add`}>
        {label}
        {typeof max === "number" ? (
          <span className="ml-2 font-semibold normal-case tracking-normal text-[color:var(--lx-muted)]">
            ({items.length}/{max})
          </span>
        ) : null}
      </label>

      <ul className="space-y-2" aria-label={label}>
        {items.map((it, index) => (
          <li
            key={it.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-2"
          >
            <input
              className={`${INPUT} mt-0 min-w-[10rem] flex-1`}
              value={it.label}
              onChange={(e) => updateLabel(it.id, e.target.value)}
              aria-label={`${label} ${index + 1}`}
            />
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={BTN_SECONDARY} disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </button>
              <button
                type="button"
                className={BTN_SECONDARY}
                disabled={index >= items.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className={`${BTN_SECONDARY} border-red-300/70 text-red-800 hover:bg-red-50`}
                onClick={() => remove(it.id)}
              >
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <input
            id={`${baseId}-add`}
            className={INPUT}
            value={draft}
            placeholder={placeholder}
            disabled={atMax}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:bg-[color:var(--lx-cta-dark-hover)] disabled:opacity-50"
          disabled={atMax || !draft.trim()}
          onClick={add}
        >
          Agregar
        </button>
      </div>
    </div>
  );
}
