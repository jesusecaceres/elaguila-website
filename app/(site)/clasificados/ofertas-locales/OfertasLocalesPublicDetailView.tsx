"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiShoppingCart } from "react-icons/fi";

import type {
  OfertaLocalPublicDetailAsset,
  OfertaLocalPublicDetailHubItem,
  OfertaLocalPublicOfferDetail,
  OfertaLocalPublicSearchItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { mapOfertaLocalSourceBboxToDisplayRect } from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

import { OfertasLocalesPublicItemCard } from "./OfertasLocalesPublicItemCard";
import { OfertasLocalesPublicItemDetailDrawer } from "./OfertasLocalesPublicItemDetailDrawer";
import { OfertasLocalesShoppingListPanel } from "./OfertasLocalesShoppingListPanel";
import { ofertaLocalPublicOfferTypeLabel } from "./ofertasLocalesPublicSearchCopy";
import { ofertasLocalesPublicDetailCopy } from "./ofertasLocalesPublicDetailCopy";
import { useOfertasLocalesShoppingList } from "./useOfertasLocalesShoppingList";

const BTN =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-semibold text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_PRIMARY =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6a1926]";
const BADGE =
  "inline-flex rounded-full border border-[#B8860B]/60 bg-[#FDF8F0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6B1F] sm:text-[11px]";
const TRUST_BADGE =
  "inline-flex rounded-full border border-[#2A4536]/25 bg-[#2A4536]/8 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2A4536] sm:text-[11px]";
const OVERLAY_BTN =
  "pointer-events-auto absolute rounded-md border-2 border-[#B8860B]/70 bg-[#C9A227]/10 transition hover:border-[#7A1E2C] hover:bg-[#7A1E2C]/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1E2C]/45";

type Props = {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferDetail;
  items: OfertaLocalPublicDetailHubItem[];
};

function businessInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function isPdfAssetHref(href: string): boolean {
  return href.toLowerCase().includes(".pdf");
}

function viewerAssetsFromOffer(offer: OfertaLocalPublicOfferDetail): OfertaLocalPublicDetailAsset[] {
  const withHref = [...offer.flyerAssets, ...offer.couponAssets].filter((a) => a.href);
  if (withHref.length > 0) return withHref;
  if (offer.primaryAssetHref) {
    return [
      {
        id: "primary",
        label: offer.primaryAssetLabel || "Flyer",
        kind: "flyer",
        href: offer.primaryAssetHref,
        pending: false,
      },
    ];
  }
  return [];
}

function resolveItemPage(item: OfertaLocalPublicDetailHubItem): number {
  return item.sourcePage != null && item.sourcePage > 0 ? item.sourcePage : 1;
}

