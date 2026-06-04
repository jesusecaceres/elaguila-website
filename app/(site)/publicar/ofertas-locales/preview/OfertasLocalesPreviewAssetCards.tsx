"use client";

import {
  activeOfertaLocalDraftAssets,
  assetHasExternalUrlReady,
  assetHasLocalFileMetadata,
  assetHasUploadedStorageOnly,
  assetHasUploadedWithUrl,
  assetNeedsFileUpload,
  labelForOfertaLocalDraftAssetType,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers";
import { normalizeOfertaLocalUrlInput } from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const CARD = "rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] p-4";
const BTN_LINK =
  "inline-flex items-center rounded-lg border border-[#7A1E2C]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#7A1E2C] hover:bg-[#7A1E2C]/5";
const BADGE =
  "inline-block rounded-md border border-amber-300/80 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900";
const UPLOADED_BADGE =
  "inline-block rounded-md border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900";

function externalLinkLabel(asset: OfertaLocalDraftAsset): string {
  if (asset.assetType.startsWith("flyer_")) {
    return `${OFERTAS_LOCALES_PREVIEW_COPY.openExternalFlyer} / ${OFERTAS_LOCALES_PREVIEW_COPY.openExternalFlyerEs}`;
  }
  return `${OFERTAS_LOCALES_PREVIEW_COPY.openExternalCoupon} / ${OFERTAS_LOCALES_PREVIEW_COPY.openExternalCouponEs}`;
}

function uploadedLinkLabel(asset: OfertaLocalDraftAsset): string {
  if (asset.assetType.startsWith("flyer_")) {
    return `${OFERTAS_LOCALES_PREVIEW_COPY.openUploadedFlyer} / ${OFERTAS_LOCALES_PREVIEW_COPY.openUploadedFlyerEs}`;
  }
  return `${OFERTAS_LOCALES_PREVIEW_COPY.openUploadedCoupon} / ${OFERTAS_LOCALES_PREVIEW_COPY.openUploadedCouponEs}`;
}

function AssetCard({ asset }: { asset: OfertaLocalDraftAsset }) {
  const externalHref =
    asset.assetType === "external_url" ? normalizeOfertaLocalUrlInput(asset.url) : "";
  const pendingUpload = assetNeedsFileUpload(asset);
  const localFileMeta = assetHasLocalFileMetadata(asset);
  const uploadedWithUrl = assetHasUploadedWithUrl(asset);
  const uploadedStorageOnly = assetHasUploadedStorageOnly(asset);
  const uploadedHref = uploadedWithUrl ? normalizeOfertaLocalUrlInput(asset.url) : "";

  return (
    <div className={CARD}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1E2C]">
          {labelForOfertaLocalDraftAssetType(asset.assetType)}
        </p>
        {uploadedWithUrl || uploadedStorageOnly ? (
          <span className={UPLOADED_BADGE}>Uploaded</span>
        ) : null}
        {localFileMeta ? <span className={BADGE}>{OFERTAS_LOCALES_PREVIEW_COPY.selectedFileBadge}</span> : null}
        {pendingUpload && !localFileMeta && !uploadedWithUrl && !uploadedStorageOnly ? (
          <span className="text-[10px] uppercase tracking-wide text-[#1E1814]/45">
            {OFERTAS_LOCALES_PREVIEW_COPY.uploadPending}
          </span>
        ) : null}
      </div>
      {asset.title.trim() ? (
        <p className="mt-2 text-sm font-medium text-[#1E1814]">{asset.title}</p>
      ) : null}
      {asset.note.trim() ? (
        <p className="mt-1 text-sm text-[#1E1814]/75">{asset.note}</p>
      ) : null}
      {localFileMeta ? (
        <div className="mt-3 space-y-1 text-xs text-[#1E1814]/70">
          <p>
            <span className="font-medium">Archivo:</span> {asset.fileName}
          </p>
          {asset.mimeType ? (
            <p>
              <span className="font-medium">Tipo:</span> {asset.mimeType}
            </p>
          ) : null}
          <p className="text-[#1E1814]/55">{OFERTAS_LOCALES_PREVIEW_COPY.selectedFilePendingMessage}</p>
          <p className="text-[#1E1814]/45">{OFERTAS_LOCALES_PREVIEW_COPY.selectedFilePendingMessageEn}</p>
        </div>
      ) : null}
      {uploadedWithUrl && uploadedHref ? (
        <a
          href={uploadedHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BTN_LINK} mt-3`}
        >
          {uploadedLinkLabel(asset)}
        </a>
      ) : null}
      {uploadedStorageOnly ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-emerald-900">
          {OFERTAS_LOCALES_PREVIEW_COPY.uploadedPreviewPendingEs} ·{" "}
          {OFERTAS_LOCALES_PREVIEW_COPY.uploadedPreviewPending}
        </p>
      ) : null}
      {asset.pageNumber != null ? (
        <p className="mt-1 text-xs text-[#1E1814]/45">Página {asset.pageNumber}</p>
      ) : null}
      {assetHasExternalUrlReady(asset) && externalHref ? (
        <a
          href={externalHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BTN_LINK} mt-3`}
        >
          {externalLinkLabel(asset)}
        </a>
      ) : null}
      {pendingUpload && !localFileMeta && !uploadedWithUrl && !uploadedStorageOnly ? (
        <p className="mt-3 rounded-lg border border-dashed border-[#D4C4A8] bg-white/80 px-3 py-2 text-center text-xs text-[#1E1814]/55">
          {OFERTAS_LOCALES_PREVIEW_COPY.uploadPendingEs} · {OFERTAS_LOCALES_PREVIEW_COPY.uploadPending}
        </p>
      ) : null}
    </div>
  );
}

export function OfertasLocalesPreviewAssetCards({
  draft,
  bucket,
  title,
}: {
  draft: OfertaLocalDraft;
  bucket: "flyerAssets" | "couponAssets";
  title: string;
}) {
  const assets = activeOfertaLocalDraftAssets(draft[bucket]);
  if (assets.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#1E1814]/60">{title}</h3>
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}
