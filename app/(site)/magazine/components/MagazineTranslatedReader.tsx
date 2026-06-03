"use client";

import Link from "next/link";
import {
  MAGAZINE_UI,
  READER_SECTIONS,
  readerCtaHref,
  type MagazineLang,
} from "@/app/(site)/magazine/2026/june/issueContent";

type MagazineTranslatedReaderProps = {
  lang: MagazineLang;
  /** Hub shows first 3 sections + link; read page shows all */
  variant?: "preview" | "full";
  readMoreHref?: string;
};

export function MagazineTranslatedReader({
  lang,
  variant = "full",
  readMoreHref,
}: MagazineTranslatedReaderProps) {
  const ui = MAGAZINE_UI[lang];
  const sections = READER_SECTIONS[lang];
  const visible = variant === "preview" ? sections.slice(0, 3) : sections;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7] px-4 py-3 sm:px-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
          {ui.readerPreviewBadge}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#3D3428]">{ui.readerPreviewIntro}</p>
      </div>

      <div className="space-y-5">
        {visible.map((section) => (
          <article
            key={section.id}
            className="rounded-xl border border-[#D6C7AD] bg-[#FAF6EE]/60 p-5 sm:p-6"
          >
            <h3 className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">{section.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{section.body}</p>
            {section.bullets?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#3D3428]">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.ctaKey && section.ctaLabel ? (
              <Link
                href={readerCtaHref(section.ctaKey, lang)}
                className="mt-4 inline-flex min-h-[2.5rem] items-center justify-center rounded-full border-2 border-[#7A1E2C]/75 bg-[#FFFDF7] px-5 py-2 text-sm font-bold text-[#7A1E2C] transition hover:bg-[#FBF7EF]"
                {...(section.ctaKey === "mediaKit"
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {section.ctaLabel}
              </Link>
            ) : null}
          </article>
        ))}
      </div>

      {variant === "preview" && readMoreHref ? (
        <Link
          href={readMoreHref}
          className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#2A4536] px-7 py-2.5 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#223528]"
        >
          {ui.openFullReader}
        </Link>
      ) : null}
    </div>
  );
}
