"use client";

import {
  getMagazineUi,
  type MagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";
import { MagazinePrintQrBridge } from "@/app/(site)/magazine/components/MagazinePrintQrBridge";

type MagazinePrintSourceIntroProps = {
  lang: MagazineLang;
};

export function MagazinePrintSourceIntro({ lang }: MagazinePrintSourceIntroProps) {
  const ui = getMagazineUi(lang);

  return (
    <section
      className="mt-6 rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-5 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.15)] ring-1 ring-[#C9A84A]/20 sm:p-7"
      aria-labelledby="print-source-title"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
        {ui.printSourceBadge}
      </p>
      <h2
        id="print-source-title"
        className="mt-2 font-serif text-xl font-bold leading-snug text-[#2A4536] sm:text-2xl"
      >
        {ui.printSourceTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {ui.printSourceIntro}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        <li>{ui.printSourceStepScan}</li>
        <li>{ui.printSourceStepLanguage}</li>
        <li>{ui.printSourceStepHighlights}</li>
        <li>{ui.printSourceStepOriginal}</li>
      </ul>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <MagazinePrintQrBridge
          lang={lang}
          qrCaption={ui.printQrCaption}
          mobileNote={ui.printSourceMobileNote}
          openReaderLabel={ui.openLanguageReader}
          variant="print"
          showQrImage
        />
      </div>
    </section>
  );
}
