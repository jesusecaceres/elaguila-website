"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LeonixLaunchCouponCard } from "@/app/components/leonix/LeonixLaunchCouponCard";
import type { PublishCheckpointCardData } from "../_lib/categoryPublishCheckpoints";
import {
  buildPaidCheckpointNewsletterHref,
  publishCheckpointCouponExclusions,
  publishCheckpointCouponLine,
  publishCheckpointCouponLineShort,
  type PublishCheckpointLang,
} from "../_lib/publishCheckpointCopy";

function hasPaidStyleCard(cards: PublishCheckpointCardData[]): boolean {
  return cards.some(
    (c) => c.variant === "paid" || c.variant === "dealer" || c.variant === "upgrade",
  );
}

export function PublishEntryCheckpointLaunchBanner({
  lang,
  category,
}: {
  lang: PublishCheckpointLang;
  category: string;
}) {
  const href = buildPaidCheckpointNewsletterHref(lang, category);
  return (
    <LeonixLaunchCouponCard
      lang={lang}
      variant="public"
      href={href}
      openInNewTab
      finePrintMode="full"
    />
  );
}

type PaidPublishCheckpointCardProps = {
  card: PublishCheckpointCardData;
  lang: PublishCheckpointLang;
  onMoreClick: () => void;
};

function cardSurfaceClass(card: PublishCheckpointCardData): string {
  const base = "block rounded-2xl border p-5 shadow-sm transition";
  if (card.highlighted) {
    return `${base} border-[#C9B46A]/45 bg-gradient-to-br from-[#FFF6E7] to-[#FFFCF7] shadow-md hover:border-[#B8954A]`;
  }
  return `${base} border-[#E8DFD0] bg-[#FFFCF7] hover:border-[#C9B46A]/50`;
}

