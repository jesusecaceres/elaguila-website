"use client";

import Image from "next/image";
import Link from "next/link";
import type { AutosPublicBlueprintCopy } from "../lib/autosPublicBlueprintCopy";
import { AUTOS_LANDING_BODYSTYLE_IMAGES } from "./autosLandingBrowseAssets";

export function BodyStyleBrowseSection({
  copy,
  tiles,
}: {
  copy: AutosPublicBlueprintCopy;
  tiles: { href: string; label: string; imageKey: keyof typeof AUTOS_LANDING_BODYSTYLE_IMAGES }[];
}) {
  return (
    <section className="mx-auto w-full max-w-[1280px] min-w-0 px-4 sm:px-5 md:px-6">
      <h2 className="border-l-[3px] border-[color:var(--lx-gold)] pl-3 font-serif text-xl font-semibold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
        {copy.browseBodyStyleTitle}
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group min-h-[48px] min-w-0 overflow-hidden rounded-[16px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_28px_-12px_rgba(42,36,22,0.18)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-[0_12px_36px_-12px_rgba(42,36,22,0.22)] active:opacity-95"
          >
            <div className="relative aspect-[5/3] w-full overflow-hidden bg-[color:var(--lx-section)]">
              <Image
                src={AUTOS_LANDING_BODYSTYLE_IMAGES[t.imageKey]}
                alt=""
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.04]"
                sizes="(max-width:640px) 46vw, 16vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(30,24,16,0.58)] to-transparent" />
              <p className="absolute bottom-2 left-2 right-2 text-center font-serif text-[13px] font-semibold leading-tight text-[#FFFCF7] drop-shadow-sm sm:bottom-3 sm:text-[15px]">
                {t.label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
