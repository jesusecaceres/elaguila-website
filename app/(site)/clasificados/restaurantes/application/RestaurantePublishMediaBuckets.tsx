"use client";

import { useCallback, useMemo } from "react";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { isRestauranteDisplayableImageRef, isRestauranteLocalVideoDataUrl } from "./restauranteMediaDisplay";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import { readRestauranteImageAsDataUrl } from "./compressRestauranteImage";
import type { RestauranteDraftPatch } from "./useRestauranteDraft";
import { RestauranteUploadRow } from "./RestauranteUploadRow";

const MAX_IMAGES_PER_BUCKET = 12;
const MAX_VIDEOS = 2;

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

  // Video handlers
  const addVideoFile = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const videoFiles = Array.from(files).filter((f) => f.type.startsWith("video/"));
    if (videoFiles.length === 0) return;
    
    const file = videoFiles[0];
    const dataUrl = await readFileAsDataUrl(file);
    
    onChange({
      videoFile: dataUrl,
    });
  }, [onChange]);

  const removeVideoFile = useCallback(() => {
    onChange({ videoFile: undefined });
  }, [onChange]);

  const foodCount = draft.foodImages?.length ?? 0;
  const interiorCount = draft.interiorImages?.length ?? 0;
  const exteriorCount = draft.exteriorImages?.length ?? 0;
  const hasVideo = draft.videoFile !== undefined;

  return (
    <div className="space-y-8">
      {/* Comida Bucket - Primary */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">🍽️ Comida</h3>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            Fotos de los platos, bebidas y presentación culinaria. Esta es la galería principal que se mostrará primero en la vista previa.
          </p>
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
            if (fl && fl.length) void addFoodImages(fl);
          }}
        >
          <RestauranteUploadRow
            buttonLabel="Agregar fotos de comida"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={foodCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={
              foodCount > 0 
                ? `${foodCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}`
                : null
            }
            onFilesSelected={(fl) => void addFoodImages(fl)}
          />
        </div>
      </div>

      {/* Interior Bucket */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">🏠 Interior</h3>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            Fotos del ambiente interior, decoración, mesas, barra y espacios del restaurante.
          </p>
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
            if (fl && fl.length) void addInteriorImages(fl);
          }}
        >
          <RestauranteUploadRow
            buttonLabel="Agregar fotos del interior"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={interiorCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={
              interiorCount > 0 
                ? `${interiorCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}`
                : null
            }
            onFilesSelected={(fl) => void addInteriorImages(fl)}
          />
        </div>
      </div>

      {/* Exterior Bucket */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">🌿 Exterior</h3>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            Fotos de la fachada, terraza, estacionamiento, entrada y vistas exteriores del restaurante.
          </p>
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
            if (fl && fl.length) void addExteriorImages(fl);
          }}
        >
          <RestauranteUploadRow
            buttonLabel="Agregar fotos del exterior"
            helperText="Varias a la vez, o arrastra imágenes aquí."
            accept="image/*"
            multiple
            disabled={exteriorCount >= MAX_IMAGES_PER_BUCKET}
            selectedLabel={
              exteriorCount > 0 
                ? `${exteriorCount} foto(s) · máx. ${MAX_IMAGES_PER_BUCKET}`
                : null
            }
            onFilesSelected={(fl) => void addExteriorImages(fl)}
          />
        </div>
      </div>

      {/* Video Section */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[color:var(--lx-text)]">🎥 Video</h3>
          <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-muted)]">
            Video del restaurante (máximo 2 videos). Se mostrará en una sección separada de las fotos.
          </p>
        </div>
        
        <div
          className="rounded-xl border border-dashed border-[color:var(--lx-nav-border)]/80 bg-[color:var(--lx-section)]/30 p-4"
        >
          <RestauranteUploadRow
            buttonLabel="Subir video"
            helperText="Archivo local (vista previa en el borrador)."
            accept="video/*"
            disabled={hasVideo}
            selectedLabel={hasVideo ? "Video en el borrador" : null}
            onFilesSelected={(fl) => void addVideoFile(fl)}
          />
        </div>
      </div>
    </div>
  );
}
