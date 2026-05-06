"use client";

import { useCallback, type ReactNode } from "react";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { isRestauranteDisplayableImageRef, isRestauranteLocalVideoDataUrl } from "./restauranteMediaDisplay";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { resolveRestauranteGallerySequence } from "./restauranteGalleryMediaSequence";
import { RestauranteBucketSortableGrid } from "./RestauranteBucketSortableGrid";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

const MAX_IMAGES_PER_BUCKET = 12;

interface RestaurantePublishMediaBucketsProps {
  draft: RestauranteListingDraft;
  onChange: (patch: RestauranteDraftPatch) => void;
}

export function RestaurantePublishMediaBuckets({ 
  draft, 
  onChange 
}: RestaurantePublishMediaBucketsProps) {
  // Comida bucket handlers
  const addFoodImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const processed = await Promise.all(
      imageFiles.map(async (f) => await readRestauranteImageAsDataUrl(f))
    );
    
    const current = draft.foodImages ?? [];
    onChange({
      foodImages: [...current, ...processed].slice(0, MAX_IMAGES_PER_BUCKET),
    });
  }, [draft.foodImages, onChange]);

  const removeFoodImage = useCallback((index: number) => {
    const current = draft.foodImages ?? [];
    onChange({
      foodImages: current.filter((_, i) => i !== index),
    });
  }, [draft.foodImages, onChange]);

  // Interior bucket handlers
  const addInteriorImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const processed = await Promise.all(
      imageFiles.map(async (f) => await readRestauranteImageAsDataUrl(f))
    );
    
    const current = draft.interiorImages ?? [];
    onChange({
      interiorImages: [...current, ...processed].slice(0, MAX_IMAGES_PER_BUCKET),
    });
  }, [draft.interiorImages, onChange]);

  const removeInteriorImage = useCallback((index: number) => {
    const current = draft.interiorImages ?? [];
    onChange({
      interiorImages: current.filter((_, i) => i !== index),
    });
  }, [draft.interiorImages, onChange]);

  // Exterior bucket handlers
  const addExteriorImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const processed = await Promise.all(
      imageFiles.map(async (f) => await readRestauranteImageAsDataUrl(f))
    );
    
    const current = draft.exteriorImages ?? [];
    onChange({
      exteriorImages: [...current, ...processed].slice(0, MAX_IMAGES_PER_BUCKET),
    });
  }, [draft.exteriorImages, onChange]);

  const removeExteriorImage = useCallback((index: number) => {
    const current = draft.exteriorImages ?? [];
    onChange({
      exteriorImages: current.filter((_, i) => i !== index),
    });
  }, [draft.exteriorImages, onChange]);

  // Video handlers (local draft only; keeps `galleryMediaSequence` in sync with preview strip)
  const addVideoFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const videoFiles = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (videoFiles.length === 0) return;

    const file = videoFiles[0];
    const dataUrl = await readFileAsDataUrl(file);
    const t = typeof dataUrl === "string" ? dataUrl.trim() : "";
    if (!t || !/^data:video/i.test(t)) return;

    onChange((prev) => {
      let seq = prev.galleryMediaSequence ?? resolveRestauranteGallerySequence({ ...prev, videoFile: t });
      if (!seq.includes("v")) seq = [...seq, "v"];
      return { videoFile: t, videoUrl: undefined, galleryMediaSequence: seq };
    });
  }, [onChange]);

  const removeVideoFile = useCallback(() => {
    onChange((prev) => {
      const after = { ...prev, videoFile: undefined as string | undefined };
      const seq = resolveRestauranteGallerySequence(after);
      return {
        videoFile: undefined,
        galleryMediaSequence: seq.length ? seq : undefined,
      };
    });
  }, [onChange]);

  const foodCount = draft.foodImages?.length ?? 0;
  const interiorCount = draft.interiorImages?.length ?? 0;
  const exteriorCount = draft.exteriorImages?.length ?? 0;
  const foodOk = (draft.foodImages ?? []).filter((u) => isRestauranteDisplayableImageRef(u)).length;
  const interiorOk = (draft.interiorImages ?? []).filter((u) => isRestauranteDisplayableImageRef(u)).length;
  const exteriorOk = (draft.exteriorImages ?? []).filter((u) => isRestauranteDisplayableImageRef(u)).length;
  const hasLocalVideo = !!(draft.videoFile?.trim() && isRestauranteLocalVideoDataUrl(draft.videoFile));

  return (
    <div className="space-y-8">
      <BucketBlock
        title="🍽️ Comida"
        description="Fotos de los platos, bebidas y presentación culinaria. Aparecen en la ficha bajo la categoría comida."
        dropAdd={(fl) => void addFoodImages(fl)}
        uploadSlot={
          <RestauranteUploadRow
            buttonLabel="Agregar fotos de comida"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={foodCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={
              foodCount > 0 ? `${foodCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}` : null
            }
            onFilesSelected={(fl) => void addFoodImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos de comida."
        sortable={
          <RestauranteBucketSortableGrid field="foodImages" draft={draft} setDraftPatch={onChange} />
        }
        showEmptyHint={foodOk === 0}
      />

      <BucketBlock
        title="🏠 Interior"
        description="Fotos del ambiente interior, decoración, mesas, barra y espacios del restaurante."
        dropAdd={(fl) => void addInteriorImages(fl)}
        uploadSlot={
          <RestauranteUploadRow
            buttonLabel="Agregar fotos del interior"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={interiorCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={
              interiorCount > 0 ? `${interiorCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}` : null
            }
            onFilesSelected={(fl) => void addInteriorImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos del interior."
        sortable={
          <RestauranteBucketSortableGrid field="interiorImages" draft={draft} setDraftPatch={onChange} />
        }
        showEmptyHint={interiorOk === 0}
      />

      <BucketBlock
        title="🌿 Exterior"
        description="Fotos de la fachada, terraza, estacionamiento, entrada y vistas exteriores del restaurante."
        dropAdd={(fl) => void addExteriorImages(fl)}
        uploadSlot={
          <RestauranteUploadRow
            buttonLabel="Agregar fotos del exterior"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={exteriorCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={
              exteriorCount > 0 ? `${exteriorCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}` : null
            }
            onFilesSelected={(fl) => void addExteriorImages(fl)}
          />
        }
        emptyHint="Aún no hay fotos del exterior."
        sortable={
          <RestauranteBucketSortableGrid field="exteriorImages" draft={draft} setDraftPatch={onChange} />
        }
        showEmptyHint={exteriorOk === 0}
      />

      {/* Video — local file only in this bucket; URL field stays below in parent */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">🎥 Video</h3>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            Archivo local en el borrador (sin Mux). En la ficha, el archivo local tiene prioridad sobre la URL si ambos
            existieran.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4">
          <RestauranteUploadRow
            buttonLabel="Subir video"
            helperText="Un archivo local; vista previa debajo."
            accept="video/*"
            disabled={hasLocalVideo}
            selectedLabel={hasLocalVideo ? "Video en el borrador" : null}
            onFilesSelected={(fl) => void addVideoFile(fl)}
          />
          {hasLocalVideo && draft.videoFile ? (
            <BucketVideoPreview src={draft.videoFile} onRemove={removeVideoFile} />
          ) : (
            <p className="mt-2 text-xs text-[color:var(--lx-muted)]">Aún no hay video local.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BucketBlock({
  title,
  description,
  uploadSlot,
  dropAdd,
  sortable,
  emptyHint,
  showEmptyHint,
}: {
  title: string;
  description: string;
  uploadSlot: ReactNode;
  dropAdd: (files: FileList) => void;
  sortable: ReactNode;
  emptyHint: string;
  showEmptyHint: boolean;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">{description}</p>
      </div>

      <div
        className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const fl = e.dataTransfer.files;
          if (fl && fl.length) dropAdd(fl);
        }}
      >
        {uploadSlot}
        {sortable}
        {showEmptyHint ? <p className="mt-2 text-xs text-[color:var(--lx-muted)]">{emptyHint}</p> : null}
      </div>
    </div>
  );
}

function BucketVideoPreview({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-sm">
      <div className="relative aspect-video max-h-[280px] w-full bg-black/80">
        <video src={src} controls className="h-full w-full object-contain" preload="metadata" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--lx-nav-border)] bg-white/90 px-3 py-2">
        <span className="text-xs font-semibold text-[color:var(--lx-text-2)]">Video local (borrador)</span>
        <button
          type="button"
          className="text-xs font-semibold text-red-800 underline"
          onClick={onRemove}
        >
          Quitar video
        </button>
      </div>
    </div>
  );
}
