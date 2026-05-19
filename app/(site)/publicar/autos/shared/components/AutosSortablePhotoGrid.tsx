"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiChevronLeft, FiChevronRight, FiMoreVertical, FiStar, FiTrash2 } from "react-icons/fi";
import type { MediaImageEntry } from "@/app/clasificados/autos/negocios/types/autoDealerListing";

export type AutosSortablePhotoGridCopy = {
  useAsCover: string;
  activeCover: string;
  before: string;
  after: string;
  remove: string;
  sourceFile: string;
  sourceUrl: string;
  secondary: string;
  principal: string;
  dragHandle: string;
};

function SortablePhotoTile({
  img,
  copy,
  onSetPrimary,
  onRemove,
  onMove,
  canMoveLeft,
  canMoveRight,
}: {
  img: MediaImageEntry;
  copy: AutosSortablePhotoGridCopy;
  onSetPrimary: () => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: img.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-3 rounded-xl border bg-[#FFFCF7] p-2 shadow-sm sm:flex-row sm:items-stretch ${
        isDragging ? "border-[color:var(--lx-gold)] ring-2 ring-[color:var(--lx-gold-border)]/40" : "border-[color:var(--lx-nav-border)]"
      }`}
    >
      <div className="relative shrink-0 sm:w-28">
        <img
          src={img.url}
          alt=""
          loading="lazy"
          className="aspect-[4/3] w-full rounded-lg object-cover sm:h-20 sm:aspect-auto"
        />
        <button
          type="button"
          className="absolute left-1.5 top-1.5 inline-flex min-h-[36px] min-w-[36px] cursor-grab items-center justify-center rounded-lg border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]/95 text-[color:var(--lx-text-2)] shadow-sm active:cursor-grabbing"
          aria-label={copy.dragHandle}
          {...attributes}
          {...listeners}
        >
          <FiMoreVertical className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`inline-flex min-h-[44px] items-center gap-0.5 rounded-full border px-3 py-1.5 text-[10px] font-bold ${
              img.isPrimary
                ? "border-[color:var(--lx-gold)] bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)]"
                : "border-[color:var(--lx-nav-border)] text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
            }`}
            onClick={onSetPrimary}
          >
            <FiStar className="h-3 w-3" aria-hidden />
            {img.isPrimary ? copy.activeCover : copy.useAsCover}
          </button>
          <button
            type="button"
            disabled={!canMoveLeft}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] px-2 text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-35"
            onClick={() => onMove(-1)}
            aria-label={copy.before}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!canMoveRight}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] px-2 text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)] disabled:opacity-35"
            onClick={() => onMove(1)}
            aria-label={copy.after}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ml-auto inline-flex min-h-[44px] items-center gap-0.5 rounded-full border border-red-200 px-3 py-1.5 text-[10px] font-bold text-red-800 hover:bg-red-50"
            onClick={onRemove}
          >
            <FiTrash2 className="h-3 w-3" aria-hidden />
            {copy.remove}
          </button>
        </div>
        <p className="truncate text-[10px] text-[color:var(--lx-muted)]">
          {img.sourceType === "file" ? copy.sourceFile : copy.sourceUrl} · {img.isPrimary ? copy.principal : copy.secondary}
        </p>
      </div>
    </li>
  );
}

export function AutosSortablePhotoGrid({
  images,
  onReorder,
  onSetPrimary,
  onRemove,
  onMove,
  copy,
}: {
  images: MediaImageEntry[];
  onReorder: (next: MediaImageEntry[]) => void;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  copy: AutosSortablePhotoGridCopy;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((x) => x.id === active.id);
    const newIndex = images.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(images, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={images.map((x) => x.id)} strategy={rectSortingStrategy}>
        <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((img, index) => (
            <SortablePhotoTile
              key={img.id}
              img={img}
              copy={copy}
              onSetPrimary={() => onSetPrimary(img.id)}
              onRemove={() => onRemove(img.id)}
              onMove={(delta) => onMove(img.id, delta)}
              canMoveLeft={index > 0}
              canMoveRight={index < images.length - 1}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
