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
import { uploadOfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesAssetUpload";
import {
  validateOfertaLocalClientAssetFile,
  type OfertaLocalClientAssetKind,
} from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import {
  activeOfertaLocalDraftAssets,
  assetHasUploadedStorage,
  assetIsAiScanEligible,
  findDuplicateOfertaLocalDraftAsset,
  labelForOfertaLocalDraftAssetType,
  ofertaLocalDraftAssetRoleLabel,
  ofertaLocalDraftAssetUploadStatusLabel,
} from "@/app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers";
import { normalizeOfertaLocalUrlInput } from "@/app/lib/ofertas-locales/ofertasLocalesFormatting";
import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { formatOfertaLocalFileSize } from "@/app/lib/ofertas-locales/ofertasLocalesClientUploadValidation";
import {
  canAddAssetInSectionMode,
  visibleAssetsForSectionMode,
  type OfertaLocalDraftAssetSectionMode,
} from "@/app/lib/ofertas-locales/ofertasLocalesStep5AssetLayout";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_SHELL_COPY, ofertasLocalesAssetCopy, ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const INPUT =
  "w-full rounded-xl border border-[#D4C4A8]/90 bg-white px-3 py-2.5 text-sm text-[#1E1814] placeholder:text-[#1E1814]/40 focus:outline-none focus:ring-2 focus:ring-[#7A1E2C]/25";
const LABEL = "block text-xs font-semibold uppercase tracking-wide text-[#1E1814]/70";
const ASSET_CARD = "rounded-xl border border-[#D4C4A8]/80 bg-white p-4 space-y-3";
const BTN_SECONDARY =
  "rounded-xl border border-[#D4C4A8] bg-[#FFFCF7] px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";
const BTN_PRIMARY =
  "rounded-xl border border-[#7A1E2C] bg-[#7A1E2C] px-3 py-2 text-sm font-medium text-white hover:bg-[#6a1a26] disabled:cursor-not-allowed disabled:opacity-45";
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
  lang,
  roleLabel,
  localPreviewUrl,
  pendingFile,
  uploading,
  uploadError,
  duplicateWarning,
  replacedNotice,
  showPageSection,
  primaryFlyerMultiPageHelper,
  onChange,
  onRemove,
  onPreview,
  onFileSelect,
  onUpload,
}: {
  asset: OfertaLocalDraftAsset;
  assetKind: OfertaLocalClientAssetKind;
  lang: OfertasLocalesAppLang;
  roleLabel: string;
  localPreviewUrl?: string;
  pendingFile?: File;
  uploading: boolean;
  uploadError?: string | null;
  duplicateWarning?: string | null;
  replacedNotice?: string | null;
  showPageSection: boolean;
  primaryFlyerMultiPageHelper?: string;
  onChange: (patch: Partial<OfertaLocalDraftAsset>) => void;
  onRemove: () => void;
  onPreview: () => void;
  onFileSelect: (file: File, isReplace: boolean) => void;
  onUpload: () => void;
}) {
  const ac = ofertasLocalesAssetCopy(lang);
  const c = ofertasLocalesAppCopy(lang);
  const types = assetKind === "flyer" ? OFERTAS_LOCALES_FLYER_DRAFT_ASSET_TYPES : OFERTAS_LOCALES_COUPON_DRAFT_ASSET_TYPES;
  const [fileError, setFileError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const uploaded = assetHasUploadedStorage(asset);
  const scanEligible = assetIsAiScanEligible(asset);
  const uploadStatus = ofertaLocalDraftAssetUploadStatusLabel(asset, lang);
  const hasLocalSelection = Boolean(pendingFile) || (Boolean(asset.fileName.trim()) && !uploaded);
  const isPdf = asset.mimeType === "application/pdf" || asset.assetType.endsWith("_pdf");
  const externalUrlReady =
    asset.assetType === "external_url" && Boolean(normalizeOfertaLocalUrlInput(asset.url));
  const previewUrl =
    localPreviewUrl || (uploaded && asset.url && asset.mimeType.startsWith("image/") ? asset.url : asset.url);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReplace: boolean) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = validateOfertaLocalClientAssetFile(file, assetKind);
    if (!result.ok) {
      setFileError(result.errors.join(" ") || OFERTAS_LOCALES_SHELL_COPY.assetsValidationFailed);
      return;
    }
    setFileError(null);
    onFileSelect(file, isReplace);
    onChange({
      assetType: result.assetType,
      fileName: file.name,
      mimeType: file.type,
      status: "ready",
      storagePath: "",
      url: "",
      sizeBytes: null,
      title: asset.title.trim() || file.name.replace(/\.[^.]+$/, ""),
    });
  };

  const previewSrc =
    !isPdf &&
    (localPreviewUrl || (uploaded && asset.url && asset.mimeType.startsWith("image/") ? asset.url : undefined));

  return (
    <div className={ASSET_CARD}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <span className="inline-flex rounded-full bg-[#7A1E2C]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7A1E2C]">
            {roleLabel}
          </span>
          <p className="text-sm font-semibold text-[#1E1814]">
            {asset.fileName.trim() || asset.title.trim() || labelForOfertaLocalDraftAssetType(asset.assetType, lang)}
          </p>
          <p className="text-[10px] text-[#1E1814]/55">
            {labelForOfertaLocalDraftAssetType(asset.assetType, lang)}
            {asset.mimeType ? ` · ${asset.mimeType}` : ""}
            {asset.sizeBytes != null ? ` · ${formatOfertaLocalFileSize(asset.sizeBytes)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(uploaded || externalUrlReady) && previewUrl ? (
            <button type="button" className={BTN_SECONDARY} onClick={onPreview} disabled={uploading}>
              {c.assetsPreview}
            </button>
          ) : null}
          {asset.assetType !== "external_url" ? (
            <button
              type="button"
              className={BTN_SECONDARY}
              onClick={() => replaceInputRef.current?.click()}
              disabled={uploading}
            >
              {c.assetsReplace}
            </button>
          ) : null}
          <button type="button" className={BTN_DANGER} onClick={onRemove} disabled={uploading}>
            {OFERTAS_LOCALES_SHELL_COPY.assetsRemove}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-full border border-[#D4C4A8] bg-[#FDF8F0] px-2 py-0.5 font-medium text-[#1E1814]/70">
          {uploadStatus}
        </span>
        {asset.assetType !== "external_url" ? (
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              scanEligible
                ? "border border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border border-[#D4C4A8] bg-white text-[#1E1814]/50"
            }`}
          >
            {scanEligible ? c.assetsScanEligible : c.assetsScanNotEligible}
          </span>
        ) : null}
      </div>

      {duplicateWarning ? (
        <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {duplicateWarning}
        </p>
      ) : null}
      {replacedNotice ? (
        <p className="rounded-lg border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          {replacedNotice}
        </p>
      ) : null}

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
              storagePath: assetType === "external_url" ? "" : asset.storagePath,
              url: assetType === "external_url" ? asset.url : asset.url,
              sizeBytes: assetType === "external_url" ? null : asset.sizeBytes,
            });
          }}
        >
          {types.map((t) => {
            const opt = OFERTAS_LOCALES_DRAFT_ASSET_TYPE_OPTIONS.find((o) => o.value === t);
            return (
              <option key={t} value={t}>
                {lang === "en" ? opt?.labelEn : opt?.labelEs ?? t}
              </option>
            );
          })}
        </select>
      </div>
      {asset.assetType === "external_url" ? (
        <div>
          <label className={LABEL}>{ac.useExternalUrl}</label>
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
          <p className="mt-1 text-xs text-[#1E1814]/55">{ac.externalUrlReference}</p>
          {externalUrlReady ? (
            <p className="mt-1 text-xs font-medium text-emerald-800">{ac.linkAccepted}</p>
          ) : null}
        </div>
      ) : (
        <>
          <input
            ref={replaceInputRef}
            type="file"
            accept={FILE_ACCEPT}
            className="hidden"
            onChange={(e) => handleFileChange(e, true)}
            disabled={uploading}
          />
          <div>
            <label className={LABEL}>{ac.uploadFile}</label>
            <input
              type="file"
              accept={FILE_ACCEPT}
              className="w-full text-xs text-[#1E1814]/70 file:mr-3 file:rounded-lg file:border file:border-[#D4C4A8] file:bg-[#FDF8F0] file:px-3 file:py-1.5 file:text-xs"
              onChange={(e) => handleFileChange(e, false)}
              disabled={uploading}
            />
            {fileError ? <p className="mt-1 text-xs text-red-700">{fileError}</p> : null}
          </div>
          {hasLocalSelection && !uploaded ? (
            <div className="rounded-lg border border-[#7A1E2C]/20 bg-[#7A1E2C]/5 px-3 py-2 text-xs text-[#1E1814]/75">
              <p className="font-medium text-[#7A1E2C]">{ac.uploadPending}</p>
              <p className="mt-2">
                {pendingFile?.name ?? asset.fileName}
                {(pendingFile?.type ?? asset.mimeType) ? ` · ${pendingFile?.type ?? asset.mimeType}` : ""}
                {asset.sizeBytes != null ? ` · ${formatOfertaLocalFileSize(asset.sizeBytes)}` : ""}
              </p>
              {pendingFile ? (
                <button
                  type="button"
                  className={`${BTN_PRIMARY} mt-3`}
                  disabled={uploading}
                  onClick={() => onUpload()}
                >
                  {uploading ? ac.uploading : ac.uploadFile}
                </button>
              ) : null}
              {uploadError ? <p className="mt-2 text-red-700">{uploadError}</p> : null}
            </div>
          ) : null}
          {uploaded ? (
            <div className="rounded-lg border border-emerald-300/80 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <p className="font-medium">{ac.fileReceived}</p>
              <p className="mt-1">{asset.fileName}</p>
              {asset.mimeType ? <p className="text-emerald-800/80">{asset.mimeType}</p> : null}
              {asset.sizeBytes != null ? (
                <p className="text-emerald-800/70">{formatOfertaLocalFileSize(asset.sizeBytes)}</p>
              ) : null}
              {isPdf && asset.url ? (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 font-semibold text-[#7A1E2C]"
                >
                  {ac.pdfDocument} · PDF
                </a>
              ) : asset.url ? (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-semibold text-[#7A1E2C] underline"
                >
                  {ac.uploadedFile}
                </a>
              ) : (
                <p className="mt-1 text-emerald-800/70">{asset.storagePath}</p>
              )}
            </div>
          ) : null}
          {previewSrc ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewSrc}
                alt={asset.title || asset.fileName || "Vista previa"}
                className="max-h-48 w-full rounded-lg border border-[#D4C4A8] object-contain bg-white"
              />
              {!uploaded ? (
                <p className="text-[10px] text-[#1E1814]/45">
                  {OFERTAS_LOCALES_SHELL_COPY.assetsTempPreviewHint}
                  <span className="block">{OFERTAS_LOCALES_SHELL_COPY.assetsTempPreviewHintEn}</span>
                </p>
              ) : null}
            </div>
          ) : null}
          {primaryFlyerMultiPageHelper && (isPdf || asset.assetType === "flyer_pdf") ? (
            <p className="text-xs leading-relaxed text-[#1E1814]/60">{primaryFlyerMultiPageHelper}</p>
          ) : null}
          {(showPageSection && (isPdf || asset.pageNumber != null)) ? (
            <div>
              <label className={LABEL}>{ac.pageSectionLabel}</label>
              <p className="mb-1 text-xs text-[#1E1814]/55">{ac.pageSectionHelper}</p>
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
          ) : null}
        </>
      )}
      <p className="text-[10px] uppercase tracking-wide text-[#1E1814]/45">
        Estado: {asset.status}
        {asset.mimeType ? ` · ${asset.mimeType}` : ""}
        {asset.storagePath ? ` · storage` : ""}
      </p>
    </div>
  );
}

