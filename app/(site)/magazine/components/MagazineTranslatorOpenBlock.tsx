import Image from "next/image";
import Link from "next/link";
import {
  PRINT_TRANSLATOR_OPEN,
  TRANSLATOR_GATEWAY_PATH,
  TRANSLATOR_OPEN_QR_IMAGE_PATH,
} from "@/app/lib/magazine/translatorGateway";

const btnPrimary =
  "inline-flex min-h-[3rem] w-full min-w-0 items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-3 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:min-h-[3.125rem] sm:w-auto sm:px-6";

/** High-priority translator-open QR + action on the print help landing. */
export function MagazineTranslatorOpenBlock() {
  return (
    <section
      className="mt-4 rounded-2xl border-2 border-[#7A1E2C]/25 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-4 shadow-sm ring-1 ring-[#C9A84A]/30 sm:p-5"
      aria-labelledby="print-translator-open-title"
    >
      <h2
        id="print-translator-open-title"
        className="font-serif text-base font-bold text-[#7A1E2C] sm:text-lg"
      >
        {PRINT_TRANSLATOR_OPEN.heading.en}
        <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">
          {PRINT_TRANSLATOR_OPEN.heading.es}
        </span>
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        <span lang="en">{PRINT_TRANSLATOR_OPEN.copy.en}</span>
        <span className="mt-1 block" lang="es">
          {PRINT_TRANSLATOR_OPEN.copy.es}
        </span>
      </p>

      <div className="mt-4 flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="shrink-0 rounded-xl border-2 border-[#1F241C]/10 bg-white p-2.5 shadow-sm">
          <Image
            src={TRANSLATOR_OPEN_QR_IMAGE_PATH}
            alt={PRINT_TRANSLATOR_OPEN.qrLabel.en}
            width={112}
            height={112}
            className="h-24 w-24 sm:h-28 sm:w-28"
            unoptimized
          />
          <p className="mt-2 max-w-[9rem] text-center text-[0.65rem] font-medium leading-snug text-[#3D3428]/85">
            {PRINT_TRANSLATOR_OPEN.qrLabel.en}
            <span className="mt-0.5 block" lang="es">
              {PRINT_TRANSLATOR_OPEN.qrLabel.es}
            </span>
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Link href={TRANSLATOR_GATEWAY_PATH} className={btnPrimary}>
            {PRINT_TRANSLATOR_OPEN.openButton.en}
            <span className="sr-only"> / {PRINT_TRANSLATOR_OPEN.openButton.es}</span>
          </Link>
          <p className="text-[0.6875rem] leading-relaxed text-[#3D3428]/75 sm:text-xs">
            <span lang="en">{PRINT_TRANSLATOR_OPEN.disclaimer.en}</span>
            <span className="mt-1 block" lang="es">
              {PRINT_TRANSLATOR_OPEN.disclaimer.es}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
