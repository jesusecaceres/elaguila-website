"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COMPRESSION_OPTS = { maxSizeMB: 1, maxWidthOrHeight: 1920 };

export type MediaUploaderProps = {
  images: File[];
  onImagesChange: (files: File[]) => void;
  videoFile: File | null;
  onVideoChange: (file: File | null) => void;
  isPro: boolean;
  maxImages: number;
  lang: "es" | "en";
  uploadProgress?: { current: number; total: number } | null;
  videoPreviewUrl?: string;
  videoError?: string;
  onVideoRemove?: () => void;
  copy?: {
    addImages?: string;
    addVideo?: string;
    video?: string;
    videoHint?: string;
    images?: string;
  };
};

function SortableImageItem({
  file,
  index,
  previewUrl,
  onRemove,
  lang,
  isFirst,
}: {
  file: File;
  index: number;
  previewUrl: string;
  onRemove: () => void;
  lang: "es" | "en";
  isFirst: boolean;
}) {
  const id = String(index);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative overflow-hidden rounded border border-black/10 bg-[#F5F5F5]"
    >
      <img
        src={previewUrl}
        alt=""
        className="w-full h-28 object-cover rounded"
        loading="lazy"
      />
      {isFirst && (
        <div className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-[#111111] border border-black/10">
          {lang === "es" ? "Portada" : "Cover"}
        </div>
      )}
      <div className="absolute top-1 right-1 flex items-center gap-1">
        <button
          type="button"
          className="touch-none rounded border border-black/10 bg-white/90 p-1 text-[#111111] cursor-grab active:cursor-grabbing"
          aria-label={lang === "es" ? "Arrastrar" : "Drag"}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-black text-white w-5 h-5 text-xs flex items-center justify-center"
          aria-label={lang === "es" ? "Quitar" : "Remove"}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function MediaUploader({
  images,
  onImagesChange,
  videoFile,
  onVideoChange,
  isPro,
  maxImages,
  lang,
  uploadProgress,
  videoPreviewUrl = "",
  videoError = "",
  onVideoRemove,
  copy = {},
}: MediaUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const videoCameraRef = useRef<HTMLInputElement | null>(null);
  const videoGalleryRef = useRef<HTMLInputElement | null>(null);
  const [showVideoUpgradeModal, setShowVideoUpgradeModal] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const addImagesRef = useRef<(files: File[]) => void>();
  addImagesRef.current = (newFiles: File[]) => {
    onImagesChange([...images, ...newFiles].slice(0, maxImages));
  };

  const handleImageSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;
      const spaceLeft = maxImages - images.length;
      if (spaceLeft <= 0) return;
      const toAdd = files.slice(0, spaceLeft);
      setCompressing(true);
      try {
        const compressed: File[] = [];
        for (const file of toAdd) {
          if (!file.type.startsWith("image/")) {
            compressed.push(file);
            continue;
          }
          try {
            const c = await imageCompression(file, COMPRESSION_OPTS);
            compressed.push(c);
          } catch {
            compressed.push(file);
          }
        }
        addImagesRef.current?.(compressed);
      } finally {
        setCompressing(false);
        try {
          (event.target as HTMLInputElement).value = "";
        } catch {}
      }
    },
    [images.length, maxImages]
  );

  React.useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = images.length ? Number(active.id) : 0;
        const newIndex = Number(over.id);
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex < images.length && newIndex < images.length) {
          onImagesChange(arrayMove(images, oldIndex, newIndex));
        }
      }
    },
    [images, onImagesChange]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleVideoSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const f = (event.target.files ?? [])[0] || null;
      onVideoChange(f);
      try {
        (event.target as HTMLInputElement).value = "";
      } catch {}
    },
    [onVideoChange]
  );

  const ids = images.map((_, i) => String(i));
  const atLimit = images.length >= maxImages;

  const addImagesLabel = copy.addImages ?? (lang === "es" ? "Agregar fotos" : "Add photos");
  const addVideoLabel = copy.addVideo ?? (lang === "es" ? "Agregar video" : "Add video");
  const videoLabel = copy.video ?? (lang === "es" ? "Video (Pro)" : "Video (Pro)");
  const videoHintLabel = copy.videoHint ?? (lang === "es" ? "1 por anuncio" : "1 per listing");

  return (
    <div className="grid gap-5">
      {/* PHOTOS */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-[#111111]">
            {copy.images ?? (lang === "es" ? "Fotos" : "Photos")}
            <span className="ml-2 text-xs text-[#111111]">
              ({lang === "es" ? "Máx" : "Max"} {maxImages})
            </span>
          </div>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          style={{ display: "none" }}
          aria-hidden
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          style={{ display: "none" }}
          aria-hidden
        />

        <div className="mt-2 text-sm font-medium text-[#111111]">{addImagesLabel}</div>
        <p className="mt-1 text-xs text-[#111111]/70">
          {images.length} {lang === "es" ? "de" : "of"} {maxImages} {lang === "es" ? "fotos usadas" : "photos used"}
        </p>
        <div className="flex gap-3 mt-3">
          <button
            type="button"
            disabled={atLimit || compressing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📷 {lang === "es" ? "Cámara" : "Camera"}
          </button>
          <button
            type="button"
            disabled={atLimit || compressing}
            onClick={() => galleryInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-[#111111] rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🖼 {lang === "es" ? "Galería" : "Gallery"}
          </button>
        </div>

        {uploadProgress && uploadProgress.total > 0 && (
          <div className="mt-2 text-sm text-[#111111]/70">
            {lang === "es" ? "Subiendo" : "Uploading"} {uploadProgress.current} / {uploadProgress.total}
          </div>
        )}

        {compressing && (
          <div className="mt-2 text-xs text-[#111111]/60">
            {lang === "es" ? "Comprimiendo…" : "Compressing…"}
          </div>
        )}

        {images.length === 0 && !compressing && (
          <div className="mt-3 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 text-sm text-[#111111]/55">
            {lang === "es" ? "Agrega por lo menos 1 foto." : "Add at least 1 photo."}
          </div>
        )}

        {images.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {images.map((file, index) => (
                  <SortableImageItem
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    index={index}
                    previewUrl={previewUrls[index] ?? ""}
                    onRemove={() => onImagesChange(images.filter((_, i) => i !== index))}
                    lang={lang}
                    isFirst={index === 0}
                  />
                ))}
                {!atLimit && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={compressing}
                    className="flex h-28 items-center justify-center rounded border border-dashed border-black/20 bg-[#F5F5F5] text-2xl text-[#111111]/50 hover:bg-[#EFEFEF] disabled:opacity-50"
                    aria-label={addImagesLabel}
                  >
                    +
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {atLimit && !isPro && images.length > 0 && (
          <div className="mt-3 rounded-xl border border-[#A98C2A]/30 bg-[#F8F6F0] p-3 text-sm text-[#111111]">
            {lang === "es"
              ? "Límite de fotos alcanzado. Actualiza a Pro para hasta 12 fotos y video."
              : "Photo limit reached. Upgrade to Pro for up to 12 photos and video."}
            <Link href="/dashboard" className="mt-2 inline-block text-sm font-semibold text-[#A98C2A] hover:underline">
              {lang === "es" ? "Ver planes Pro" : "See Pro plans"}
            </Link>
          </div>
        )}
      </div>

      {/* VIDEO */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm text-[#111111]">{videoLabel}</div>
        <div className="mt-1 text-xs text-[#111111]/45">{videoHintLabel}</div>
        <div className="mt-2 text-sm font-medium text-[#111111]">{addVideoLabel}</div>

        <input
          ref={videoCameraRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleVideoSelect}
          style={{ display: "none" }}
          aria-hidden
        />
        <input
          ref={videoGalleryRef}
          type="file"
          accept="video/*"
          onChange={handleVideoSelect}
          style={{ display: "none" }}
          aria-hidden
        />

        <div className="flex gap-3 mt-3">
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                setShowVideoUpgradeModal(true);
                return;
              }
              videoCameraRef.current?.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded"
          >
            🎥 {lang === "es" ? "Cámara" : "Camera"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPro) {
                setShowVideoUpgradeModal(true);
                return;
              }
              videoGalleryRef.current?.click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-[#111111] rounded"
          >
            📁 {lang === "es" ? "Subir video" : "Upload video"}
          </button>
        </div>

        {videoError && <div className="mt-3 text-sm text-red-600">{videoError}</div>}

        {videoFile && videoPreviewUrl && !videoError && (
          <div className="mt-3 rounded-xl border border-black/10 bg-[#F5F5F5] p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#111111]/75 truncate">{videoFile.name}</span>
              <button
                type="button"
                onClick={onVideoRemove}
                className="text-xs rounded-lg border border-black/10 bg-[#F5F5F5] hover:bg-white/10 px-3 py-2 text-[#111111]"
              >
                {lang === "es" ? "Quitar" : "Remove"}
              </button>
            </div>
            <video
              src={videoPreviewUrl}
              controls
              className="rounded-lg mt-3 w-full max-w-md"
              playsInline
            />
          </div>
        )}
      </div>

      {/* Video upgrade modal */}
      {showVideoUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-[#111111]">
                {lang === "es" ? "Sube videos con LEONIX Pro" : "Upload videos with LEONIX Pro"}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#2B2B2B]">
                <li>• {lang === "es" ? "Los videos atraen 3x más compradores" : "Videos attract 3x more buyers"}</li>
                <li>• {lang === "es" ? "Distingue tu anuncio" : "Stand out from your listing"}</li>
                <li>• {lang === "es" ? "Hasta 12 fotos" : "Up to 12 photos"}</li>
                <li>• {lang === "es" ? "2 impulsos de visibilidad" : "2 visibility boosts"}</li>
                <li>• {lang === "es" ? "Duración del anuncio: 30 días" : "Listing duration: 30 days"}</li>
              </ul>
              <p className="mt-4 text-lg font-semibold text-[#111111]">$9.99</p>
              <div className="mt-5 flex gap-3">
                <Link
                  href={`/dashboard?lang=${lang}`}
                  className="flex-1 rounded-xl bg-black px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#333]"
                >
                  {lang === "es" ? "Actualizar a Pro" : "Upgrade to Pro"}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowVideoUpgradeModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-gray-50"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
