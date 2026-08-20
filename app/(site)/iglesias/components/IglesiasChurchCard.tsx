import Link from "next/link";
import { googleDirectionsHref, telHref, type IglesiasCopy, iglesiasLanguageLabel } from "@/app/lib/iglesias/copy";
import { iglesiasNeedLabel } from "@/app/lib/iglesias/taxonomy";
import type { PublicChurchCard } from "@/app/lib/iglesias/types";
import { IglesiasSafeImage } from "./IglesiasSafeImage";

export function IglesiasChurchCard({
  church,
  copy,
  lang,
}: {
  church: PublicChurchCard;
  copy: IglesiasCopy;
  lang: "es" | "en";
}) {
  const imgSrc = church.heroUrl || church.logoUrl;
  const detailHref = `/iglesias/${encodeURIComponent(church.slug)}?lang=${lang}`;
  const typeLine = [church.denomination || church.churchType, church.city].filter(Boolean).join(" · ");

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#D6C7AD]/80 border-t-[3px] border-t-[#C9A84A] bg-[#FFFDF7] shadow-[0_16px_36px_-24px_rgba(31,36,28,0.45)]">
      <IglesiasSafeImage
        src={imgSrc}
        alt={imgSrc ? church.imageAlt || church.name : ""}
        className="aspect-[16/10] w-full"
        fallbackLabel=""
      />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-xl font-bold leading-snug text-[#1F241C]">
          <Link href={detailHref} className="hover:text-[#7A1E2C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]">
            {church.name}
          </Link>
        </h3>
        {typeLine ? <p className="mt-1 text-sm text-[#5C5346]">{typeLine}</p> : null}
        {church.languages.length ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#2A4536]">
            {church.languages.map((l) => iglesiasLanguageLabel(l, lang)).join(" · ")}
          </p>
        ) : null}
        {church.nextServiceSummary ? <p className="mt-2 text-sm text-[#3D3428]">{church.nextServiceSummary}</p> : null}
        {church.needKeys.length ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {church.needKeys.map((key) => (
              <li key={key} className="rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C5346]">
                {iglesiasNeedLabel(key, lang)}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={detailHref}
            className="inline-flex min-h-11 items-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-semibold text-white hover:bg-[#6B1A26]"
          >
            {copy.cardView}
          </Link>
          {church.publicLocation && church.addressLine1 ? (
            <a
              href={googleDirectionsHref(church.addressLine1)}
              className="inline-flex min-h-11 items-center rounded-lg border border-[#D6C7AD] px-4 text-sm font-semibold text-[#3D3428] hover:bg-[#FAF6EE]"
              rel="noreferrer"
              target="_blank"
            >
              {copy.cardDirections}
            </a>
          ) : null}
          {church.phone ? (
            <a href={telHref(church.phone)} className="inline-flex min-h-11 items-center rounded-lg border border-[#D6C7AD] px-4 text-sm font-semibold text-[#3D3428] hover:bg-[#FAF6EE]">
              {copy.cardCall}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
