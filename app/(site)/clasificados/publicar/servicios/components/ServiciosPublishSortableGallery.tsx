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

/**
 * One tile in either the featured or remaining-gallery section. `badgeNumber` (when set) shows
 * "N/4" using the tile's position within its own render loop — never a separate `.indexOf()`
 * lookup against a differently-ordered array (that mismatch was the S-032 numbering defect).
 */
function GalleryTile({
  item,
  dragLabel,
  acceptedLabel,
  isFeatured,
  badgeNumber,
  featuredBadge,
  copy,
  onRemove,
  onToggleFeatured,
}: {
  item: GalleryItem;
  dragLabel: string;
  acceptedLabel: string;
  isFeatured: boolean;
  badgeNumber?: number;
  featuredBadge: string;
  copy: Props["copy"];
  onRemove: () => void;
  onToggleFeatured: () => void;
}) {
  return (
    <RestauranteSortableMediaTile id={item.id} dragLabel={dragLabel} variant="gallery" onRemove={onRemove}>
      <div className="relative aspect-square w-full min-h-[88px] bg-[#F5F0E8]">
        <Image
          src={item.url}
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
          {item.source === "file" ? copy.assetFromFile : copy.assetFromUrl}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFeatured();
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
        {isFeatured && badgeNumber ? (
          <span className="pointer-events-none absolute left-1 top-10 rounded bg-[#B28A2F]/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {featuredBadge} {badgeNumber}/4
          </span>
        ) : null}
      </div>
    </RestauranteSortableMediaTile>
  );
}

/**
 * Drag/reorder gallery for Servicios publish — same tile + handle interaction model as Restaurantes.
 *
 * Renders two dedicated sections (matching the public preview's `ServiciosVisualProofRow` +
 * `ServiciosGalleryWithTabs` split): up to 4 featured photos in their own container, in
 * `featuredGalleryIds` order, followed by a visually separate "remaining gallery" section for
 * everything else — instead of one mixed grid distinguished only by a star badge (S-033/S-034).
 * Drag-to-reorder works within each section independently; the star toggle still moves a photo
 * between sections.
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

  const dragLabel = lang === "en" ? "Drag to reorder" : "Arrastrar para reordenar";
  const acceptedLabel = lang === "en" ? "Accepted" : "Aceptada";
  const featuredBadge = lang === "en" ? "Featured" : "Destacada";
  const featuredSectionTitle = lang === "en" ? "Featured photos (up to 4)" : "Fotos destacadas (hasta 4)";
  const featuredSectionHint =
    lang === "en"
      ? "These show first on the listing, in this order."
      : "Estas se muestran primero en el anuncio, en este orden.";
  const remainingSectionTitle = lang === "en" ? "Rest of the gallery" : "Resto de la galería";
  const remainingSectionEmpty =
    lang === "en" ? "All photos are featured." : "Todas las fotos están destacadas.";

  const featuredItems = useMemo(() => {
    const byId = new Map(gallery.map((g) => [g.id, g] as const));
    return featuredGalleryIds
      .map((id) => byId.get(id))
      .filter((g): g is GalleryItem => Boolean(g))
      .slice(0, 4);
  }, [gallery, featuredGalleryIds]);

  const featuredIdSet = useMemo(() => new Set(featuredItems.map((g) => g.id)), [featuredItems]);
  const remainingItems = useMemo(
    () => gallery.filter((g) => !featuredIdSet.has(g.id)),
    [gallery, featuredIdSet],
  );

  const featuredIds = useMemo(() => featuredItems.map((g) => g.id), [featuredItems]);
  const remainingIds = useMemo(() => remainingItems.map((g) => g.id), [remainingItems]);

  const onFeaturedDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = featuredIds.indexOf(String(active.id));
      const newIndex = featuredIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const nextFeaturedIds = arrayMove(featuredIds, oldIndex, newIndex);
      onReorder(gallery, nextFeaturedIds);
    },
    [featuredIds, gallery, onReorder],
  );

  const onRemainingDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = remainingIds.indexOf(String(active.id));
      const newIndex = remainingIds.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;
      const nextRemaining = arrayMove(remainingItems, oldIndex, newIndex);
      const nextGallery = [...featuredItems, ...nextRemaining];
      onReorder(nextGallery, featuredGalleryIds);
    },
    [remainingIds, remainingItems, featuredItems, featuredGalleryIds, onReorder],
  );

  if (gallery.length === 0) return null;

  return (
    <div className="mt-4 space-y-6">
      {featuredItems.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-[#3D2C12]">{featuredSectionTitle}</p>
          <p className="mt-0.5 text-xs text-[#6b5c42]">{featuredSectionHint}</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFeaturedDragEnd}>
            <SortableContext items={featuredIds} strategy={rectSortingStrategy}>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {featuredItems.map((g, i) => (
                  <li key={g.id} className="min-w-0">
                    <GalleryTile
                      item={g}
                      dragLabel={dragLabel}
                      acceptedLabel={acceptedLabel}
                      isFeatured
                      badgeNumber={i + 1}
                      featuredBadge={featuredBadge}
                      copy={copy}
                      onRemove={() => onRemove(g.id)}
                      onToggleFeatured={() => onToggleFeatured(g.id)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      <div>
        <p className="text-sm font-semibold text-[#3D2C12]">{remainingSectionTitle}</p>
        {remainingItems.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRemainingDragEnd}>
            <SortableContext items={remainingIds} strategy={rectSortingStrategy}>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {remainingItems.map((g) => (
                  <li key={g.id} className="min-w-0">
                    <GalleryTile
                      item={g}
                      dragLabel={dragLabel}
                      acceptedLabel={acceptedLabel}
                      isFeatured={false}
                      featuredBadge={featuredBadge}
                      copy={copy}
                      onRemove={() => onRemove(g.id)}
                      onToggleFeatured={() => onToggleFeatured(g.id)}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="mt-2 text-xs text-[#8a7a62]">{remainingSectionEmpty}</p>
        )}
      </div>
    </div>
  );
}
