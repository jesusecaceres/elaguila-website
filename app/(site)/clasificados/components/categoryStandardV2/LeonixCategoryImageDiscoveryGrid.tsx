"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ImageDiscoveryGridItem, LeonixCategoryImageDiscoveryGridProps } from "./types";
import { LEONIX_LANDING_SECTION, LEONIX_LANDING_SECTION_PAD } from "./constants";

/**
 * Leonix Category Image Discovery Grid
 *
 * Image-led sibling of LeonixCategoryDiscoveryGrid — same section wrapper,
 * heading/subtitle contract, and href/label/hint shape, but each card leads
 * with a photo instead of an icon glyph. Built so the photo alone should be
 * enough to identify the child category even without reading the label.
 *
 * Same section slot as LeonixCategoryDiscoveryGrid: drop-in replacement
 * wherever a category landing wants photography instead of icons.
 *
 * HARD RULE (matches the icon grid): if surface === "results", return null.
 * No landing discovery grid on results.
 */
export function LeonixCategoryImageDiscoveryGrid({
  surface,
  heading,
  subtitle,
  items,
}: LeonixCategoryImageDiscoveryGridProps) {
  if (surface === "results") {
    return null;
  }

  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="leonix-image-discovery-heading">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <h2
          id="leonix-image-discovery-heading"
          className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl"
        >
          {heading}
        </h2>
        <p className="mt-1 text-xs text-[#5C5346]/90">{subtitle}</p>
        <div className="mt-4 grid min-w-0 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {items.map((item) => (
            <ImageDiscoveryCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Exported so bespoke pages that own their own section/heading wrapper
 * (Rentas, Bienes Raíces) can reuse the exact same card treatment instead of
 * hand-rolling a lookalike — guarantees pixel-identical image cards
 * system-wide, not just on pages that use the full grid+section component.
 */
export function ImageDiscoveryCard({ item }: { item: ImageDiscoveryGridItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_8px_28px_-18px_rgba(42,36,22,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-16px_rgba(42,36,22,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
    >
      <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden bg-[#FAF6EE]">
        {item.imageSrc && !imageFailed ? (
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 22vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" aria-hidden>
            {Icon ? <Icon className="h-8 w-8 text-[#2A4536]/45" /> : null}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <span className="font-serif text-sm font-bold leading-tight text-[#2A4536] group-hover:text-[#7A1E2C]">
          {item.label}
        </span>
        {item.hint ? (
          <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#5C5346]/85">
            {item.hint}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