function OfertasFloatingShoppingListCart({
  title,
  emptyHelper,
  openLabel,
  itemCount,
  listSummary,
  onOpen,
}: {
  title: string;
  emptyHelper: string;
  openLabel: string;
  itemCount: number;
  listSummary: string;
  onOpen: () => void;
}) {
  const subtitle = itemCount > 0 ? listSummary : emptyHelper;

  return (
    <div
      className="pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-40 max-w-[min(20rem,calc(100vw-1.5rem))] sm:bottom-6 sm:right-6"
      data-testid="ofertas-floating-shopping-list-cart"
    >
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto group flex w-full items-stretch overflow-hidden rounded-2xl border-2 border-[#B8860B]/75 bg-gradient-to-br from-[#FDF8F0] via-[#FFFCF7] to-[#F5EBD8] text-left shadow-[0_10px_36px_rgba(30,24,20,0.28)] ring-1 ring-[#7A1E2C]/15 transition duration-200 hover:-translate-y-0.5 hover:border-[#B8860B] hover:shadow-[0_14px_44px_rgba(122,30,44,0.28)] active:scale-[0.98]"
        aria-label={`${title}. ${subtitle}`}
      >
        <span className="relative flex w-[3.75rem] shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#7A1E2C] to-[#5c1723] py-3.5 text-white sm:w-[4.25rem]">
          <FiShoppingCart className="h-6 w-6 drop-shadow-sm" aria-hidden />
          {itemCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border-2 border-[#FDF8F0] bg-[#B8860B] px-1.5 text-[11px] font-bold leading-none text-white shadow-md">
              {itemCount}
            </span>
          ) : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2.5 sm:px-3.5 sm:py-3">
          <span className="text-sm font-bold leading-tight text-[#1E1814] sm:text-[0.9375rem]">{title}</span>
          <span className="line-clamp-2 text-[11px] leading-snug text-[#1E1814]/68 sm:text-xs">{subtitle}</span>
          <span className="mt-0.5 inline-flex w-fit min-h-8 items-center rounded-lg bg-[#7A1E2C] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm group-hover:bg-[#6a1926] sm:min-h-9 sm:px-3 sm:text-xs">
            {openLabel}
          </span>
        </span>
      </button>
    </div>
  );
}

function PublicFlyerViewer({
  lang,
  assets,
  items,
  onOpenProduct,
  c,
}: {
  lang: OfertasLocalesAppLang;
  assets: OfertaLocalPublicDetailAsset[];
  items: OfertaLocalPublicDetailHubItem[];
  onOpenProduct: (item: OfertaLocalPublicSearchItem) => void;
  c: ReturnType<typeof ofertasLocalesPublicDetailCopy>;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const asset = assets[pageIndex] ?? null;
  const href = asset?.href ?? null;
  const isPdf = href ? isPdfAssetHref(href) : false;
  const currentPageNumber = pageIndex + 1;

  const overlayItems = useMemo(
    () =>
      items.filter(
        (item) => item.sourceBbox && resolveItemPage(item) === currentPageNumber && !isPdf
      ),
    [items, currentPageNumber, isPdf]
  );

  const measureSurface = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    setSurfaceSize({ width: img.clientWidth, height: img.clientHeight });
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    }
  }, []);

  useEffect(() => {
    measureSurface();
    window.addEventListener("resize", measureSurface);
    return () => window.removeEventListener("resize", measureSurface);
  }, [measureSurface, href, pageIndex]);

  if (!href) {
    return (
      <section
        className="rounded-2xl border border-[#B8860B]/55 bg-gradient-to-b from-[#FFFCF7] to-[#F5EBD8] p-6 shadow-sm"
        data-testid="ofertas-public-flyer-viewer"
      >
        <h2 className="font-serif text-lg font-bold text-[#2A4536]">{c.flyerViewerTitle}</h2>
        <div className="mt-4 flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D4C4A8]/80 bg-[#FAF6F0]/80 px-4 py-8 text-center">
          <p className="font-serif text-base font-semibold text-[#8A6B1F]">{c.flyerUnavailable}</p>
          <p className="mt-2 max-w-sm text-sm text-[#1E1814]/65">{c.flyerUnavailableBody}</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-[#B8860B]/55 bg-gradient-to-b from-[#FFFCF7] to-[#F5EBD8] p-4 shadow-sm sm:p-5"
      data-testid="ofertas-public-flyer-viewer"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-bold text-[#2A4536]">{c.flyerViewerTitle}</h2>
        {assets.length > 1 ? (
          <p className="text-xs font-medium text-[#1E1814]/60">
            {c.flyerPage} {currentPageNumber} / {assets.length}
          </p>
        ) : null}
      </div>

      {isPdf ? (
        <div className="mt-4 rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-8 text-center">
          <p className="text-sm text-[#1E1814]/70">{asset?.label}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className={`${BTN_PRIMARY} mt-4`}>
            {c.openFlyerPdf}
          </a>
        </div>
      ) : (
        <div className="relative mt-4 overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex justify-center">
            <div ref={surfaceRef} className="relative inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={href}
                alt={asset?.label || c.flyerViewerTitle}
                className="max-h-[min(52vh,420px)] max-w-full object-contain object-center sm:max-h-[380px]"
                loading="eager"
                decoding="async"
                onLoad={measureSurface}
              />
              {overlayItems.length > 0 && surfaceSize.width > 0 && surfaceSize.height > 0 ? (
                <div className="pointer-events-none absolute inset-0">
                {overlayItems.map((item) => {
                  const rect = mapOfertaLocalSourceBboxToDisplayRect(
                    item.sourceBbox as unknown as Record<string, unknown>,
                    surfaceSize.width,
                    surfaceSize.height,
                    naturalSize.width,
                    naturalSize.height
                  );
                  if (!rect) return null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={OVERLAY_BTN}
                      style={{
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                      }}
                      aria-label={item.itemName}
                      onClick={() => onOpenProduct(item)}
                    />
                  );
                })}
                </div>
              ) : null}
            </div>
          </div>
          {overlayItems.length > 0 ? (
            <p className="mt-3 text-center text-xs text-[#1E1814]/60">{c.overlayHint}</p>
          ) : null}
        </div>
      )}

      {assets.length > 1 ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className={BTN}
            disabled={pageIndex <= 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          >
            {c.flyerPrev}
          </button>
          <button
            type="button"
            className={BTN}
            disabled={pageIndex >= assets.length - 1}
            onClick={() => setPageIndex((p) => Math.min(assets.length - 1, p + 1))}
          >
            {c.flyerNext}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ContactHub({
  lang,
  offer,
  c,
  onShare,
  shareCopied,
}: {
  lang: OfertasLocalesAppLang;
  offer: OfertaLocalPublicOfferDetail;
  c: ReturnType<typeof ofertasLocalesPublicDetailCopy>;
  onShare: () => void;
  shareCopied: boolean;
}) {
  const social = offer.socialLinks ?? {};
  const smsHref = offer.phoneDisplay
    ? `sms:${offer.phoneDisplay.replace(/[^\d+]/g, "")}`
    : null;
  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");

  const hasContact = Boolean(
    offer.phoneHref || smsHref || offer.whatsappHref || offer.websiteHref || offer.directionsHref
  );
  const hasSocial = Boolean(
    social.facebookUrl ||
      social.instagramUrl ||
      social.tiktokUrl ||
      social.youtubeUrl ||
      social.googleBusinessUrl ||
      social.googleReviewUrl ||
      social.yelpUrl
  );

  if (!hasContact && !hasSocial && !location && !offer.address) return null;

  return (
    <section
      className="rounded-2xl border border-[#B8860B]/55 bg-white p-4 shadow-sm sm:p-5"
      data-testid="ofertas-public-contact-hub"
    >
      <h2 className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">{c.businessHubTitle}</h2>

      {(location || offer.address) && (
        <div className="mt-3 rounded-xl border border-[#D4C4A8]/60 bg-[#FFFCF7] px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2A4536]/75">{c.locationTitle}</p>
          {location ? <p className="mt-1 text-sm text-[#1E1814]">{location}</p> : null}
          {offer.address ? <p className="text-sm text-[#1E1814]/70">{offer.address}</p> : null}
        </div>
      )}

      {hasContact ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {offer.phoneHref ? (
            <a href={offer.phoneHref} className={BTN_PRIMARY}>
              {c.call}
            </a>
          ) : null}
          {smsHref && offer.phoneDisplay ? (
            <a href={smsHref} className={BTN}>
              {c.sms}
            </a>
          ) : null}
          {offer.whatsappHref ? (
            <a href={offer.whatsappHref} target="_blank" rel="noopener noreferrer" className={BTN_PRIMARY}>
              {c.whatsapp}
            </a>
          ) : null}
          {offer.websiteHref ? (
            <a href={offer.websiteHref} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.website}
            </a>
          ) : null}
          {offer.directionsHref ? (
            <a href={offer.directionsHref} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.directions}
            </a>
          ) : null}
          <button type="button" className={BTN} onClick={() => void onShare()}>
            {c.share}
          </button>
        </div>
      ) : null}
      {shareCopied ? <p className="mt-2 text-xs font-medium text-[#2A4536]">{c.linkCopied}</p> : null}

      {hasSocial ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#D4C4A8]/50 pt-3">
          {social.facebookUrl ? (
            <a href={social.facebookUrl} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.facebook}
            </a>
          ) : null}
          {social.instagramUrl ? (
            <a href={social.instagramUrl} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.instagram}
            </a>
          ) : null}
          {social.googleBusinessUrl ? (
            <a href={social.googleBusinessUrl} target="_blank" rel="noopener noreferrer" className={BTN}>
              {c.googleBusiness}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function OfertasLocalesPublicDetailView({ lang, offer, items }: Props) {
  const c = ofertasLocalesPublicDetailCopy(lang);
  const listCopy = lang === "es"
    ? {
        title: "Lista de compras",
        open: "Abrir lista",
        empty: "Agrega productos para planear tu visita.",
        summary: (stores: number, count: number) =>
          `${stores} tienda${stores === 1 ? "" : "s"} · ${count} producto${count === 1 ? "" : "s"}`,
      }
    : {
        title: "Shopping list",
        open: "Open list",
        empty: "Add items to plan your visit.",
        summary: (stores: number, count: number) =>
          `${stores} store${stores === 1 ? "" : "s"} · ${count} item${count === 1 ? "" : "s"}`,
      };

  const shoppingList = useOfertasLocalesShoppingList();
  const [selectedItem, setSelectedItem] = useState<OfertaLocalPublicSearchItem | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const location = [offer.city, offer.state, offer.zipCode].filter(Boolean).join(", ");
  const dates =
    offer.validFrom && offer.validUntil
      ? `${offer.validFrom} – ${offer.validUntil}`
      : offer.validFrom || offer.validUntil;
  const resultsHref = `/clasificados/ofertas-locales/results?lang=${lang}`;
  const typeLabel = ofertaLocalPublicOfferTypeLabel(lang, offer.offerType);
  const viewerAssets = useMemo(() => viewerAssetsFromOffer(offer), [offer]);
  const initial = businessInitial(offer.businessName);

  const handleShare = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: offer.title || offer.businessName, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  }, [offer.title, offer.businessName]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FDFBF7]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href={resultsHref} className="text-sm font-semibold text-[#7A1E2C] underline">
          ← {c.backToResults}
        </Link>

        <header
          className="mt-5 rounded-2xl border border-[#B8860B]/55 bg-gradient-to-br from-[#FFFCF7] to-[#F5EBD8] p-4 shadow-sm sm:p-6"
          data-testid="ofertas-public-detail-header"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              {offer.businessLogoHref ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={offer.businessLogoHref}
                  alt={offer.businessName}
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-[#B8860B]/50 bg-white object-contain p-1 sm:h-20 sm:w-20"
                />
              ) : (
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#B8860B]/50 bg-[#FDF8F0] font-serif text-2xl font-bold text-[#7A1E2C] sm:h-20 sm:w-20 sm:text-3xl"
                  aria-hidden
                >
                  {initial}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={TRUST_BADGE}>{c.publicApprovedBadge}</span>
                  <span className={BADGE}>{typeLabel}</span>
                </div>
                <p className="mt-2 font-serif text-xl font-bold text-[#1E1814] sm:text-2xl">{offer.businessName}</p>
                <h1 className="mt-1 font-serif text-lg font-bold leading-snug text-[#2A4536] sm:text-xl">
                  {offer.title}
                </h1>
                {dates ? (
                  <p className="mt-2 text-sm font-medium text-[#1E1814]/75">
                    {c.validDates}: {dates}
                    {offer.isExpired ? (
                      <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-800">
                        {c.expiredLabel}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {location ? <p className="mt-1 text-sm text-[#1E1814]/65">{location}</p> : null}
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-8">
          <PublicFlyerViewer
            lang={lang}
            assets={viewerAssets}
            items={items}
            onOpenProduct={setSelectedItem}
            c={c}
          />
          <ContactHub lang={lang} offer={offer} c={c} onShare={handleShare} shareCopied={shareCopied} />
        </div>

        <section className="mt-8" data-testid="ofertas-public-detail-products">
          <h2 className="mb-4 font-serif text-lg font-bold text-[#2A4536] sm:text-xl">{c.productsSectionTitle}</h2>
          {items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {items.map((item) => (
                <li key={item.id}>
                  <OfertasLocalesPublicItemCard
                    lang={lang}
                    item={item}
                    isAdded={shoppingList.isAdded(item.id)}
                    onSelect={setSelectedItem}
                    onAdd={shoppingList.addFromPublicItem}
                    onRemove={shoppingList.removeItem}
                    onOpenList={() => setListOpen(true)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D4C4A8]/80 bg-[#FAF6F0]/80 px-4 py-8 text-center">
              <p className="font-serif text-base font-semibold text-[#2A4536]">{c.productsEmptyTitle}</p>
              <p className="mt-2 text-sm text-[#1E1814]/65">{c.productsEmptyBody}</p>
            </div>
          )}
        </section>

        {offer.description ? (
          <section className="mt-8 rounded-2xl border border-[#D4C4A8]/60 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.description}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#1E1814]">{offer.description}</p>
          </section>
        ) : null}

        {(offer.requiresMembershipForDeals || offer.membershipUrl || offer.membershipNote) && (
          <section className="mt-6 rounded-2xl border border-[#D4C4A8]/60 bg-[#FFFCF7] p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#7A7164]">{c.membershipTitle}</h2>
            {offer.requiresMembershipForDeals ? (
              <p className="mt-2 text-sm text-amber-900">{c.membershipRequired}</p>
            ) : null}
            {offer.membershipNote ? <p className="mt-2 text-sm text-[#1E1814]/75">{offer.membershipNote}</p> : null}
            {offer.membershipUrl ? (
              <a
                href={offer.membershipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${BTN_PRIMARY} mt-3`}
              >
                {offer.membershipCtaLabel || c.signUpBeforeYouGo}
              </a>
            ) : null}
          </section>
        )}
      </div>

      {selectedItem ? (
        <OfertasLocalesPublicItemDetailDrawer
          lang={lang}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isAdded={shoppingList.isAdded(selectedItem.id)}
          onAdd={shoppingList.addFromPublicItem}
          onRemove={shoppingList.removeItem}
          onOpenList={() => {
            setSelectedItem(null);
            setListOpen(true);
          }}
        />
      ) : null}

      {listOpen ? (
        <OfertasLocalesShoppingListPanel
          lang={lang}
          list={shoppingList.list}
          storeCount={shoppingList.counts.storeCount}
          itemCount={shoppingList.counts.itemCount}
          onClose={() => setListOpen(false)}
          onRemove={shoppingList.removeItem}
          onUpdateQuantity={shoppingList.updateQuantity}
          onUpdateNote={shoppingList.updateNote}
          onClear={shoppingList.clearList}
        />
      ) : null}

      <OfertasFloatingShoppingListCart
        title={listCopy.title}
        emptyHelper={listCopy.empty}
        openLabel={listCopy.open}
        itemCount={shoppingList.counts.itemCount}
        listSummary={listCopy.summary(shoppingList.counts.storeCount, shoppingList.counts.itemCount)}
        onOpen={() => setListOpen(true)}
      />
    </div>
  );
}

export function OfertasLocalesPublicDetailUnavailable({ lang }: { lang: OfertasLocalesAppLang }) {
  const c = ofertasLocalesPublicDetailCopy(lang);
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-[#1E1814]">{c.unavailableTitle}</h1>
      <p className="mt-3 text-sm text-[#1E1814]/70">{c.unavailableBody}</p>
      <Link
        href={`/clasificados/ofertas-locales/results?lang=${lang}`}
        className="mt-6 text-sm font-semibold text-[#7A1E2C] underline"
      >
        {c.backToResults}
      </Link>
    </div>
  );
}
