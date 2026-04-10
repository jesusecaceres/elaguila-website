"use client";

import { LeonixPreviewGalleryLightbox } from "@/app/clasificados/lib/LeonixPreviewGalleryLightbox";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

/** @deprecated Use `LeonixPreviewGalleryLightbox` — kept for existing imports. */
export function BrNegocioGalleryLightbox({
  vm,
  open,
  initialIndex,
  onClose,
}: {
  vm: BienesRaicesNegocioPreviewVm;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  return <LeonixPreviewGalleryLightbox vm={vm} open={open} initialIndex={initialIndex} onClose={onClose} />;
}
