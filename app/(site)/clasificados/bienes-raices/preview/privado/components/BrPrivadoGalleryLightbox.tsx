"use client";

import { LeonixPreviewGalleryLightbox } from "@/app/clasificados/lib/LeonixPreviewGalleryLightbox";
import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

type BrPrivadoLightboxVm = { media: BienesRaicesPreviewMediaVm };

/** @deprecated Use `LeonixPreviewGalleryLightbox` — kept for existing imports. */
export function BrPrivadoGalleryLightbox({
  vm,
  open,
  initialIndex,
  onClose,
}: {
  vm: BrPrivadoLightboxVm;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
}) {
  return <LeonixPreviewGalleryLightbox vm={vm} open={open} initialIndex={initialIndex} onClose={onClose} />;
}
