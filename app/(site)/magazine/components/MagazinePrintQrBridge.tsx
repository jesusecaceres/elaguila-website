import Image from "next/image";
import Link from "next/link";
import type { SupportedLang } from "@/app/lib/language";
import {
  LEONIX_LOGO_CLEAN_PATH,
  MAGAZINE_JUNE_2026_QR_IMAGE_PATH,
  MAGAZINE_JUNE_2026_QR_TARGET_URL,
  magazineJune2026ReaderHref,
} from "@/app/lib/magazine/qrBridge";

type MagazinePrintQrBridgeProps = {
  lang: SupportedLang;
  /** Short caption under the QR image. */
  qrCaption: string;
  /** Mobile note — do not scan own screen. */
  mobileNote: string;
  /** CTA for users already on mobile (opens reader with lang). */
  openReaderLabel: string;
  /** Override reader link (e.g. source=print landing). */
  readerHref?: string;
  /** Whether to show the scannable PNG (print context or QR section). */
  showQrImage?: boolean;
  /** compact = smaller QR for Coming Soon section; print = reader source=print block */
  variant?: "compact" | "print";
  tone?: "default" | "onDark";
  className?: string;
};

export function MagazinePrintQrBridge({
  lang,
  qrCaption,
  mobileNote,
  openReaderLabel,
  readerHref: readerHrefOverride,
  showQrImage = true,
  variant = "compact",
  tone = "default",
  className = "",
}: MagazinePrintQrBridgeProps) {
  const readerHref = readerHrefOverride ?? magazineJune2026ReaderHref(lang);
  const qrSize = variant === "print" ? 160 : 128;
  const captionClass =
    tone === "onDark"
      ? "text-[#EDE6D6]/90"
      : "text-[#3D3428]/80";
  const linkClass =
    tone === "onDark"
      ? "text-[#C9A84A] hover:text-[#EDE6D6]"
      : "text-[#7A1E2C] hover:text-[#5e1721]";

  return (
    <div className={`min-w-0 ${className}`}>
      {showQrImage ? (
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <div className="rounded-xl border-2 border-[#1F241C]/15 bg-white p-2.5 shadow-sm">
            <Image
              src={MAGAZINE_JUNE_2026_QR_IMAGE_PATH}
              alt={qrCaption}
              width={qrSize}
              height={qrSize}
              className="h-auto w-[7.5rem] max-w-full sm:w-[8rem]"
              unoptimized
            />
          </div>
          {qrCaption ? (
            <p className={`max-w-xs text-center text-[0.65rem] font-medium leading-snug sm:text-left sm:text-xs ${captionClass}`}>
              {qrCaption}
            </p>
          ) : null}
        </div>
      ) : null}

      {mobileNote ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-3 sm:mt-4 sm:p-4">
          <Image
            src={LEONIX_LOGO_CLEAN_PATH}
            alt=""
            width={28}
            height={28}
            className="mt-0.5 h-7 w-7 shrink-0 object-contain"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm leading-snug text-[#3D3428] sm:text-[0.9375rem] sm:leading-relaxed">
              {mobileNote}
            </p>
            <Link
              href={readerHref}
              className={`mt-2 inline-flex min-h-[2.5rem] items-center text-sm font-bold underline decoration-[#C9A84A]/60 underline-offset-[0.2em] ${linkClass}`}
            >
              {openReaderLabel}
            </Link>
          </div>
        </div>
      ) : openReaderLabel ? (
        <Link
          href={readerHref}
          className={`mt-3 inline-flex min-h-[2.5rem] items-center text-sm font-bold underline decoration-[#C9A84A]/60 underline-offset-[0.2em] ${linkClass}`}
        >
          {openReaderLabel}
        </Link>
      ) : null}

      <p className="sr-only">{MAGAZINE_JUNE_2026_QR_TARGET_URL}</p>
    </div>
  );
}