export function PaidPublishCheckpointCard({
  card,
  lang,
  onMoreClick,
  compactCouponLine = true,
}: PaidPublishCheckpointCardProps & { compactCouponLine?: boolean }) {
  const couponLine = compactCouponLine
    ? publishCheckpointCouponLineShort(lang, card.couponEligible)
    : publishCheckpointCouponLine(lang, card.couponEligible);

  return (
    <Link
      href={card.disabled ? "#" : card.ctaHref}
      className={`${cardSurfaceClass(card)} ${card.disabled ? "pointer-events-none opacity-60" : ""}`}
      aria-disabled={card.disabled}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{card.eyebrow}</p>
          <p className="mt-1 text-lg font-bold text-[#1E1810]">{card.title}</p>
          <p className="mt-1 text-sm font-semibold text-[#7A1E2C]">
            {card.priceLabel}
            {card.billingLabel ? (
              <span className="ml-1 text-xs font-medium text-[#5C5346]">· {card.billingLabel}</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-[#5C5346]/85">{card.shortDescription}</p>
          {card.optionalUpgradeLine ? (
            <p className="mt-2 text-xs font-semibold text-[#B8954A]">{card.optionalUpgradeLine}</p>
          ) : null}
          {couponLine ? (
            <p className="mt-2 text-xs font-medium text-emerald-900/90">{couponLine}</p>
          ) : null}
          {card.comingSoon ? (
            <p className="mt-2 text-xs font-semibold text-[#7A7164]">
              {lang === "es" ? "Próximamente — verificar antes de prometer" : "Coming later — verify before promising"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-[#7A1E2C]">{card.ctaLabel}</p>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onMoreClick();
          }}
          className="text-sm font-semibold text-[#5C5346] underline underline-offset-2 hover:text-[#1E1810]"
        >
          {card.moreLabel}
        </button>
      </div>
    </Link>
  );
}

type PaidPublishCheckpointModalProps = {
  open: boolean;
  onClose: () => void;
  card: PublishCheckpointCardData | null;
  lang: PublishCheckpointLang;
};

export function PaidPublishCheckpointModal({ open, onClose, card, lang }: PaidPublishCheckpointModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !card) return null;

  const couponLine = publishCheckpointCouponLine(lang, card.couponEligible);
  const exclusions = card.couponEligible ? publishCheckpointCouponExclusions(lang) : null;

  const bulletSections = [
    card.includedBullets,
    card.bestForBullets,
    card.requiredBeforePublishBullets,
    card.optionalUpgradeBullets,
    card.notIncludedBullets,
  ].filter((b): b is readonly string[] => Boolean(b?.length));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl bg-[#FFFCF7] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-checkpoint-modal-title"
      >
        <h2 id="publish-checkpoint-modal-title" className="text-xl font-bold text-[#1E1810]">
          {card.modalTitle}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#5C5346]">{card.modalIntro}</p>
        <ul className="mt-4 space-y-2">
          {bulletSections.flat().map((bullet, i) => (
            <li key={`${card.id}-bullet-${i}`} className="flex items-start gap-2 text-sm text-[#5C5346]">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B8954A]" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        {couponLine ? (
          <p className="mt-4 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 text-xs text-emerald-950">
            {couponLine}
          </p>
        ) : null}
        {exclusions ? <p className="mt-2 text-[10px] text-[#7A7164]">{exclusions}</p> : null}
        {card.footnote ? <p className="mt-3 text-[10px] text-[#7A7164]">{card.footnote}</p> : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-[44px] w-full rounded-full bg-[#7A1E2C] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5E1722]"
        >
          {lang === "es" ? "Cerrar" : "Close"}
        </button>
      </div>
    </div>
  );
}

type PublishEntryCheckpointLayoutProps = {
  lang: PublishCheckpointLang;
  title: string;
  body: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  /** Category slug for Launch 25 banner source tracking (e.g. rentas, servicios). */
  checkpointCategory?: string;
  /** When set, banner shows only if at least one paid-style card exists (mixed free/paid pages). */
  launchBannerCards?: PublishCheckpointCardData[];
};

export function PublishEntryCheckpointLayout({
  lang,
  title,
  body,
  children,
  backHref,
  backLabel,
  checkpointCategory,
  launchBannerCards,
}: PublishEntryCheckpointLayoutProps) {
  const showLaunchBanner = useMemo(() => {
    if (!checkpointCategory) return false;
    if (!launchBannerCards?.length) return true;
    return hasPaidStyleCard(launchBannerCards);
  }, [checkpointCategory, launchBannerCards]);

  return (
    <main className="min-h-screen bg-[#F6F0E2] px-4 pb-20 pt-28 text-[#2C2416]">
      <div className="mx-auto max-w-lg">
        {backHref && backLabel ? (
          <Link
            href={backHref}
            className="inline-flex min-h-[40px] items-center text-sm font-medium text-[#5D4A25] underline underline-offset-2 hover:text-[#3D2C12]"
          >
            {backLabel}
          </Link>
        ) : null}
        <h1 className={`text-3xl font-extrabold text-[#1E1810] ${backHref ? "mt-3" : ""}`}>{title}</h1>
        <p className="mt-2 text-sm text-[#5C5346]/88">{body}</p>
        {showLaunchBanner && checkpointCategory ? (
          <div className="mt-6">
            <PublishEntryCheckpointLaunchBanner lang={lang} category={checkpointCategory} />
          </div>
        ) : null}
        <div className="mt-8 space-y-4">{children}</div>
      </div>
    </main>
  );
}

type PublishEntryCheckpointStackProps = {
  cards: PublishCheckpointCardData[];
  lang: PublishCheckpointLang;
};

export function PublishEntryCheckpointStack({ cards, lang }: PublishEntryCheckpointStackProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openCard = cards.find((c) => c.id === openId) ?? null;

  return (
    <>
      {cards.map((card) => (
        <PaidPublishCheckpointCard
          key={card.id}
          card={card}
          lang={lang}
          onMoreClick={() => setOpenId(card.id)}
        />
      ))}
      <PaidPublishCheckpointModal
        open={openId != null}
        onClose={() => setOpenId(null)}
        card={openCard}
        lang={lang}
      />
    </>
  );
}