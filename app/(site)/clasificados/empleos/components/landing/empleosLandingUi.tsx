"use client";

import type { ReactNode } from "react";
import {
  FaBook,
  FaBoxes,
  FaBuilding,
  FaClock,
  FaHardHat,
  FaHeadset,
  FaHeart,
  FaHome,
  FaMagic,
  FaMicrochip,
  FaTag,
  FaTh,
  FaTruck,
  FaUtensils,
} from "react-icons/fa";
import type { IconType } from "react-icons";

import type { SampleJobCategory, SampleQuickFilter } from "../../data/empleosLandingSampleData";

const quickIconMap: Record<SampleQuickFilter["icon"], IconType> = {
  clock: FaClock,
  home: FaHome,
  building2: FaBuilding,
  hardhat: FaHardHat,
  tag: FaTag,
  headset: FaHeadset,
  cpu: FaMicrochip,
  grid: FaTh,
  heart: FaHeart,
};

const categoryIconMap: Record<SampleJobCategory["icon"], IconType> = {
  heart: FaHeart,
  hammer: FaHardHat,
  utensils: FaUtensils,
  building: FaBuilding,
  tag: FaTag,
  cpu: FaMicrochip,
  truck: FaTruck,
  boxes: FaBoxes,
  sparkles: FaMagic,
  book: FaBook,
};

export function QuickFilterIcon({ kind, className }: { kind: SampleQuickFilter["icon"]; className?: string }) {
  const I = quickIconMap[kind];
  return <I className={className} aria-hidden />;
}

export function CategoryCardIcon({ kind, className }: { kind: SampleJobCategory["icon"]; className?: string }) {
  const I = categoryIconMap[kind];
  return <I className={className} aria-hidden />;
}

export function LandingSection({
  id,
  eyebrow,
  title,
  subtitle,
  rightSlot,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5B6F82]">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#2A2826] sm:text-[1.65rem]">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4A4744]/90">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}
