"use client";

import type { ReactNode } from "react";

export function BienesRaicesPrivadoMediaPreviewCard(_props: {
  lang: "es" | "en";
  cardPreviewLabel: string;
  coverImage: string | null | undefined;
  previewPrice: string;
  previewPosted: string;
  previewCity: string;
  details: Record<string, string>;
  formatMoneyMaybe: (raw: string, lang: "es" | "en") => string;
}): ReactNode {
  return null;
}
