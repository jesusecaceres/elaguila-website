"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { FiStar } from "react-icons/fi";
import { RestauranteSortableMediaTile } from "@/app/clasificados/restaurantes/application/RestauranteSortableMediaTile";
import type { GalleryItem } from "../lib/clasificadosServiciosApplicationTypes";

type Props = {
  gallery: GalleryItem[];
  featuredGalleryIds: string[];
  lang: "es" | "en";
  copy: {
    assetFromFile: string;
    assetFromUrl: string;
    featuredToggle: string;
  };
  onReorder: (nextGallery: GalleryItem[], nextFeaturedIds: string[]) => void;
  onRemove: (id: string) => void;
  onToggleFeatured: (id: string) => void;
};

function syncFeaturedOrder(gallery: GalleryItem[], prevFeatured: string[]): string[] {
  const set = new Set(prevFeatured);
  return gallery.map((g) => g.id).filter((id) => set.has(id)).slice(0, 4);
}

/**
 * Drag/reorder gallery for Servicios publish — same tile + handle interaction model as Restaurantes.
 */
export function ServiciosPublishSortableGallery({
  gallery,
  featuredGalleryIds,
  lang,
  copy,
  onReorder,
  onRemove,
  onToggleFeatured,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const itemIds = useMemo(() => gallery.map((g) => g.id), [gallery]);

  const dragLabel = lang === "en" ? "Drag to reorder" : "Arrastrar para reordenar";
  const acceptedLabel = lang === "en" ? "Accepted" : "Aceptada";
  const featuredBadge = lang === "en" ? "Featured" : "Destacada";

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = itemIds.indexOf(String(active.id));
      const newIndex = itemIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const nextGallery = arrayMove(gallery, oldIndex, newIndex);
      const nextFeatured = syncFeaturedOrder(nextGallery, featuredGalleryIds);
      onReorder(nextGallery, nextFeatured);
    },
    [itemIds, gallery, featuredGalleryIds, onReorder],
  );

  if (gallery.length === 0) return null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((g) => {
            const isFeatured = featuredGalleryIds.includes(g.id);
            const fi = isFeatured ? featuredGalleryIds.indexOf(g.id) + 1 : 0;
            return (
              <li key={g.id} className="min-w-0">
                <RestauranteSortableMediaTile
                  id={g.id}
                  dragLabel={dragLabel}
                  variant="gallery"
                  onRemove={() => onRemove(g.id)}
                >
                  <div className="relative aspect-square w-full min-h-[88px] bg-[#F5F0E8]">
                    <Image
                      src={g.url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="(max-width: 640px) 45vw, 140px"
                    />
                    <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {acceptedLabel}
                    </span>
                    <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                      {g.source === "file" ? copy.assetFromFile : copy.assetFromUrl}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleFeatured(g.id);
                      }}
                      className={[
                        "absolute left-1 top-1 z-[5] flex h-8 w-8 touch-manipulation items-center justify-center rounded-full border-2 shadow-md transition",
                        isFeatured
                          ? "border-[#B28A2F] bg-[#FFF3D6] text-[#B28A2F]"
                          : "border-black/25 bg-white text-[#5D4A25] hover:bg-[#FFFCF7]",
                      ].join(" ")}
                      aria-label={copy.featuredToggle}
                      title={copy.featuredToggle}
                    >
                      <FiStar className="h-4 w-4" {...(isFeatured ? { style: { fill: "currentColor" } } : {})} aria-hidden />
                    </button>
                    {isFeatured ? (
                      <span className="pointer-events-none absolute left-1 top-10 rounded bg-[#B28A2F]/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {featuredBadge} {fi}/4
                      </span>
                    ) : null}
                  </div>
                </RestauranteSortableMediaTile>
              </li>
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
