"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  OFERTAS_LOCALES_COUPON_DRAFT_ASSET_TYPES,
  OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS,
  OFERTAS_LOCALES_FLYER_DRAFT_ASSET_TYPES,
  OFERTAS_LOCALES_MAX_COUPON_ASSETS,
  OFERTAS_LOCALES_MAX_FLYER_ASSETS,
} from "@/app/lib/ofertas-locales/ofertasLocalesConstants";
import { createEmptyOfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/createEmptyOfertaLocalDraftAsset";
import {
  validateOfertaLocalClientAssetFile,
  type OfertaLocalClientAssetKind,
} from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import {
  activeOfertaLocalDraftAssets,
  labelForOfertaLocalDraftAssetType,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers";
import { normalizeOfertaLocalUrlInput } from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { OFERTAS_LOCALES_SHELL_COPY } from "./ofertasLocalesApplicationCopy";

const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const ASSET_CARD = "rounded-xl border border-[#D4C4A8]/80 bg-white p-4 space-y-3";
const BTN_SECONDARY =
  "rounded-xl border border-[#D4C4A8] bg-[#FFFCF7] px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_DANGER =
  "rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-800 hover:bg-red-50";
const FILE_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp";

type AssetBucket = "flyerAssets" | "couponAssets";

function bucketToKind(bucket: AssetBucket): OfertaLocalClientAssetKind {
  return bucket === "flyerAssets" ? "flyer" : "coupon";
}

function allowedTypes(bucket: AssetBucket) {
  return bucket === "flyerAssets"
    ? OFERTAS_LOCALES_FLYER_DRAFT_ASSET_TYPES
    : OFERTAS_LOCALES_COUPON_DRAFT_ASSET_TYPES;
}

function maxAssets(bucket: AssetBucket) {
  return bucket === "flyerAssets" ? OFERTAS_LOCALES_MAX_FLYER_ASSETS : OFERTAS_LOCALES_MAX_COUPON_ASSETS;
}

function sectionTitle(bucket: AssetBucket) {
  return bucket === "flyerAssets"
    ? OFERTAS_LOCALES_SHELL_COPY.assetsFlyerSectionTitle
    : OFERTAS_LOCALES_SHELL_COPY.assetsCouponSectionTitle;
}

function AssetEditor({
  asset,
  assetKind,
  localPreviewUrl,
  onChange,
  onRemove,
  onFileSelect,
}: {
  asset: OfertaLocalDraftAsset;
  assetKind: OfertaLocalClientAssetKind;
  localPreviewUrl?: string;
  onChange: (patch: Partial<OfertaLocalDraftAsset>) => void;
  onRemove: () => void;
  onFileSelect: (file: File) => void;
}) {
  const types = assetKind === "flyer" ? OFERTAS_LOCALES_FLYER_DRAFT_ASSET_TYPES : OFERTAS_LOCALES_COUPON_DRAFT_ASSET_TYPES;
  const [fileError, setFileError] = useState<string | null>(null);
  const hasLocalFile = asset.assetType !== "external_url" && asset.status === "ready" && asset.fileName.trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = validateOfertaLocalClientAssetFile(file, assetKind);
    if (!result.ok) {
      setFileError(result.errors.join(" ") || OFERTAS_LOCALES_SHELL_COPY.assetsValidationFailed);
      return;
    }
    setFileError(null);
    onFileSelect(file);
    onChange({
      assetType: result.assetType,
      fileName: file.name,
      mimeType: file.type,
      status: "ready",
      title: asset.title.trim() || file.name.replace(/\.[^.]+$/, ""),
    });
  };

  return (
    <div className={ASSET_CARD}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#1E1814]">
          {labelForOfertaLocalDraftAssetType(asset.assetType)}
        </p>
        <button type="button" className={BTN_DANGER} onClick={onRemove}>
          {OFERTAS_LOCALES_SHELL_COPY.assetsRemove}
        </button>
      </div>
      <div>
        <label className={LABEL}>{OFERTAS_LOCALES_SHELL_COPY.assetsTitle}</label>
        <input
          className={INPUT}
          value={asset.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>
      <div>
        <label className={LABEL}>Tipo</label>
        <select
          className={INPUT}
          value={asset.assetType}
          onChange={(e) => {
            const assetType = e.target.value as OfertaLocalDraftAsset["assetType"];
            onChange({
              assetType,
              status: assetType === "external_url" ? "draft" : "needs_upload",
              fileName: assetType === "external_url" ? "" : asset.fileName,
              mimeType: assetType === "external_url" ? "" : asset.mimeType,
            });
          }}
        >
          {types.map((t) => {
            const opt = OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS.find((o) => o.value === t);
            return (
              <option key={t} value={t}>
                {opt?.labelEs ?? t}
              </option>
            );
          })}
        </select>
      </div>
      {asset.assetType === "external_url" ? (
        <div>
          <label className={LABEL}>{OFERTAS_LOCALES_SHELL_COPY.assetsUrl}</label>
          <input
            className={INPUT}
            value={asset.url}
            onChange={(e) => onChange({ url: e.target.value })}
            onBlur={() => {
              const normalized = normalizeOfertaLocalUrlInput(asset.url);
              if (normalized) onChange({ url: normalized, status: "ready" });
            }}
            placeholder="https://"
          />
        </div>
      ) : (
        <>
          <div>
            <label className={LABEL}>{OFERTAS_LOCALES_SHELL_COPY.assetsSelectFile}</label>
            <input
              type="file"
              accept={FILE_ACCEPT}
              className="w-full text-xs text-[#1E1814]/70 file:mr-3 file:rounded-lg file:border file:border-[#D4C4A8] file:bg-[#FDF8F0] file:px-3 file:py-1.5 file:text-xs"
              onChange={handleFileChange}
            />
            {fileError ? <p className="mt-1 text-xs text-red-700">{fileError}</p> : null}
          </div>
          {hasLocalFile ? (
            <div className="rounded-lg border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-3 py-2 text-xs text-[#1E1814]/75">
              <p className="font-medium text-[#7A1E2C]">
                {OFERTAS_LOCALES_SHELL_COPY.assetsSelectedLocally}
              </p>
              <p className="mt-0.5 text-[#1E1814]/55">
                {OFERTAS_LOCALES_SHELL_COPY.assetsSelectedLocallyEn}
              </p>
              <p className="mt-2">
                {asset.fileName}
                {asset.mimeType ? ` · ${asset.mimeType}` : ""}
              </p>
              <p className="mt-1 text-[#1E1814]/55">
                {OFERTAS_LOCALES_SHELL_COPY.assetsNotUploadedYet} /{" "}
                {OFERTAS_LOCALES_SHELL_COPY.assetsNotUploadedYetEn}
              </p>
            </div>
          ) : null}
          {localPreviewUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPreviewUrl}
                alt={asset.title || asset.fileName || "Vista previa local"}
                className="max-h-48 w-full rounded-lg border border-[#D4C4A8] object-contain bg-white"
              />
              <p className="text-[10px] text-[#1E1814]/45">
                {OFERTAS_LOCALES_SHELL_COPY.assetsTempPreviewHint}
                <span className="block">{OFERTAS_LOCALES_SHELL_COPY.assetsTempPreviewHintEn}</span>
              </p>
            </div>
          ) : null}
          <div>
            <label className={LABEL}>{OFERTAS_LOCALES_SHELL_COPY.assetsPageNumber}</label>
            <input
              type="number"
              min={1}
              className={INPUT}
              value={asset.pageNumber ?? ""}
              onChange={(e) =>
                onChange({
                  pageNumber: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </>
      )}
      <div>
        <label className={LABEL}>{OFERTAS_LOCALES_SHELL_COPY.assetsNote}</label>
        <textarea
          className={`${INPUT} min-h-[60px] resize-y`}
          value={asset.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </div>
      <p className="text-[10px] uppercase tracking-wide text-[#1E1814]/45">
        Estado: {asset.status}
        {asset.mimeType ? ` · ${asset.mimeType}` : ""}
      </p>
    </div>
  );
}

export function OfertasLocalesDraftAssetSection({
  bucket,
  draft,
  updateDraft,
}: {
  bucket: AssetBucket;
  draft: OfertaLocalDraft;
  updateDraft: (partial: Partial<OfertaLocalDraft>) => void;
}) {
  const assetKind = bucketToKind(bucket);
  const assets = draft[bucket];
  const active = activeOfertaLocalDraftAssets(assets);
  const atMax = active.length >= maxAssets(bucket);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const previewsRef = useRef(localPreviews);
  previewsRef.current = localPreviews;

  const revokePreview = useCallback((assetId: string) => {
    setLocalPreviews((prev) => {
      const url = prev[assetId];
      if (url) URL.revokeObjectURL(url);
      const { [assetId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const setAssets = (next: OfertaLocalDraftAsset[]) => {
    updateDraft({ [bucket]: next } as Partial<OfertaLocalDraft>);
  };

  const updateAsset = (id: string, patch: Partial<OfertaLocalDraftAsset>) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const removeAsset = (id: string) => {
    revokePreview(id);
    setAssets(assets.filter((a) => a.id !== id));
  };

  const addAsset = (assetType: OfertaLocalDraftAsset["assetType"]) => {
    if (atMax) return;
    const next = createEmptyOfertaLocalDraftAsset(assetType, active.length);
    setAssets([...assets, next]);
  };

  const handleFileSelect = (assetId: string, file: File) => {
    revokePreview(assetId);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setLocalPreviews((prev) => ({ ...prev, [assetId]: url }));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1E1814]">{sectionTitle(bucket)}</h3>
        <p className="text-xs text-[#1E1814]/55">
          {OFERTAS_LOCALES_SHELL_COPY.assetsRealUploadSoon}
          <span className="ml-1 text-[#1E1814]/40">
            ({OFERTAS_LOCALES_SHELL_COPY.assetsRealUploadSoonEn})
          </span>
        </p>
      </div>
      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 px-4 py-4 text-center text-sm text-[#1E1814]/55">
          {bucket === "flyerAssets"
            ? OFERTAS_LOCALES_SHELL_COPY.uploadFlyerPlaceholder
            : OFERTAS_LOCALES_SHELL_COPY.uploadCouponPlaceholder}
        </p>
      ) : null}
      {active.map((asset) => (
        <AssetEditor
          key={asset.id}
          asset={asset}
          assetKind={assetKind}
          localPreviewUrl={localPreviews[asset.id]}
          onChange={(patch) => updateAsset(asset.id, patch)}
          onRemove={() => removeAsset(asset.id)}
          onFileSelect={(file) => handleFileSelect(asset.id, file)}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        {allowedTypes(bucket).map((t) => (
          <button
            key={t}
            type="button"
            className={BTN_SECONDARY}
            disabled={atMax}
            onClick={() => addAsset(t)}
          >
            + {labelForOfertaLocalDraftAssetType(t)}
          </button>
        ))}
      </div>
      {atMax ? (
        <p className="text-xs text-[#1E1814]/50">Máximo {maxAssets(bucket)} archivos en borrador.</p>
      ) : null}
    </div>
  );
}
