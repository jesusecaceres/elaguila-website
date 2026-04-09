import Image from "next/image";
import { FaChevronDown } from "react-icons/fa";
import type { JobFairPromoSample } from "../data/empleosResultsSampleData";

type Props = {
  promo: JobFairPromoSample;
};

export function JobFairPromoCard({ promo }: Props) {
  return (
    <article className="overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_8px_32px_rgba(30,24,16,0.1)]">
      <div className="flex flex-col lg:flex-row lg:min-h-[220px]">
        <div className="relative aspect-[16/10] w-full shrink-0 lg:aspect-auto lg:w-[42%] lg:max-w-xl">
          <Image
            src={promo.imageSrc}
            alt={promo.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 42vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a5f]/90 via-[#1e3a5f]/40 to-transparent lg:bg-gradient-to-r lg:from-[#1e3a5f]/85 lg:via-[#1e3a5f]/35 lg:to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 lg:bottom-auto lg:left-6 lg:top-1/2 lg:right-8 lg:-translate-y-1/2">
            <p className="text-2xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-3xl">
              {promo.title}
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-4 p-6 sm:p-8">
          <div className="space-y-1 text-[color:var(--lx-text)]">
            <p className="text-sm font-semibold sm:text-base">
              {promo.dateLine}
              <span className="mx-2 text-[color:var(--lx-muted)]">|</span>
              {promo.timeLine}
            </p>
            <p className="text-sm text-[color:var(--lx-text-2)]">{promo.venue}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#2563EB] bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
            >
              Más detalles
              <FaChevronDown className="h-3.5 w-3.5 opacity-90" aria-hidden />
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg bg-[#C41E3A] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#A01830]"
            >
              ¡Infórmate y participa!
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
