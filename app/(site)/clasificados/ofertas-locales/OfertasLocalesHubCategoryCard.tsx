import Link from "next/link";
import { appendLangToPath } from "@/app/(site)/clasificados/lib/hubUrl";
import { getClasificadosHubPageCopy } from "@/app/lib/clasificados/clasificadosHubPageCopy";
import type { SupportedLang } from "@/app/lib/language";

function OfertasMark() {
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
      <path d="M4 8h16v12H4z" />
      <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

type Props = {
  routeLang: SupportedLang;
  priority?: boolean;
};

export function OfertasLocalesHubCategoryCard({ routeLang, priority }: Props) {
  const hub = getClasificadosHubPageCopy(routeLang);
  const c = {
    title: hub.ofertasLocalesTitle,
    desc: hub.ofertasLocalesDesc,
    browse: hub.ofertasLocalesBrowse,
    publish: hub.ofertasLocalesPublish,
  };
  const browseHref = appendLangToPath("/clasificados/ofertas-locales", routeLang);
  const publishHref = appendLangToPath("/publicar/ofertas-locales", routeLang);

  return (
    <article
      className={`flex h-full min-h-[17.5rem] flex-col rounded-xl border bg-[#FFFDF7] p-5 ${
        priority
          ? "border-[#7A1E2C]/35 border-t-[3px] border-t-[#7A1E2C] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]"
          : "border-[#D6C7AD] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]"
      }`}
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 text-[#2A4536]">
        <OfertasMark />
      </span>
      <h3 className="mt-4 text-base font-bold text-[#1F241C]">{c.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{c.desc}</p>
      <div className="mt-auto flex flex-col gap-4 border-t border-[#D6C7AD]/50 pt-6">
        <Link
          href={browseHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg border border-[#7A1E2C]/35 bg-[#7A1E2C]/5 px-4 py-2.5 text-center text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C]/55 hover:bg-[#7A1E2C]/10"
        >
          {c.browse}
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {c.publish}
        </Link>
      </div>
    </article>
  );
}
