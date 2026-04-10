"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
  id: string;
  children: ReactNode;
  onRemove: () => void;
  dragLabel: string;
  /** Slightly tighter chrome for bucket columns */
  variant?: "gallery" | "bucket";
};

/**
 * Shared drag handle + remove chrome for Restaurante publish media (general gallery + categorized buckets).
 */
export function RestauranteSortableMediaTile({ id, children, onRemove, dragLabel, variant = "gallery" }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };

  const btnPad = variant === "bucket" ? "min-h-[34px] min-w-[34px] px-1.5" : "min-h-[36px] min-w-[36px] px-2";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]"
    >
      {children}
      <div className="absolute right-1 top-1 z-10 flex max-w-[calc(100%-8px)] flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          className={`touch-none flex ${btnPad} cursor-grab items-center justify-center rounded-lg border-2 border-black/25 bg-white py-1 text-xs font-extrabold leading-none text-[#111] shadow-md active:cursor-grabbing`}
          aria-label={dragLabel}
          title={dragLabel}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden>⋮⋮</span>
          <span className="ml-1 hidden font-bold sm:inline">Orden</span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-700 text-sm font-bold leading-none text-white shadow-md"
          aria-label="Quitar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
