"use client";

import { LeonixPreviewGalleryLightbox } from "@/app/clasificados/lib/LeonixPreviewGalleryLightbox";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

type BrPrivadoLightboxVm = { media: BienesRaicesPreviewMediaVm };

/** @deprecated Use `LeonixPreviewGalleryLightbox` — kept for existing imports. */
export function BrPrivadoGalleryLightbox({
  vm,
  open,
  initialIndex,
  onClose,
  lang,
}: {
  vm: BrPrivadoLightboxVm;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  lang?: RentasLandingLang;
}) {
  return <LeonixPreviewGalleryLightbox vm={vm} open={open} initialIndex={initialIndex} onClose={onClose} lang={lang} />;
}
