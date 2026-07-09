"use client";

import Link from "next/link";
import type { OfertaLocalPublicSearchItem } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import {
  formatOfertaLocalPublicItemLocation,
  formatOfertaLocalPublicItemPriceDisplay,
  formatOfertaLocalPublicItemValidDates,
} from "@/app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesPublicSearchCopy } from "./ofertasLocalesPublicSearchCopy";

const OVERLAY = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4";
const DRAWER =
  "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#D4C4A8]/70 bg-[#FAF6F0] shadow-xl sm:rounded-2xl";
const BTN =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]";
const BTN_OUTLINE =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_ADD =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#7A1E2C]/35 bg-[#7A1E2C]/5 px-3 py-2 text-sm font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/10";
const BTN_ADDED =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900";

type Props = {
  lang: OfertasLocalesAppLang;
  item: OfertaLocalPublicSearchItem;
  onClose: () => void;
  isAdded?: boolean;
  onAdd?: (item: OfertaLocalPublicSearchItem) => void;
  onRemove?: (itemId: string) => void;
  onOpenList?: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#1E1814]/55">{label}</p>
      <p className="mt-0.5 text-sm text-[#1E1814]">{value}</p>
    </div>
  );
}

export function OfertasLocalesPublicItemDetailDrawer({
  lang,
  item,
  onClose,
  isAdded = false,
  onAdd,
  onRemove,
  onOpenList,
}: Props) {
  const c = ofertasLocalesPublicSearchCopy(lang);
  const price = formatOfertaLocalPublicItemPriceDisplay(item);
  const location = formatOfertaLocalPublicItemLocation(item);
  const dates = formatOfertaLocalPublicItemValidDates(item, lang);
  const tags = item.searchTags.join(", ");
  const showListActions = Boolean(onAdd || onRemove || onOpenList);

  return (
    <div className={OVERLAY} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={DRAWER} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-[#D4C4A8]/60 bg-[#FAF6F0]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#1E1814]">{c.detailTitle}</p>
              <p className="mt-1 text-lg font-bold text-[#7A1E2C]">{item.itemName}</p>
            </div>
            <button type="button" className={BTN_OUTLINE} onClick={onClose}>
              {c.close}
            </button>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="rounded-xl border border-[#D4C4A8]/60 bg-white px-4 py-3">
            <p className="text-2xl font-bold text-[#7A1E2C]">{price}</p>
            {item.unit?.trim() ? <p className="text-sm text-[#1E1814]/70">{item.unit}</p> : null}
          </div>

          {showListActions ? (
            <div className="flex flex-wrap gap-2 rounded-xl border border-[#B8860B]/35 bg-[#FDF8F0]/80 px-3 py-3">
              {isAdded ? (
                <>
                  <span className={BTN_ADDED}>{c.addedToList}</span>
                  {onOpenList ? (
                    <button type="button" className={BTN} onClick={onOpenList}>
                      {c.viewList}
                    </button>
                  ) : null}
                  {onRemove ? (
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-[#1E1814]/55 underline"
                      onClick={() => onRemove(item.id)}
                    >
                      {c.removeFromList}
                    </button>
                  ) : null}
                </>
              ) : onAdd ? (
                <button type="button" className={BTN_ADD} onClick={() => onAdd(item)}>
                  {c.addToList}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label={c.pageTitle} value={item.businessName} />
            <DetailRow label={c.cityLabel} value={location} />
            {item.address ? <DetailRow label="Address" value={item.address} /> : null}
            <DetailRow label={c.validDates} value={dates} />
            {item.category ? <DetailRow label={c.categoryLabel} value={item.category} /> : null}
            {item.subcategory ? <DetailRow label="Subcategory" value={item.subcategory} /> : null}
            {tags ? <DetailRow label="Tags" value={tags} /> : null}
            {item.sourcePage != null && item.sourcePage > 0 ? (
              <DetailRow label={c.sourcePage} value={String(item.sourcePage)} />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {item.phoneHref ? (
              <a href={item.phoneHref} className={BTN}>
                {c.call}
              </a>
            ) : null}
            {item.websiteHref ? (
              <a href={item.websiteHref} target="_blank" rel="noopener noreferrer" className={BTN_OUTLINE}>
                {c.website}
              </a>
            ) : null}
            {item.directionsHref ? (
              <a
                href={item.directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={BTN_OUTLINE}
              >
                {c.directions}
              </a>
            ) : null}
            {item.whatsappHref ? (
              <a
                href={item.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={BTN_OUTLINE}
              >
                WhatsApp
              </a>
            ) : null}
          </div>

          {item.requiresMembership || item.membershipUrl || item.membershipNote ? (
            <div className="rounded-xl border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-4 py-3 text-sm">
              <p className="font-medium text-[#1E1814]">{c.membershipNote}</p>
              {item.membershipNote ? (
                <p className="mt-1 text-[#1E1814]/75">{item.membershipNote}</p>
              ) : null}
              {item.membershipUrl ? (
                <a
                  href={item.membershipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN} mt-2`}
                >
                  {c.signUpBeforeYouGo}
                </a>
              ) : null}
            </div>
          ) : null}

          {item.digitalCouponUrl || item.digitalCouponNote ? (
            <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3 text-sm">
              <p className="font-medium text-[#1E1814]">{c.digitalCouponNote}</p>
              {item.digitalCouponNote ? (
                <p className="mt-1 text-[#1E1814]/75">{item.digitalCouponNote}</p>
              ) : null}
              {item.digitalCouponUrl ? (
                <a
                  href={item.digitalCouponUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BTN} mt-2`}
                >
                  {c.activateDigitalCoupons}
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-[#1E1814]">{c.viewSource}</p>
            {item.sourceAssetLabel ? (
              <p className="mt-1 text-xs text-[#1E1814]/65">{item.sourceAssetLabel}</p>
            ) : null}
            {item.sourceAssetHref ? (
              <a
                href={item.sourceAssetHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN} mt-3`}
              >
                {c.viewSource}
              </a>
            ) : (
              <p className="mt-2 text-sm text-[#1E1814]/70">{c.sourceUnavailable}</p>
            )}
            <p className="mt-3 text-xs text-[#1E1814]/55">{item.boundingBoxNote}</p>
          </div>

          {Object.values(item.socialLinks).some(Boolean) ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {item.socialLinks.facebookUrl ? (
                <Link href={item.socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Facebook
                </Link>
              ) : null}
              {item.socialLinks.instagramUrl ? (
                <Link href={item.socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Instagram
                </Link>
              ) : null}
              {item.socialLinks.tiktokUrl ? (
                <Link href={item.socialLinks.tiktokUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  TikTok
                </Link>
              ) : null}
              {item.socialLinks.youtubeUrl ? (
                <Link href={item.socialLinks.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  YouTube
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
