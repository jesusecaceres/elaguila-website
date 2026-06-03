"use client";

import Link from "next/link";
import type { EnVentaResultsCardModel } from "./buildEnVentaResultsCardModel";
import { EN_VENTA_SURFACE } from "../shared/styles/enVentaBrand";
import { trackEnVentaResultCardClickGlobal } from "@/app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics";

type Lang = "es" | "en";
type CardMode = "live" | "preview";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 21s-6.716-4.1-9.328-8.303C.61 10.106 2.16 6.476 5.82 5.54c2.295-.58 4.875.46 6.18 2.26 1.305-1.8 3.885-2.84 6.18-2.26 3.66.936 5.21 4.566 2.148 7.157C20.284 16.9 12 21 12 21z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M1 3h11v11H1zM14 8h4l3 3v3h-7V8z" />
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}

export function EnVentaResultListingCard({
  model,
  lang,
  layout,
  mode = "live",
  isFav,
  onToggleFav,
  href,
}: {
  model: EnVentaResultsCardModel;
  lang: Lang;
  layout: "grid" | "list";
  mode?: CardMode;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  href: string;
}) {
  const isPreview = mode === "preview";
  const isPro = model.plan === "pro";
  const L =
    lang === "es"
      ? {
          pro: "PRO",
          dest: "RECIENTE",
          preview: "Vista previa",
          video: "Video",
          neg: "Negociable",
          save: "Guardar",
          unsave: "Quitar",
        }
      : {
          pro: "PRO",
          dest: "RECENT",
          preview: "Preview",
          video: "Video",
          neg: "Negotiable",
          save: "Save",
          unsave: "Remove",
        };

  const frame = cx(
    "group relative flex w-full overflow-hidden",
    layout === "list" ? "flex-row items-stretch" : "flex-col",
    isPro ? EN_VENTA_SURFACE.resultsCardPro : EN_VENTA_SURFACE.resultsCard,
    !isPreview && EN_VENTA_SURFACE.resultsCardHover,
    isPreview && "pointer-events-none select-none"
  );

  const imageShell = cx(
    "relative shrink-0 overflow-hidden bg-[#FBF7EF]",
    layout === "list" ? "h-[168px] w-[148px] sm:h-[180px] sm:w-[192px]" : "aspect-[4/3] w-full"
  );

  const favBtn = !isPreview ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFav(model.id);
      }}
      className={cx(
        "z-20 rounded-full border p-2 shadow-sm transition",
        isFav
          ? "border-[#7A1E2C]/35 bg-[#FBF7EF] text-[#7A1E2C]"
          : "border-[#D6C7AD]/90 bg-white/95 text-[#5C5346] hover:border-[#C9A84A]/45 hover:bg-[#FFFDF7]"
      )}
      aria-label={isFav ? L.unsave : L.save}
    >
      <HeartIcon filled={isFav} className="h-[18px] w-[18px]" />
    </button>
  ) : null;

  const badgesRow = (
    <div
      className={cx(
        "absolute left-2 right-2 top-2 z-10 flex items-start gap-2",
        model.featuredHighlight || isPreview ? "justify-between" : "justify-start"
      )}
    >
      {isPro ? (
        <span className="inline-flex items-center rounded-full border border-[#C9A84A]/55 bg-[#FBF7EF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8A6B1F] shadow-sm">
          {L.pro}
        </span>
      ) : null}
      {isPreview ? (
        <span className="rounded-full border border-[#D6C7AD]/80 bg-[#FFFDF7]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3D3428] shadow-sm">
          {L.preview}
        </span>
      ) : null}
      {!isPreview && model.featuredHighlight ? (
        <span className="rounded-full border border-[#C9A84A]/60 bg-gradient-to-r from-[#FBF7EF] via-[#F3EBDD] to-[#E8D48A]/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#3D3428] shadow">
          {L.dest}
        </span>
      ) : null}
    </div>
  );

  const imagePadTop = isPro || isPreview ? (layout === "grid" || layout === "list" ? "pt-9" : "") : "";

  const heroInner =
    model.heroImage != null ? (
      <img
        src={model.heroImage}
        alt=""
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-[#3D3428]/15">
        <span className="text-4xl" aria-hidden>
          📦
        </span>
      </div>
    );

  const thumbStrip =
    isPro && (model.extraImageUrls.length > 0 || model.extraThumbOverflow > 0) ? (
      <div className="flex gap-1.5 pt-2">
        {model.extraImageUrls.map((u, i) => {
          const isThird = i === 2;
          const showOverlay = model.extraThumbOverflow > 0 && isThird && model.extraImageUrls.length >= 3;
          return (
            <div
              key={`${u}-${i}`}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#D6C7AD]/70 bg-[#FBF7EF] sm:h-14 sm:w-14"
            >
              <img src={u} alt="" className="h-full w-full object-cover" />
              {showOverlay ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1F241C]/55 text-xs font-bold text-white">
                  +{model.extraThumbOverflow}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    ) : null;

  const metaBlock = (
    <div
      className={cx(
        "flex min-w-0 flex-1 flex-col",
        layout === "list" ? "justify-center p-4 sm:p-5" : "p-4",
        layout === "grid" ? "pt-3" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cx(
            "min-w-0 flex-1 font-bold leading-snug text-[#3D3428]",
            layout === "list" ? "line-clamp-2 text-[17px] sm:text-lg" : "line-clamp-2 text-base sm:text-[17px]"
          )}
        >
          {model.title}
        </h3>
        <p className="shrink-0 text-right text-lg font-bold tabular-nums tracking-tight text-[#7A1E2C] sm:text-xl">
          {model.priceText}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#3D3428]/90">
        <span className="inline-flex items-center gap-1">
          <MapPinIcon className="text-[#8A8070]" />
          <span className="font-medium">{model.locationText}</span>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {model.conditionLabel ? (
          <span className={EN_VENTA_SURFACE.resultsChipCondition}>
            <CheckIcon className="text-[#8A6B1F]" />
            {model.conditionLabel}
          </span>
        ) : null}
        <span className="text-[11px] font-medium tabular-nums text-[#5C5346]/90">{model.postedAgo}</span>
        {!isPro && !isPreview && model.featuredHighlight ? (
          <span className="rounded-full border border-[#C9A84A]/50 bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">
            {L.dest}
          </span>
        ) : null}
      </div>

      {model.categoryLine ? (
        <p className="mt-2 text-[11px] font-medium leading-snug text-[#5C5346]/95">{model.categoryLine}</p>
      ) : null}

      {isPro && model.showViews && !isPreview ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[#3D3428]">
          <span className="inline-flex items-center gap-1 font-semibold text-[#3D3428]">
            <EyeIcon className="text-[#5C5346]" />
            {model.views}
          </span>
        </div>
      ) : null}

      {model.fulfillmentChip ? (
        <div className="mt-2">
          {isPro ? (
            <span className={EN_VENTA_SURFACE.resultsChipFulfillment}>
              <CheckIcon className="shrink-0 text-[#2A4536]" />
              <span className="truncate">{model.fulfillmentChip}</span>
            </span>
          ) : (
            <span className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-[#D6C7AD]/80 bg-[#FBF7EF] px-2.5 py-1 text-[11px] font-semibold text-[#3D3428]">
              <TruckIcon className="shrink-0 text-[#5C5346]" />
              <span className="leading-snug">{model.fulfillmentChip}</span>
            </span>
          )}
        </div>
      ) : null}

      {model.negotiableChip ? (
        <span className="mt-2 inline-flex w-fit rounded-full border border-[#D6C7AD]/90 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5C5346]">
          {L.neg}
        </span>
      ) : null}

      {model.sellerKindLabel ? (
        <p className="mt-1 text-[11px] font-medium text-[#7A7164]">{model.sellerKindLabel}</p>
      ) : null}

      {isPro ? thumbStrip : null}

      {layout === "list" && favBtn ? (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#D6C7AD]/50 pt-3">{favBtn}</div>
      ) : null}
    </div>
  );

  const imageSection = (
    <div className={cx("relative shrink-0", layout === "list" ? "" : "w-full")}>
      <div className={imageShell}>
        {(isPro || isPreview || model.featuredHighlight) && badgesRow}
        <div className={cx("relative h-full w-full", imagePadTop)}>{heroInner}</div>
        {model.showVideoBadge ? (
          <span className="absolute bottom-2 left-2 z-10 rounded-md bg-[#1F241C]/75 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FFFDF7]">
            ▶ {L.video}
          </span>
        ) : null}
      </div>
      {layout === "grid" && favBtn ? <div className="absolute right-2 top-2 z-20">{favBtn}</div> : null}
    </div>
  );

  const inner = (
    <>
      {imageSection}
      {metaBlock}
    </>
  );

  if (isPreview) {
    return <div className={frame}>{inner}</div>;
  }

  const onCardNavigate = () => {
    trackEnVentaResultCardClickGlobal({ listingUuid: model.id });
  };

  if (layout === "list") {
    return (
      <Link href={href} className={frame} onClick={onCardNavigate}>
        {inner}
      </Link>
    );
  }

  return (
    <Link href={href} className={frame} onClick={onCardNavigate}>
      {inner}
    </Link>
  );
}
