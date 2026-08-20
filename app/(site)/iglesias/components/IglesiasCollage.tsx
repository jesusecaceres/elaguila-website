import Image from "next/image";
import { IGLESIAS_EDITORIAL_COLLAGE } from "@/app/lib/iglesias/images";
import type { IglesiasCopy } from "@/app/lib/iglesias/copy";

export function IglesiasCollage({ copy }: { copy: IglesiasCopy }) {
  return (
    <section className="border-b border-[#C9A84A]/30 bg-[#1F241C]" aria-label={copy.collageCaption}>
      <div className="mx-auto grid max-w-[88rem] grid-cols-2 overflow-hidden sm:grid-cols-4">
        {IGLESIAS_EDITORIAL_COLLAGE.map((item) => (
          <div key={item.key} className="relative aspect-[16/10] min-h-[5.5rem] sm:aspect-[5/3] sm:min-h-[7.5rem]">
            <Image src={item.src} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
            <div className="absolute inset-0 bg-[#1F241C]/20" aria-hidden />
          </div>
        ))}
      </div>
      <p className="mx-auto max-w-[88rem] px-4 py-2.5 text-[11px] leading-snug text-[#E8D7B5]/80 sm:px-6 lg:px-8">
        {copy.collageCaption}
      </p>
    </section>
  );
}
