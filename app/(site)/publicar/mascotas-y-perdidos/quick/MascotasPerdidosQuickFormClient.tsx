"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import { MascotasPerdidosShellLayout } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/MascotasPerdidosShellLayout";
import { mascotasPerdidosLangFromSearchParams } from "@/app/(site)/clasificados/mascotas-y-perdidos/shared/mascotasPerdidosShellCopy";
import { EmpleosReadinessBanner } from "@/app/publicar/empleos/shared/components/EmpleosReadinessBanner";
import {
  EmpleosFieldLabel,
  EmpleosSectionCard,
} from "@/app/publicar/empleos/shared/ui/empleosFormPrimitives";
import {
  flushCommunityDraftToSession,
  useCommunityDraftSession,
} from "@/app/publicar/community/shared/hooks/useCommunityDraftSession";

import { markPublishFlowOpeningPreview } from "@/app/clasificados/lib/publishFlowLifecycleClient";

import { mascotasPerdidosFormCopy } from "../shared/mascotasPerdidosFormCopy";
import { mascotasPerdidosHandoffPreviewUrl } from "../shared/mascotasPerdidosPublishRoutes";
import {
  emptyMascotasPerdidosQuickDraft,
  normalizeMascotasPerdidosQuickDraft,
} from "../shared/mascotasPerdidosQuickDraft";
import { gateMascotasPerdidosQuickPreview } from "../shared/mascotasPerdidosRequiredForPreview";
import { MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY } from "../shared/mascotasPerdidosSessionKeys";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "../shared/mascotasPerdidosTaxonomy";

const INPUT =
  "mt-1 min-h-[44px] w-full rounded-lg border border-[#C9B46A]/40 bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#A98C2A]/70 focus:ring-2 focus:ring-[#C9B46A]/30";
const TEXTAREA =
  "mt-1 min-h-[96px] w-full rounded-lg border border-[#C9B46A]/40 bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#A98C2A]/70 focus:ring-2 focus:ring-[#C9B46A]/30";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function MascotasPerdidosQuickFormClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const copy = mascotasPerdidosFormCopy(lang);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const { state, patch, hydrated } = useCommunityDraftSession(
    MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY,
    emptyMascotasPerdidosQuickDraft(),
    (raw) => normalizeMascotasPerdidosQuickDraft(raw),
  );

  const gate = useMemo(() => gateMascotasPerdidosQuickPreview(state, lang), [state, lang]);
  const previewDisabled = !gate.ok;
  const previewIssues = gate.ok ? [] : gate.issues;

  const continueToPreview = useCallback(() => {
    if (previewDisabled) return;
    flushCommunityDraftToSession(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY, state, (raw) =>
      normalizeMascotasPerdidosQuickDraft(raw),
    );
    markPublishFlowOpeningPreview();
    router.push(mascotasPerdidosHandoffPreviewUrl(lang));
  }, [previewDisabled, state, router, lang]);

  const onImagePick = useCallback(
    (file: File | null) => {
      setImageError(null);
      if (!file) {
        patch({ imageDataUrl: "", imageFileName: "" });
        return;
      }
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        setImageError(lang === "es" ? "Usa JPG, PNG o WebP." : "Use JPG, PNG, or WebP.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(
          lang === "es" ? "La imagen es demasiado grande (máx. 8 MB)." : "Image is too large (max 8 MB).",
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = typeof reader.result === "string" ? reader.result : "";
        patch({ imageDataUrl: url, imageFileName: file.name });
      };
      reader.onerror = () => {
        setImageError(lang === "es" ? "No se pudo leer la imagen." : "Could not read the image.");
      };
      reader.readAsDataURL(file);
    },
    [patch, lang],
  );

  if (!hydrated) {
    return (
      <MascotasPerdidosShellLayout lang={lang}>
        <div className="min-h-[40vh] animate-pulse rounded-xl bg-[#EDE8DF]/60" aria-busy="true" />
      </MascotasPerdidosShellLayout>
    );
  }

  return (
    <MascotasPerdidosShellLayout lang={lang}>
      <p className="text-sm text-[#5C5346]/90">{copy.pageSubtitle}</p>
      <p className="mt-2 text-xs text-[#6B5A32]/90">{copy.leonixNote}</p>

      <EmpleosReadinessBanner visible={!gate.ok} intro={copy.gateFail} issues={previewIssues} />

      <form
        className="mt-5 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          continueToPreview();
        }}
      >
        <EmpleosSectionCard title={copy.sections.main}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.noticeType}
            </EmpleosFieldLabel>
            <select
              className={INPUT}
              value={state.noticeType}
              onChange={(e) => patch({ noticeType: e.target.value as typeof state.noticeType })}
            >
              <option value="">{lang === "es" ? "— Selecciona —" : "— Select —"}</option>
              {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "en" ? opt.labelEn : opt.labelEs}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.title}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              value={state.title}
              onChange={(e) => patch({ title: e.target.value })}
              maxLength={200}
            />
          </label>

          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.description}
            </EmpleosFieldLabel>
            <textarea
              className={TEXTAREA}
              value={state.description}
              onChange={(e) => patch({ description: e.target.value })}
              maxLength={800}
              rows={4}
              placeholder={lang === "es" ? "Describe brevemente…" : "Describe briefly…"}
            />
          </label>
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.media}>
          <p className="text-xs text-[#5C5346]/85">{copy.imageHint}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              onImagePick(f);
              e.target.value = "";
            }}
          />
          {state.imageDataUrl ? (
            <div>
              <img
                src={state.imageDataUrl}
                alt=""
                className="max-h-48 w-full rounded-xl border border-[#C9B46A]/35 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  patch({ imageDataUrl: "", imageFileName: "" });
                  setImageError(null);
                }}
                className="mt-2 min-h-[44px] rounded-lg border border-[#C9B46A]/45 px-3 py-2 text-sm font-semibold text-[#6B5A32]"
              >
                {copy.imageRemove}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-dashed border-[#C9B46A]/55 bg-[#FFFCF7] px-4 py-3 text-sm font-semibold text-[#6B5A32]"
            >
              {copy.fields.image}
            </button>
          )}
          {imageError ? <p className="text-sm text-red-700">{imageError}</p> : null}
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.location}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.city}
            </EmpleosFieldLabel>
            <CityAutocomplete
              value={state.city}
              onChange={(v) => patch({ city: v })}
              placeholder={lang === "es" ? "Ciudad" : "City"}
              lang={lang}
              variant="light"
              className={INPUT}
              stripInvalidOnBlur
            />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.lastSeenLocation}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              value={state.lastSeenLocation}
              onChange={(e) => patch({ lastSeenLocation: e.target.value })}
              maxLength={200}
              placeholder={
                lang === "es" ? "Ej. Parque, esquina, colonia…" : "E.g. park, corner, neighborhood…"
              }
            />
          </label>
        </EmpleosSectionCard>

        <EmpleosSectionCard title={copy.sections.contact}>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} required>
              {copy.fields.contactPhone}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={state.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <EmpleosFieldLabel lang={lang} optional>
              {copy.fields.email}
            </EmpleosFieldLabel>
            <input
              className={INPUT}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={state.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </label>
        </EmpleosSectionCard>

        <button
          type="submit"
          disabled={previewDisabled}
          className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-bold text-[#F5F5F5] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {copy.previewCta}
        </button>
      </form>
    </MascotasPerdidosShellLayout>
  );
}
