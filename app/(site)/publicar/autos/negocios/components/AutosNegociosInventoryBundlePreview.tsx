"use client";

import { useState } from "react";
import type { AutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  additionalInventoryVehicleTitle,
  computeInventoryVehicleStatus,
  inventoryVehicleCoverUrl,
  inventoryVehiclePhotoCount,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  autosInventoryBundleAdditionalLabel,
  autosInventoryBundleEdit,
  autosInventoryBundleEmptyState,
  autosInventoryBundleMainLabel,
  autosInventoryBundlePhotoCount,
  autosInventoryBundlePreviewCta,
  autosInventoryBundleRemove,
  autosInventoryBundleSectionTitle,
  autosInventoryBundleStatusDraft,
  autosInventoryBundleStatusReady,
  autosInventoryRemoveConfirm,
  autosResultsCardLeonixIdNote,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";
import { AutosNegociosAddInventoryDrawer } from "./AutosNegociosAddInventoryDrawer";
import { AutosNegociosChildInventoryPreviewOverlay } from "./AutosNegociosChildInventoryPreviewOverlay";
import { writeAutosNegociosEditorReturnContext } from "@/app/lib/clasificados/autos/autosNegociosEditorReturnContext";
import type { AutosInventoryAddContext } from "@/app/lib/clasificados/autos/autosDealerInventoryAddFlow";

function formatPrice(n?: number): string | null {
  if (n === undefined || !Number.isFinite(n)) return null;
  const s = formatUsdIntegerInputDisplay(n);
  return s ? `$${s}` : null;
}

function formatMiles(n?: number): string | null {
  if (n === undefined || !Number.isFinite(n)) return null;
  return formatMileageInputDisplay(n) || null;
}

function mainCoverUrl(listing: AutoDealerListing): string | null {
  const primary = listing.mediaImages?.find((m) => m.isPrimary)?.url ?? listing.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  return listing.heroImages?.[0]?.trim() || null;
}

function VehicleCard({
  lang,
  label,
  title,
  price,
  mileage,
  imageUrl,
  statusLabel,
  photoLabel,
  onEdit,
  onRemove,
  onPreview,
}: {
  lang: AutosNegociosLang;
  label: string;
  title: string;
  price: string | null;
  mileage: string | null;
  imageUrl: string | null;
  statusLabel: string;
  photoLabel?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
  onPreview?: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-sm">
      <div className="aspect-[16/10] w-full bg-[#F0E8DC]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-medium text-[#8A7A68]">
            {lang === "es" ? "Sin imagen" : "No image"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E5418]">{label}</p>
        <h4 className="mt-1 text-sm font-bold text-[#1E1810]">{title}</h4>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5C5346]">
          {price ? <span>{price}</span> : null}
          {mileage ? <span>{mileage} mi</span> : null}
          {photoLabel ? <span>{photoLabel}</span> : null}
        </div>
        <p className="mt-2 text-[11px] font-semibold text-[#6E5418]">{statusLabel}</p>
        {onPreview ? (
          <p className="mt-1 text-[10px] text-[#8A7A68]">{autosResultsCardLeonixIdNote(lang)}</p>
        ) : null}
        {onEdit || onRemove || onPreview ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-3">
            {onPreview ? (
              <button type="button" className="text-xs font-bold text-[#2A2620] hover:underline" onClick={onPreview}>
                {autosInventoryBundlePreviewCta(lang)}
              </button>
            ) : null}
            {onEdit ? (
              <button type="button" className="text-xs font-bold text-[#6E5418] hover:underline" onClick={onEdit}>
                {autosInventoryBundleEdit(lang)}
              </button>
            ) : null}
            {onRemove ? (
              <button type="button" className="text-xs font-bold text-red-800 hover:underline" onClick={onRemove}>
                {autosInventoryBundleRemove(lang)}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function AutosNegociosInventoryBundlePreview({
  lang,
  copy,
  listing,
  additionalVehicles,
  additionalCount,
  onSaveVehicle,
  onRemoveVehicle,
  flushDraft,
  editorStep = 6,
  editorMaxReached = 6,
  rehydrateFromStorage,
  inventoryAddMode = false,
  inventoryAddContext = null,
  backToEditLabel,
  drawerOpen = false,
  drawerEditingId = null,
  onDrawerOpenChange,
  inProgressDraft = null,
  onInProgressChange,
  onEditParentDealerStep,
}: {
  lang: AutosNegociosLang;
  copy: AutosNegociosCopy;
  listing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  additionalCount: number;
  onSaveVehicle: (vehicle: AutosAdditionalInventoryVehicleDraft) => boolean;
  onRemoveVehicle: (id: string) => void;
  flushDraft?: (opts?: { editorStep?: number; editorMaxReached?: number }) => Promise<void>;
  rehydrateFromStorage?: () => Promise<void>;
  editorStep?: number;
  editorMaxReached?: number;
  inventoryAddMode?: boolean;
  inventoryAddContext?: AutosInventoryAddContext | null;
  backToEditLabel?: string;
  drawerOpen?: boolean;
  drawerEditingId?: string | null;
  onDrawerOpenChange?: (open: boolean, editingId?: string | null) => void;
  inProgressDraft?: AutosAdditionalInventoryVehicleDraft | null;
  onInProgressChange?: (draft: AutosAdditionalInventoryVehicleDraft | null) => void;
  onEditParentDealerStep?: () => void;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const editOpen = drawerOpen && Boolean(drawerEditingId);
  const editingVehicle = drawerEditingId
    ? (additionalVehicles.find((v) => v.id === drawerEditingId) ?? null)
    : null;
  const previewVehicle = previewId ? (additionalVehicles.find((v) => v.id === previewId) ?? null) : null;

  const mainTitle =
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ||
    listing.vehicleTitle ||
    (lang === "es" ? "Vehículo principal" : "Main vehicle");
  const mainReady = Boolean(listing.year && listing.make && listing.model);
  const mainStatus = mainReady ? autosInventoryBundleStatusReady(lang) : autosInventoryBundleStatusDraft(lang);
  const mainPhotos = listing.mediaImages?.length ?? 0;

  const gridClass =
    additionalVehicles.length >= 4
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : additionalVehicles.length >= 2
        ? "sm:grid-cols-2"
        : additionalVehicles.length === 1
          ? "sm:grid-cols-2 max-w-3xl"
          : "max-w-md";

  return (
    <>
      <section className="mb-6 rounded-2xl border border-[color:var(--lx-gold-border)]/40 bg-[color:var(--lx-section)]/60 p-5">
        <h3 className="text-base font-extrabold text-[color:var(--lx-text)]">{autosInventoryBundleSectionTitle(lang)}</h3>
        {additionalVehicles.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{autosInventoryBundleEmptyState(lang)}</p>
        ) : null}
        <div className={`mt-4 grid gap-4 ${gridClass}`}>
          <VehicleCard
            lang={lang}
            label={autosInventoryBundleMainLabel(lang)}
            title={mainTitle}
            price={formatPrice(listing.price)}
            mileage={formatMiles(listing.mileage)}
            imageUrl={mainCoverUrl(listing)}
            statusLabel={mainStatus}
            photoLabel={mainPhotos > 0 ? autosInventoryBundlePhotoCount(lang, mainPhotos) : null}
          />
          {additionalVehicles.map((v) => {
            const ready = computeInventoryVehicleStatus(v) === "ready_for_preview";
            const photos = inventoryVehiclePhotoCount(v);
            return (
              <VehicleCard
                key={v.id}
                lang={lang}
                label={autosInventoryBundleAdditionalLabel(lang)}
                title={additionalInventoryVehicleTitle(v)}
                price={formatPrice(v.price)}
                mileage={formatMiles(v.mileage)}
                imageUrl={inventoryVehicleCoverUrl(v)}
                statusLabel={ready ? autosInventoryBundleStatusReady(lang) : autosInventoryBundleStatusDraft(lang)}
                photoLabel={photos > 0 ? autosInventoryBundlePhotoCount(lang, photos) : null}
                onPreview={async () => {
                  writeAutosNegociosEditorReturnContext({
                    returnStep: editorStep,
                    returnMode: "child-preview",
                    childId: v.id,
                    lang,
                    inventoryAddMode: Boolean(inventoryAddMode && inventoryAddContext),
                    inventoryAddContext: inventoryAddMode ? inventoryAddContext : null,
                  });
                  await flushDraft?.({
                    editorStep,
                    editorMaxReached: Math.max(editorMaxReached, editorStep),
                  });
                  setPreviewId(v.id);
                }}
                onEdit={() => onDrawerOpenChange?.(true, v.id)}
                onRemove={() => {
                  if (typeof window !== "undefined" && !window.confirm(autosInventoryRemoveConfirm(lang))) return;
                  onRemoveVehicle(v.id);
                  void flushDraft?.();
                }}
              />
            );
          })}
        </div>
      </section>
      <AutosNegociosAddInventoryDrawer
        open={editOpen}
        onClose={() => onDrawerOpenChange?.(false)}
        lang={lang}
        copy={copy}
        parentListing={listing}
        additionalVehicles={additionalVehicles}
        additionalCount={additionalCount}
        editingVehicle={editingVehicle}
        inProgressDraft={inProgressDraft}
        drawerEditingId={drawerEditingId}
        onInProgressChange={onInProgressChange}
        onEditParentDealerStep={onEditParentDealerStep}
        onSave={(vehicle) => {
          const ok = onSaveVehicle(vehicle);
          if (ok) void flushDraft?.();
          return ok;
        }}
        flushDraft={flushDraft}
      />
      {previewVehicle ? (
        <AutosNegociosChildInventoryPreviewOverlay
          lang={lang}
          parentListing={listing}
          child={previewVehicle}
          allAdditional={additionalVehicles}
          backToEditLabel={backToEditLabel ?? (lang === "es" ? "Volver a editar" : "Back to edit")}
          onBackToEdit={async () => {
            await rehydrateFromStorage?.();
            setPreviewId(null);
          }}
        />
      ) : null}
    </>
  );
}
