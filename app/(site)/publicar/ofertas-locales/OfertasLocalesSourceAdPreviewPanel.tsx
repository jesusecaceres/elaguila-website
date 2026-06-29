"use client";

import { useMemo, useState } from "react";
import {
  assetHasUploadedWithUrl,
  ofertaLocalDraftAssetRoleLabel,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalScanEligibleAsset } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { formatOfertaLocalFileSize } from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const BTN =
  "min-h-11 rounded-lg border border-[#D4C4A8] bg-white px-3 py-2.5 text-xs font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";
const BTN_ACTIVE = "border-[#7A1E2C] bg-[#7A1E2C]/10 font-semibold text-[#7A1E2C]";

type ZoomLevel = "fit" | "100" | "125" | "150";

function resolveDraftAsset(
  draft: OfertaLocalDraft,
  assetId: string | null
): { asset: OfertaLocalDraftAsset; bucket: "flyerAssets" | "couponAssets" } | null {
  if (!assetId) return null;
  const flyer = draft.flyerAssets.find((a) => a.id === assetId && a.status !== "removed");
  if (flyer) return { asset: flyer, bucket: "flyerAssets" };
  const coupon = draft.couponAssets.find((a) => a.id === assetId && a.status !== "removed");
  if (coupon) return { asset: coupon, bucket: "couponAssets" };
  return null;
}

function roleLabelForAsset(
  draft: OfertaLocalDraft,
  asset: OfertaLocalDraftAsset,
  bucket: "flyerAssets" | "couponAssets",
  lang: OfertasLocalesAppLang
): string {
  const activeFlyers = draft.flyerAssets.filter((a) => a.status !== "removed");
  const activeCoupons = draft.couponAssets.filter((a) => a.status !== "removed");
  const sectionMode =
    bucket === "flyerAssets" && activeFlyers[0]?.id === asset.id
      ? ("primaryMainFlyer" as const)
      : bucket === "couponAssets" && activeCoupons[0]?.id === asset.id
        ? ("mainCoupons" as const)
        : bucket === "couponAssets"
          ? ("additionalCoupons" as const)
          : ("default" as const);
  return ofertaLocalDraftAssetRoleLabel({ asset, bucket, sectionMode, lang });
}

function zoomWidth(zoom: ZoomLevel): string {
  switch (zoom) {
    case "fit":
    case "100":
      return "100%";
    case "125":
      return "125%";
    case "150":
      return "150%";
  }
}

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  selectedAssetId: string | null;
  eligibleAssets: OfertaLocalScanEligibleAsset[];
  deskMode?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function OfertasLocalesSourceAdPreviewPanel({
  lang,
  draft,
  selectedAssetId,
  eligibleAssets,
  deskMode = false,
  collapsible = false,
  collapsed = false,
  onCollapsedChange,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const [zoom, setZoom] = useState<ZoomLevel>("fit");

  const resolved = useMemo(
    () => resolveDraftAsset(draft, selectedAssetId),
    [draft, selectedAssetId]
  );

  const eligible = eligibleAssets.find((a) => a.assetId === selectedAssetId);
  const asset = resolved?.asset;
  const previewUrl = eligible?.assetUrl || asset?.url || "";
  const isPdf =
    asset?.mimeType === "application/pdf" ||
    asset?.assetType.endsWith("_pdf") ||
    previewUrl.toLowerCase().includes(".pdf");
  const isImage = Boolean(asset?.mimeType.startsWith("image/"));
  const hasPreview = Boolean(previewUrl && asset && assetHasUploadedWithUrl(asset));

  const role =
    asset && resolved
      ? roleLabelForAsset(draft, asset, resolved.bucket, lang)
      : lang === "en"
        ? "Source file"
        : "Archivo fuente";

  const viewerHeightClass = deskMode
    ? "h-[min(58vh,620px)] min-h-[340px] lg:h-[min(78vh,920px)] lg:min-h-[70vh]"
    : "h-[min(60vh,560px)] min-h-[320px]";
  const zoomButtons: { id: ZoomLevel; label: string }[] = [
    { id: "fit", label: lang === "en" ? "Fit width" : "Ajustar" },
    { id: "100", label: "100%" },
    { id: "125", label: "125%" },
    { id: "150", label: "150%" },
  ];

  const body = (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex rounded-full bg-[#7A1E2C]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">
            {role}
          </span>
          <p className="mt-2 break-words text-sm font-semibold text-[#1E1814] sm:text-base">
            {asset?.fileName || asset?.title || "—"}
          </p>
          {asset?.mimeType ? (
            <p className="text-[10px] text-[#1E1814]/55 sm:text-xs">
              {asset.mimeType}
              {asset.sizeBytes != null ? ` · ${formatOfertaLocalFileSize(asset.sizeBytes)}` : ""}
            </p>
          ) : null}
        </div>
        {previewUrl ? (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BTN} w-full shrink-0 text-center text-[#7A1E2C] sm:w-auto`}
          >
            {isPdf ? c.assetsOpenPdf : c.assetsOpenInNewTab}
          </a>
        ) : null}
      </div>

      {!hasPreview ? (
        <div className="rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0] px-4 py-8 text-center text-xs text-[#1E1814]/60">
          {lang === "en"
            ? "Upload and save a file to preview it here."
            : "Sube y guarda un archivo para previsualizarlo aquí."}
        </div>
      ) : isPdf ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {zoomButtons.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`${BTN} ${zoom === id ? BTN_ACTIVE : ""}`}
                onClick={() => setZoom(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className={`overflow-auto rounded-xl border border-[#D4C4A8] bg-[#FDF8F0] shadow-inner ${viewerHeightClass}`}
          >
            <iframe
              title={asset?.fileName || "PDF preview"}
              src={previewUrl}
              className="h-full min-h-[inherit] border-0 bg-white"
              style={{ width: zoomWidth(zoom), minWidth: "100%" }}
            />
          </div>
        </div>
      ) : isImage ? (
        <div
          className={`overflow-auto rounded-xl border border-[#D4C4A8] bg-white p-2 ${viewerHeightClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={asset?.title || asset?.fileName || "Preview"}
            className="mx-auto h-full max-h-[inherit] w-full object-contain"
            style={zoom === "fit" || zoom === "100" ? undefined : { width: zoomWidth(zoom) }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[#D4C4A8] bg-white px-4 py-6 text-center">
          <p className="text-xs text-[#1E1814]/65">
            {lang === "en"
              ? "Preview not available for this file type."
              : "Vista previa no disponible para este tipo de archivo."}
          </p>
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN} mt-3 inline-flex text-[#7A1E2C]`}
            >
              {c.assetsOpenInNewTab}
            </a>
          ) : null}
        </div>
      )}
    </div>
  );

  const shellClass = deskMode
    ? "rounded-xl border border-[#D4C4A8]/70 bg-white p-4 shadow-sm sm:p-5"
    : "rounded-xl border border-[#D4C4A8]/70 bg-white p-4 shadow-sm";

  if (!collapsible) {
    return <div className={shellClass}>{body}</div>;
  }

  return (
    <div className="rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-[#7A1E2C]"
        onClick={() => onCollapsedChange?.(!collapsed)}
      >
        <span>{collapsed ? c.aiReviewViewFlyer : c.aiReviewHideFlyer}</span>
        <span className="text-xs text-[#1E1814]/50">{collapsed ? "▾" : "▴"}</span>
      </button>
      {!collapsed ? <div className="border-t border-[#D4C4A8]/50 px-4 pb-4 pt-3">{body}</div> : null}
    </div>
  );
}
