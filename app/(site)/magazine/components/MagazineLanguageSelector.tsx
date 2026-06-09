"use client";

import { useSearchParams } from "next/navigation";
import {
  getMagazineUi,
  resolveMagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";

type MagazineLanguageSelectorProps = {
  /** Base path without query string — kept for API compatibility. */
  basePath?: string;
  className?: string;
  /** When false (default), language is controlled by the global header. */
  showControls?: boolean;
};

/** Magazine reading context — language pills optional (header is source of truth). */
export function MagazineLanguageSelector({
  className,
  showControls = false,
}: MagazineLanguageSelectorProps) {
  const searchParams = useSearchParams();
  const lang = resolveMagazineLang(searchParams?.get("lang"));
  const ui = getMagazineUi(lang);

  return (
    <div className={`min-w-0 ${className ?? ""}`}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
        {ui.languageEyebrow}
      </p>
      <p className="mt-2 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
        {ui.originalMagazineLabel}
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {ui.languageChooserHint}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-[#3D3428]/75 sm:text-sm">
        {lang === "en"
          ? "Use Español / English or Tiếng Việt in the site header for Leonix summary text — this does not translate the full visual magazine."
          : lang === "vi"
            ? "Dùng Español / English hoặc Tiếng Việt trên đầu trang cho tóm tắt Leonix — không dịch toàn bộ tạp chí hình ảnh."
            : "Use Español / English o Tiếng Việt en el encabezado para resúmenes de Leonix — no traduce la revista visual completa."}
      </p>
      {showControls ? (
        <p className="mt-3 text-xs text-[#3D3428]/70">
          {lang === "en"
            ? "Use Español / English or 🌐 Languages in the site header."
            : lang === "vi"
              ? "Dùng Español / English hoặc 🌐 Languages trên đầu trang."
              : "Use Español / English o 🌐 Languages en el encabezado del sitio."}
        </p>
      ) : null}
    </div>
  );
}
