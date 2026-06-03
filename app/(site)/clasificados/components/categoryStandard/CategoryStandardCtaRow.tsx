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
};

export function CategoryStandardCtaRow({
  lang,
  publishHref,
  browseHref,
  publishLabel,
  browseLabel,
  className = "",
}: Props) {
  const ui = categoryStandardUi(lang);
  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${className}`.trim()}>
      <Link
        href={publishHref}
        className="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-lg bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:flex-none sm:min-w-[11rem]"
      >
        {publishLabel}
      </Link>
      <Link
        href={browseHref}
        className="inline-flex min-h-[2.75rem] flex-1 items-center justify-center rounded-lg border-2 border-[#C9A84A]/60 bg-[#FFFDF7] px-5 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] sm:flex-none sm:min-w-[11rem]"
      >
        {browseLabel ?? ui.viewAll}
      </Link>
    </div>
  );
}
