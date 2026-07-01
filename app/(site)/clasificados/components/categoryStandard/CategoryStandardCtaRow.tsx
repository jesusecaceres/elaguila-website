import Link from "next/link";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { categoryStandardUi } from "./categoryStandardTheme";

type Props = {
  lang: Lang;
  publishHref: string;
  browseHref: string;
  publishLabel?: string;
  browseLabel?: string;
  className?: string;
  /** When true, only show publish CTA (browse lives elsewhere, e.g. search row). */
  hideBrowse?: boolean;
};

export function CategoryStandardCtaRow({
  lang,
  publishHref,
  browseHref,
  publishLabel,
  browseLabel,
  className = "",
  hideBrowse = false,
}: Props) {
  const ui = categoryStandardUi(lang);
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${className}`.trim()}>
      <Link
        href={publishHref}
        className="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:flex-none sm:min-w-[10rem]"
      >
        {publishLabel}
      </Link>
      {!hideBrowse ? (
        <Link
          href={browseHref}
          className="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-lg border-2 border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] sm:flex-none sm:min-w-[10rem]"
        >
          {browseLabel ?? ui.viewAll}
        </Link>
      ) : null}
    </div>
  );
}
