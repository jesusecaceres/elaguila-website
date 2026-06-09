"use client";

import {
  PRINT_FORMAT_GUIDE,
  PRINT_QUICK_HELP,
  PRINT_VISUAL_STEPS,
} from "@/app/lib/magazine/printVisualInstructions";

function FormatBlock({
  headingEn,
  headingEs,
  stepsEn,
  stepsEs,
  browserNote,
}: {
  headingEn: string;
  headingEs: string;
  stepsEn: readonly string[];
  stepsEs: readonly string[];
  browserNote?: { en: string; es: string };
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#D6C7AD]/70 bg-[#FFFDF7] p-4 sm:p-5">
      <h3 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
        {headingEn}
        <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">{headingEs}</span>
      </h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {stepsEn.map((step, i) => (
          <li key={`en-${i}`}>
            <span lang="en">{step}</span>
            <span className="mt-1 block text-[#3D3428]/85" lang="es">
              {stepsEs[i]}
            </span>
          </li>
        ))}
      </ul>
      {browserNote ? (
        <p className="mt-3 rounded-lg border border-[#C9A84A]/35 bg-[#FBF7EF] px-3 py-2.5 text-xs leading-relaxed text-[#3D3428] sm:text-sm">
          <span lang="en">{browserNote.en}</span>
          <span className="mt-1 block" lang="es">
            {browserNote.es}
          </span>
        </p>
      ) : null}
    </div>
  );
}

/** Universal QR print landing — camera translation instructions; does not depend on ?lang=. */
export function MagazinePrintVisualGuide() {
  return (
    <section
      className="mt-4 rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FBF7EF] p-4 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84A]/25 sm:mt-6 sm:p-6 lg:p-8"
      aria-labelledby="print-visual-title"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
        <span lang="en">FROM PRINT · QR</span>
        <span className="mx-1.5 text-[#C9A84A]" aria-hidden>
          ·
        </span>
        <span lang="es">DESDE IMPRESO · QR</span>
      </p>

      <h1
        id="print-visual-title"
        className="mt-3 font-serif text-2xl font-bold leading-tight tracking-tight text-[#2A4536] sm:text-3xl"
      >
        <span lang="en">SCAN → TRANSLATE → READ</span>
        <span className="mt-1 block text-xl text-[#556B3E] sm:text-2xl" lang="es">
          ESCANEA → TRADUCE → LEE
        </span>
      </h1>

      <p className="mt-3 max-w-2xl text-base font-semibold leading-snug text-[#1F241C] sm:text-lg">
        <span lang="en">
          Use your phone camera translation tools to read this Spanish magazine.
        </span>
        <span className="mt-2 block text-[#3D3428]" lang="es">
          Usa las herramientas de traducción con cámara de tu teléfono para leer esta revista en
          español.
        </span>
      </p>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">
          <span lang="en">Visual steps</span>
          <span className="mx-1.5" aria-hidden>
            /
          </span>
          <span lang="es">Pasos visuales</span>
        </p>
        <ol className="mt-2 grid list-none gap-2.5 p-0 sm:grid-cols-2 sm:gap-3">
          {PRINT_VISUAL_STEPS.en.map((stepEn, index) => (
            <li
              key={index}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-3.5 shadow-sm sm:p-4"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] text-sm font-bold text-[#FFFDF7]"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold leading-snug text-[#1F241C] sm:text-[0.9375rem]" lang="en">
                  {stepEn}
                </p>
                <p
                  className="mt-1 text-sm leading-snug text-[#3D3428]/85 sm:text-[0.9375rem]"
                  lang="es"
                >
                  {PRINT_VISUAL_STEPS.es[index]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-xl border border-[#C9A84A]/40 bg-[#FBF7EF] p-4 sm:p-5">
        <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
          {PRINT_QUICK_HELP.heading.en}
          <span className="mt-0.5 block text-sm font-semibold text-[#556B3E]">
            {PRINT_QUICK_HELP.heading.es}
          </span>
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#3D3428]/80 sm:text-sm">
          {PRINT_QUICK_HELP.disclaimer.en}
          <span className="mt-1 block" lang="es">
            {PRINT_QUICK_HELP.disclaimer.es}
          </span>
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#3D3428]">
          <li lang="es" className="rounded-lg bg-[#FFFDF7] px-3 py-2.5 ring-1 ring-[#D6C7AD]/60">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#556B3E]">
              Español
            </span>
            <p className="mt-1">{PRINT_QUICK_HELP.lines.es}</p>
          </li>
          <li lang="en" className="rounded-lg bg-[#FFFDF7] px-3 py-2.5 ring-1 ring-[#D6C7AD]/60">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#556B3E]">
              English
            </span>
            <p className="mt-1">{PRINT_QUICK_HELP.lines.en}</p>
          </li>
          <li lang="vi" className="rounded-lg bg-[#FFFDF7] px-3 py-2.5 ring-1 ring-[#D6C7AD]/60">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#556B3E]">
              Tiếng Việt
            </span>
            <p className="mt-1">{PRINT_QUICK_HELP.lines.vi}</p>
          </li>
          <li lang="tl" className="rounded-lg bg-[#FFFDF7] px-3 py-2.5 ring-1 ring-[#D6C7AD]/60">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#556B3E]">
              Tagalog
            </span>
            <p className="mt-1">{PRINT_QUICK_HELP.lines.tl}</p>
          </li>
          <li lang="zh" className="rounded-lg bg-[#FFFDF7] px-3 py-2.5 ring-1 ring-[#D6C7AD]/60">
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-[#556B3E]">
              中文
            </span>
            <p className="mt-1">{PRINT_QUICK_HELP.lines.zh}</p>
          </li>
        </ul>
      </div>

      <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-2">
        <FormatBlock
          headingEn={PRINT_FORMAT_GUIDE.printed.heading.en}
          headingEs={PRINT_FORMAT_GUIDE.printed.heading.es}
          stepsEn={PRINT_FORMAT_GUIDE.printed.steps.en}
          stepsEs={PRINT_FORMAT_GUIDE.printed.steps.es}
        />
        <FormatBlock
          headingEn={PRINT_FORMAT_GUIDE.digital.heading.en}
          headingEs={PRINT_FORMAT_GUIDE.digital.heading.es}
          stepsEn={PRINT_FORMAT_GUIDE.digital.steps.en}
          stepsEs={PRINT_FORMAT_GUIDE.digital.steps.es}
          browserNote={PRINT_FORMAT_GUIDE.digital.browserNote}
        />
      </div>
    </section>
  );
}
