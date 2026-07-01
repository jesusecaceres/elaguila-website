import Link from "next/link";
import { appendLangToPath } from "@/app/(site)/clasificados/lib/hubUrl";
import { getDealersDeAutosHubCategoryCopy } from "@/app/lib/clasificados/autos/dealersDeAutosHubCategoryCopy";
import type { SupportedLang } from "@/app/lib/language";

function DealerMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2A4536"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M3 10h18v10H3z" />
      <path d="M5 10V7h14v3" />
      <path d="M7 14h4M7 17h6" />
      <circle cx="7.5" cy="20" r="1.5" />
      <circle cx="16.5" cy="20" r="1.5" />
    </svg>
  );
}

type Props = {
  routeLang: SupportedLang;
};

export function DealersDeAutosHubCategoryCard({ routeLang }: Props) {
  const c = getDealersDeAutosHubCategoryCopy(routeLang);
  const browseHref = appendLangToPath("/clasificados/dealers-de-autos", routeLang);
  const publishHref = appendLangToPath("/publicar/autos/negocios", routeLang);

  return (
    <article className="flex h-full min-h-[17.5rem] flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C9A84A]/35 bg-[#FAF6EE] text-[#2A4536]">
        <DealerMark />
      </span>
      <h3 className="mt-4 text-base font-bold text-[#1F241C]">{c.label}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{c.desc}</p>
      <div className="mt-auto flex flex-col gap-4 border-t border-[#D6C7AD]/50 pt-6">
        <Link
          href={browseHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FAF6EE] px-4 py-2.5 text-center text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
        >
          {c.explore}
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {c.post}
        </Link>
      </div>
    </article>
  );
}
