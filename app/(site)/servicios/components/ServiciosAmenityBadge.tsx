"use client";

import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import {
  getServiciosAmenityOption,
  isServiciosAmenityOptionId,
} from "../lib/serviciosAmenitiesCatalog";

export function ServiciosAmenityBadge({
  lang,
  standardId,
  customLabel,
  compact,
}: {
  lang: ServiciosLang;
  standardId?: string | null;
  customLabel?: string | null;
  compact?: boolean;
}) {
  const isStd = standardId != null && typeof standardId === "string" && isServiciosAmenityOptionId(standardId);
  const text = isStd ? getServiciosAmenityOption(standardId).label[lang] : (customLabel ?? "").trim();
  const emoji = isStd ? getServiciosAmenityOption(standardId).emoji : "✨";

  const gap = compact ? "gap-1.5" : "gap-2";
  const textCls = compact ? "text-xs font-medium" : "text-sm font-medium";

  return (
    <span className={`inline-flex min-w-0 items-center ${gap} ${textCls} text-[color:var(--lx-text)]`}>
      <span className="select-none text-base leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="min-w-0 leading-snug">{text}</span>
    </span>
  );
}