export function OfertasLocalesDraftAssetSection({
  bucket,
  draft,
  updateDraft,
  lang = "es",
  sectionTitleOverride,
  sectionHelper,
  sectionMode = "default",
  primaryFlyerMultiPageHelper,
  showAiScanFormatsHint = false,
  onPendingUploadsChange,
}: {
  bucket: AssetBucket;
  draft: OfertaLocalDraft;
  updateDraft: (partial: Partial<OfertaLocalDraft>) => void;
  lang?: OfertasLocalesAppLang;
  sectionTitleOverride?: string;
  sectionHelper?: string;
  sectionMode?: OfertaLocalDraftAssetSectionMode;
  primaryFlyerMultiPageHelper?: string;
  showAiScanFormatsHint?: boolean;
  onPendingUploadsChange?: (pendingCount: number) => void;
}) {
  const ac = ofertasLocalesAssetCopy(lang);
  const c = ofertasLocalesAppCopy(lang);
  const assetKind = bucketToKind(bucket);
  const assets = draft[bucket];
  const allActive = activeOfertaLocalDraftAssets(assets);
  const allDraftAssets = activeOfertaLocalDraftAssets([...draft.flyerAssets, ...draft.couponAssets]);
  const visibleActive = visibleAssetsForSectionMode(assets, sectionMode);
  const canAdd = canAddAssetInSectionMode(assets, sectionMode, maxAssets(bucket));
  const showPageSection = sectionMode !== "primaryMainFlyer";
  const isPrimaryFlyerMode = sectionMode === "primaryMainFlyer";
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [duplicateWarnings, setDuplicateWarnings] = useState<Record<string, string>>({});
  const [replacedNotices, setReplacedNotices] = useState<Record<string, string>>({});
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
    onPendingUploadsChange?.(Object.keys(pendingFiles).length);
  }, [pendingFiles, onPendingUploadsChange]);

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    return () => {
      onPendingUploadsChange?.(0);
    };
  }, [onPendingUploadsChange]);

  const setAssets = (next: OfertaLocalDraftAsset[]) => {
    updateDraft({ [bucket]: next } as Partial<OfertaLocalDraft>);
  };

  const updateAsset = (id: string, patch: Partial<OfertaLocalDraftAsset>) => {
    setAssets(assets.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const addAsset = (assetType: OfertaLocalDraftAsset["assetType"]) => {
    if (!canAdd) return;
    const next = createEmptyOfertaLocalDraftAsset(assetType, allActive.length);
    setAssets([...assets, next]);
  };

  const removeAsset = (id: string) => {
    revokePreview(id);
    setPendingFiles((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setDuplicateWarnings((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setReplacedNotices((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setAssets(assets.filter((a) => a.id !== id));
  };

  const handleFileSelect = (assetId: string, file: File, isReplace: boolean) => {
    const dup = findDuplicateOfertaLocalDraftAsset(allDraftAssets, file, assetId);
    if (dup) {
      setDuplicateWarnings((prev) => ({
        ...prev,
        [assetId]: c.assetsDuplicateWarning,
      }));
    } else {
      setDuplicateWarnings((prev) => {
        const { [assetId]: _, ...rest } = prev;
        return rest;
      });
    }
    if (isReplace) {
      const assetRecord = assets.find((a) => a.id === assetId);
      if (assetRecord) {
        const role = ofertaLocalDraftAssetRoleLabel({
          asset: assetRecord,
          bucket,
          sectionMode,
          lang,
        });
        setReplacedNotices((prev) => ({
          ...prev,
          [assetId]: `${c.assetsReplacedNotice} ${role}.`,
        }));
      }
    }
    revokePreview(assetId);
    setPendingFiles((prev) => ({ ...prev, [assetId]: file }));
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setLocalPreviews((prev) => ({ ...prev, [assetId]: url }));
    }
  };

  const openAssetPreview = (asset: OfertaLocalDraftAsset) => {
    const url = asset.url.trim();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpload = async (assetId: string) => {
    const file = pendingFiles[assetId];
    if (!file) return;

    setUploadErrors((prev) => {
      const { [assetId]: _, ...rest } = prev;
      return rest;
    });
    setUploadingIds((prev) => new Set(prev).add(assetId));
    try {
      const result = await uploadOfertaLocalDraftAsset({
        file,
        assetKind,
        assetId,
      });

      if (!result.ok) {
        throw new Error(
          result.errors?.join(" ") ||
            result.detail ||
            result.error ||
            OFERTAS_LOCALES_SHELL_COPY.assetsUploadFailed
        );
      }

      updateAsset(assetId, {
        assetType: result.assetType ?? assets.find((a) => a.id === assetId)?.assetType,
        fileName: result.fileName ?? file.name,
        mimeType: result.mimeType ?? file.type,
        storagePath: result.storagePath ?? "",
        url: result.publicUrl ?? "",
        sizeBytes: result.sizeBytes ?? file.size,
        status: "ready",
      });

      revokePreview(assetId);
      setPendingFiles((prev) => {
        const { [assetId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : `${OFERTAS_LOCALES_SHELL_COPY.assetsUploadFailed} / ${OFERTAS_LOCALES_SHELL_COPY.assetsUploadFailedEn}`;
      setUploadErrors((prev) => ({ ...prev, [assetId]: msg }));
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
    }
  };

  if (sectionMode === "supportingFlyerExtras" && visibleActive.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1E1814]">
          {sectionTitleOverride ?? sectionTitle(bucket)}
        </h3>
      </div>
      {sectionHelper ? (
        <p className="text-xs leading-relaxed text-[#1E1814]/60">{sectionHelper}</p>
      ) : null}
      {visibleActive.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#D4C4A8] bg-[#FDF8F0]/80 px-4 py-4 text-center text-sm text-[#1E1814]/55">
          {bucket === "flyerAssets"
            ? OFERTAS_LOCALES_SHELL_COPY.uploadFlyerPlaceholder
            : OFERTAS_LOCALES_SHELL_COPY.uploadCouponPlaceholder}
        </p>
      ) : null}
      {showAiScanFormatsHint && isPrimaryFlyerMode ? (
        <div className="rounded-lg border border-[#7A1E2C]/15 bg-[#7A1E2C]/5 px-3 py-2 text-xs leading-relaxed text-[#1E1814]/70">
          <p className="font-medium text-[#7A1E2C]">{c.assetsScanOrderMainFirst}</p>
          <p className="mt-1">{c.assetsScanOrderCouponsAfter}</p>
        </div>
      ) : null}
      {visibleActive.map((asset) => (
        <AssetEditor
          key={asset.id}
          asset={asset}
          assetKind={assetKind}
          lang={lang}
          roleLabel={ofertaLocalDraftAssetRoleLabel({ asset, bucket, sectionMode, lang })}
          localPreviewUrl={localPreviews[asset.id]}
          pendingFile={pendingFiles[asset.id]}
          uploading={uploadingIds.has(asset.id)}
          uploadError={uploadErrors[asset.id]}
          duplicateWarning={duplicateWarnings[asset.id]}
          replacedNotice={replacedNotices[asset.id]}
          showPageSection={showPageSection}
          primaryFlyerMultiPageHelper={isPrimaryFlyerMode ? primaryFlyerMultiPageHelper : undefined}
          onChange={(patch) => updateAsset(asset.id, patch)}
          onRemove={() => removeAsset(asset.id)}
          onPreview={() => openAssetPreview(asset)}
          onFileSelect={(file, isReplace) => handleFileSelect(asset.id, file, isReplace)}
          onUpload={() => void handleUpload(asset.id)}
        />
      ))}
      {canAdd ? (
        <div className="flex flex-wrap gap-2">
          {allowedTypes(bucket).map((t) => (
            <button
              key={t}
              type="button"
              className={BTN_SECONDARY}
              onClick={() => addAsset(t)}
            >
              + {labelForOfertaLocalDraftAssetType(t, lang)}
            </button>
          ))}
        </div>
      ) : null}
      {!canAdd && sectionMode === "default" && allActive.length >= maxAssets(bucket) ? (
        <p className="text-xs text-[#1E1814]/50">
          Máximo {bucket === "flyerAssets" ? OFERTAS_LOCALES_MAX_FLYER_ASSETS : OFERTAS_LOCALES_MAX_COUPON_ASSETS}{" "}
          archivos en borrador.
        </p>
      ) : null}
      {showAiScanFormatsHint ? (
        <p className="text-xs leading-relaxed text-[#1E1814]/60">{ac.aiScanFormats}</p>
      ) : null}
    </div>
  );
}
