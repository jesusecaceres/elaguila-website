"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiImage,
  FiPlus,
  FiStar,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
import {
  clearLeonixReturningToEditSessionFlag,
  markPublishFlowOpeningPreview,
  useLeonixPublishLeaveGuard,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import {
  BUSINESS_TYPE_PRESETS,
  chipLabel,
  getBusinessTypePreset,
} from "../lib/businessTypePresets";
import { getClasificadosServiciosCopy } from "../lib/clasificadosServiciosApplicationCopy";
import type {
  ChipDef,
  ClasificadosServiciosApplicationState,
  DayKey,
  GalleryItem,
  ServiciosLang,
} from "../lib/clasificadosServiciosApplicationTypes";
import { LANGUAGE_OPTION_CHIPS } from "../lib/clasificadosServiciosApplicationTypes";
import {
  clearClasificadosServiciosApplicationFromBrowser,
  readClasificadosServiciosApplicationFromBrowser,
  writeClasificadosServiciosApplicationToBrowser,
} from "../lib/clasificadosServiciosStorage";
import { evaluateServiciosPublishReadiness } from "../lib/serviciosPublishReadiness";
import {
  clasificadosServiciosApplicationHasProgress,
  createDefaultClasificadosServiciosState,
  WEEK_DAY_LABELS,
} from "../lib/defaultClasificadosServiciosState";
import { mergeStateForBusinessTypeChange } from "../lib/presetStateMerge";
import {
  isProbablyValidWebUrl,
  newGalleryId,
  newTestimonialId,
  newVideoId,
  normalizeHttpUrl,
} from "../lib/socialAndUrlHelpers";
import { ServiciosPublishModal } from "./ServiciosPublishModal";

const DEBOUNCE_MS = 500;
const GALLERY_MAX = 24;
const VIDEO_MAX = 2;

const inputClass =
  "mt-1 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base leading-snug text-neutral-900 shadow-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD] sm:text-sm";
const inputWarn = "border-amber-400 bg-amber-50/50";
const sectionCard =
  "rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6";
const labelClass = "text-sm font-semibold text-neutral-800";

function toggleId(list: string[], id: string, on: boolean): string[] {
  const set = new Set(list);
  if (on) set.add(id);
  else set.delete(id);
  return Array.from(set);
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex min-h-[40px] shrink-0 touch-manipulation items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition active:scale-[0.99] sm:min-h-0 sm:py-1.5",
        selected
          ? "border-[#3B66AD] bg-[#3B66AD]/10 text-[#1e3a5f] ring-1 ring-[#3B66AD]/20"
          : "border-neutral-200 bg-neutral-50/80 text-neutral-700 hover:border-neutral-300",
      ].join(" ")}
    >
      {selected ? <FiCheck className="h-3.5 w-3.5 shrink-0 text-[#3B66AD]" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function ClasificadosServiciosApplication() {
  const searchParams = useSearchParams();
  const lang: ServiciosLang = searchParams?.get("lang") === "en" ? "en" : "es";
  const copy = getClasificadosServiciosCopy(lang);

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<ClasificadosServiciosApplicationState>(() => createDefaultClasificadosServiciosState());

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const offerImageInputRef = useRef<HTMLInputElement>(null);
  const offerPdfInputRef = useRef<HTMLInputElement>(null);
  const [logoUrlDraft, setLogoUrlDraft] = useState("");
  const [coverUrlDraft, setCoverUrlDraft] = useState("");
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [videoUrlDraft, setVideoUrlDraft] = useState("");
  const [galleryZoneActive, setGalleryZoneActive] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [mediaFlash, setMediaFlash] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!mediaFlash) return;
    const t = window.setTimeout(() => setMediaFlash(null), 4500);
    return () => window.clearTimeout(t);
  }, [mediaFlash]);

  useLayoutEffect(() => {
    clearLeonixReturningToEditSessionFlag();
  }, []);

  useEffect(() => {
    const s = readClasificadosServiciosApplicationFromBrowser();
    if (s) setState(s);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => writeClasificadosServiciosApplicationToBrowser(state), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [state, hydrated]);

  useLeonixPublishLeaveGuard({
    lang,
    isDirty: hydrated && clasificadosServiciosApplicationHasProgress(state),
    muxAssetIds: [],
  });

  const persistStateAndMarkOpeningPreview = useCallback(() => {
    markPublishFlowOpeningPreview();
    writeClasificadosServiciosApplicationToBrowser(stateRef.current);
  }, []);

  const preset = useMemo(() => getBusinessTypePreset(state.businessTypeId), [state.businessTypeId]);

  const listingPhase = useMemo(() => {
    const r = evaluateServiciosPublishReadiness(state, lang);
    if (r.ok) return "publish" as const;
    if (state.businessTypeId && state.businessName.trim().length >= 2) return "preview" as const;
    return "draft" as const;
  }, [state, lang]);

  const listingPhaseLine =
    listingPhase === "publish"
      ? copy.listingPhasePublish
      : listingPhase === "preview"
        ? copy.listingPhasePreview
        : copy.listingPhaseDraft;

  const setBusinessType = useCallback((id: string) => {
    setState((prev) => mergeStateForBusinessTypeChange(prev, id));
  }, []);

  const websiteInvalid = state.website.trim() && !isProbablyValidWebUrl(state.website);
  const offerLinkInvalid = state.offerLink.trim() && !isProbablyValidWebUrl(state.offerLink);
  const socialInvalid = {
    ig: state.socialInstagram.trim() && !isProbablyValidWebUrl(state.socialInstagram),
    fb: state.socialFacebook.trim() && !isProbablyValidWebUrl(state.socialFacebook),
    yt: state.socialYoutube.trim() && !isProbablyValidWebUrl(state.socialYoutube),
    tt: state.socialTiktok.trim() && !isProbablyValidWebUrl(state.socialTiktok),
    li: state.socialLinkedin.trim() && !isProbablyValidWebUrl(state.socialLinkedin),
  };

  const toggleLangChip = (id: string) => {
    setState((prev) => {
      const on = !prev.languageIds.includes(id);
      if (!on && prev.languageIds.length <= 1) return prev;
      return { ...prev, languageIds: toggleId(prev.languageIds, id, on) };
    });
  };

  const toggleChipList = (field: "selectedServiceIds" | "selectedReasonIds" | "selectedQuickFactIds", id: string) => {
    setState((prev) => {
      const cur = prev[field];
      const on = !cur.includes(id);
      return { ...prev, [field]: toggleId(cur, id, on) };
    });
  };

  const pickFileToUrl = async (file: File | null, field: "logoUrl" | "coverUrl") => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMediaFlash(copy.labels.mediaWrongFileType);
      return;
    }
    const url = await readFileAsDataUrl(file);
    setState((prev) => ({ ...prev, [field]: url }));
  };

  const addGalleryFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const filesArr = Array.from(files);
    const arr = filesArr.filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0 && filesArr.length > 0) {
      setMediaFlash(copy.labels.mediaWrongFileType);
      return;
    }
    const additions: GalleryItem[] = [];
    for (const f of arr) {
      const url = await readFileAsDataUrl(f);
      additions.push({ id: newGalleryId(), url, source: "file" as const });
    }
    setState((prev) => {
      const room = Math.max(0, GALLERY_MAX - prev.gallery.length);
      if (room === 0) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.galleryLimitHint.replace("{max}", String(GALLERY_MAX))),
        );
        return prev;
      }
      const use = additions.slice(0, room);
      if (additions.length > use.length) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.galleryPartialAdd.replace("{max}", String(GALLERY_MAX))),
        );
      }
      const gallery = [...prev.gallery, ...use];
      const gIds = new Set(gallery.map((g) => g.id));
      let fg = prev.featuredGalleryIds.filter((id) => gIds.has(id));
      for (const a of use) {
        if (fg.length >= 4) break;
        if (!fg.includes(a.id)) fg.push(a.id);
      }
      return { ...prev, gallery, featuredGalleryIds: fg.slice(0, 4) };
    });
  };

  const addGalleryUrl = () => {
    const raw = galleryUrlDraft.trim();
    if (!raw) return;
    if (!isProbablyValidWebUrl(raw)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    const id = newGalleryId();
    setState((prev) => {
      if (prev.gallery.length >= GALLERY_MAX) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.galleryLimitHint.replace("{max}", String(GALLERY_MAX))),
        );
        return prev;
      }
      const gallery = [...prev.gallery, { id, url: normalizeHttpUrl(raw), source: "url" as const }];
      const gIds = new Set(gallery.map((g) => g.id));
      let fg = prev.featuredGalleryIds.filter((x) => gIds.has(x));
      if (fg.length < 4 && !fg.includes(id)) fg.push(id);
      return { ...prev, gallery, featuredGalleryIds: fg.slice(0, 4) };
    });
    setGalleryUrlDraft("");
  };

  const toggleFeaturedGallery = (id: string) => {
    setState((prev) => {
      let fg = [...prev.featuredGalleryIds];
      if (fg.includes(id)) fg = fg.filter((x) => x !== id);
      else {
        if (fg.length >= 4) fg = fg.slice(1);
        fg.push(id);
      }
      return { ...prev, featuredGalleryIds: fg.slice(0, 4) };
    });
  };

  const moveGalleryItem = (index: number, delta: number) => {
    setState((prev) => {
      const next = index + delta;
      if (next < 0 || next >= prev.gallery.length) return prev;
      const gallery = [...prev.gallery];
      const [m] = gallery.splice(index, 1);
      gallery.splice(next, 0, m!);
      return { ...prev, gallery };
    });
  };

  const moveFeaturedOrder = (featuredIndex: number, delta: number) => {
    setState((prev) => {
      const fg = [...prev.featuredGalleryIds];
      const j = featuredIndex + delta;
      if (j < 0 || j >= fg.length) return prev;
      const a = fg[featuredIndex]!;
      fg[featuredIndex] = fg[j]!;
      fg[j] = a;
      return { ...prev, featuredGalleryIds: fg };
    });
  };

  const addVideoFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setMediaFlash(copy.labels.mediaWrongVideoType);
      return;
    }
    const url = await readFileAsDataUrl(file);
    setState((prev) => {
      if (prev.videos.length >= VIDEO_MAX) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.videosLimitHint.replace("{max}", String(VIDEO_MAX))),
        );
        return prev;
      }
      const row = { id: newVideoId(), url, source: "file" as const };
      const next = [...prev.videos, row].slice(0, VIDEO_MAX);
      if (prev.videos.length === 0) {
        return { ...prev, videos: [{ ...row, isPrimary: true }] };
      }
      const primaryId = prev.videos.find((v) => v.isPrimary === true)?.id ?? prev.videos[0]!.id;
      return { ...prev, videos: next.map((v) => ({ ...v, isPrimary: v.id === primaryId })) };
    });
  };

  const addVideoUrl = () => {
    const raw = videoUrlDraft.trim();
    if (!raw) return;
    if (!isProbablyValidWebUrl(raw)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    setState((prev) => {
      if (prev.videos.length >= VIDEO_MAX) {
        queueMicrotask(() =>
          setMediaFlash(copy.labels.videosLimitHint.replace("{max}", String(VIDEO_MAX))),
        );
        return prev;
      }
      const row = { id: newVideoId(), url: normalizeHttpUrl(raw), source: "url" as const };
      const next = [...prev.videos, row].slice(0, VIDEO_MAX);
      if (prev.videos.length === 0) {
        return { ...prev, videos: [{ ...row, isPrimary: true }] };
      }
      const primaryId = prev.videos.find((v) => v.isPrimary === true)?.id ?? prev.videos[0]!.id;
      return { ...prev, videos: next.map((v) => ({ ...v, isPrimary: v.id === primaryId })) };
    });
    setVideoUrlDraft("");
  };

  const setPrimaryVideoId = (id: string) => {
    setState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => ({ ...v, isPrimary: v.id === id })),
    }));
  };

  const applyUrlFallback = (field: "logoUrl" | "coverUrl", draft: string, clearDraft: () => void) => {
    const t = draft.trim();
    if (!t) return;
    if (!isProbablyValidWebUrl(t)) {
      setMediaFlash(copy.labels.invalidUrl);
      return;
    }
    setState((prev) => ({ ...prev, [field]: normalizeHttpUrl(t) }));
    clearDraft();
  };

  const updateHour = (day: DayKey, patch: Partial<(typeof state.hours)[0]>) => {
    setState((prev) => ({
      ...prev,
      hours: prev.hours.map((row) => (row.day === day ? { ...row, ...patch } : row)),
    }));
  };

  const previewHref = `/clasificados/publicar/servicios/preview?lang=${lang}`;
  const publicarHref = `/clasificados/publicar?lang=${lang}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F6F0E2] text-[#3D2C12]">
      <header className="border-b border-[#D8C79A]/60 bg-[#FFFDF7]/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-5 sm:py-6 lg:max-w-5xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight text-[#3D2C12] sm:text-2xl">{copy.pageTitle}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5D4A25]/90">{copy.pageSubtitle}</p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Link
                  href={lang === "es" ? "?lang=en" : "?lang=es"}
                  className="inline-flex min-h-[44px] touch-manipulation items-center rounded-lg border border-[#D8C79A]/70 bg-white px-3 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
                >
                  {copy.langToggle}
                </Link>
                <Link
                  href={`/clasificados/publicar/servicios/preview?lang=${lang}&sample=expert`}
                  onClick={persistStateAndMarkOpeningPreview}
                  className="inline-flex min-h-[44px] touch-manipulation items-center rounded-lg border border-[#D8C79A]/60 bg-white/80 px-3 py-2 text-xs font-semibold text-[#6b5c42] hover:bg-[#FFF6E7]"
                >
                  {copy.linkPreviewShell}
                </Link>
                <Link
                  href={publicarHref}
                  onClick={() => clearClasificadosServiciosApplicationFromBrowser()}
                  className="inline-flex min-h-[44px] touch-manipulation items-center text-sm font-medium text-[#5D4A25]/85 underline underline-offset-2 hover:text-[#3D2C12]"
                >
                  {copy.linkBack}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <p className="text-xs text-[#8a7a62]">{hydrated ? copy.saveHint : "…"}</p>
          {hydrated ? (
            <p className="mt-1 text-xs font-medium text-[#6b5c42]">{listingPhaseLine}</p>
          ) : null}
          <p className="mt-2 text-xs leading-snug text-[#7a6a52]">{copy.labels.bottomActionsHint}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-7 px-4 py-6 pb-32 sm:py-8 sm:pb-32 lg:max-w-5xl">
        {mediaFlash ? (
          <p
            className="rounded-xl border border-amber-200/90 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-950 shadow-sm"
            role="status"
            aria-live="polite"
          >
            {mediaFlash}
          </p>
        ) : null}
        {/* 1 · Tipo */}
        <section className={sectionCard} aria-labelledby="sec-type">
          <h2 id="sec-type" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.type}
          </h2>
          <p className="mt-1 text-sm text-[#5D4A25]/85">
            {lang === "es"
              ? "Elige el giro real de tu negocio. No necesitas navegar árboles de categorías."
              : "Pick your real trade. No category trees to navigate."}
          </p>
          <label className={`mt-4 block ${labelClass}`}>
            {copy.labels.businessType} <span className="text-red-600">*</span>
          </label>
          <select
            className={inputClass}
            value={state.businessTypeId}
            onChange={(e) => setBusinessType(e.target.value)}
            required
          >
            <option value="">{lang === "es" ? "Selecciona…" : "Select…"}</option>
            {BUSINESS_TYPE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "en" ? p.labelEn : p.labelEs}
              </option>
            ))}
          </select>
        </section>

        {/* 2 · Basic */}
        <section className={sectionCard} aria-labelledby="sec-basic">
          <h2 id="sec-basic" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.basic}
          </h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>{copy.labels.businessName}</label>
              <input
                className={inputClass}
                value={state.businessName}
                onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
                autoComplete="organization"
              />
            </div>
            <div>
              <label className={labelClass}>{copy.labels.city}</label>
              <input
                className={inputClass}
                value={state.city}
                onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))}
                autoComplete="address-level2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{copy.labels.serviceAreas}</label>
              <textarea
                className={inputClass}
                rows={2}
                value={state.serviceAreaNotes}
                onChange={(e) => setState((s) => ({ ...s, serviceAreaNotes: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>{copy.labels.phone}</label>
              <input
                className={inputClass}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={lang === "es" ? "Ej: (713) 555-0100" : "e.g. (713) 555-0100"}
                value={state.phone}
                onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>{copy.labels.whatsapp}</label>
              <input
                className={inputClass}
                type="tel"
                inputMode="tel"
                placeholder={lang === "es" ? "Solo números / código de país" : "Digits / country code"}
                value={state.whatsapp}
                onChange={(e) => setState((s) => ({ ...s, whatsapp: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{copy.labels.website}</label>
              <input
                className={`${inputClass} ${websiteInvalid ? inputWarn : ""}`}
                type="url"
                inputMode="url"
                placeholder="https://"
                value={state.website}
                onChange={(e) => setState((s) => ({ ...s, website: e.target.value }))}
              />
              {websiteInvalid ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>{copy.labels.languages}</p>
              <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {LANGUAGE_OPTION_CHIPS.map((c) => (
                  <Chip
                    key={c.id}
                    selected={state.languageIds.includes(c.id)}
                    onClick={() => toggleLangChip(c.id)}
                  >
                    {lang === "en" ? c.en : c.es}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3 · Media */}
        <section className={sectionCard} aria-labelledby="sec-media">
          <h2 id="sec-media" className="text-lg font-bold text-[#3D2C12]">
            {copy.sections.media}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5D4A25]/90">{copy.labels.mediaStructureIntro}</p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-xs leading-relaxed text-[#6b5c42]">
            <li>{copy.labels.galleryFeaturedHint}</li>
            <li>{copy.labels.galleryMoreHint}</li>
            <li>{copy.labels.galleryMultiSelectHint}</li>
            <li>{copy.labels.videosHint}</li>
          </ul>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <p className={labelClass}>{copy.labels.logo}</p>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.logoHelp}</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFileToUrl(e.target.files?.[0] ?? null, "logoUrl")} />
              <div
                role="button"
                tabIndex={0}
                aria-label={state.logoUrl ? copy.labels.replace : copy.labels.upload}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    logoInputRef.current?.click();
                  }
                }}
                onClick={() => logoInputRef.current?.click()}
                className="mt-2 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-8 text-center transition hover:border-[#3B66AD]/50"
              >
                {state.logoUrl ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-neutral-200 bg-white ring-2 ring-[#3B66AD]/15">
                    <Image src={state.logoUrl} alt="" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <>
                    <FiUpload className="h-8 w-8 text-[#B28A2F]" aria-hidden />
                    <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
                  </>
                )}
              </div>
              {state.logoUrl ? (
                <p className="mt-2 text-xs font-medium text-[#2d528d]">{copy.labels.mediaUploadedBadge}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {state.logoUrl ? (
                  <>
                    <button
                      type="button"
                      className="min-h-[40px] text-xs font-semibold text-[#3B66AD] underline"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {copy.labels.replace}
                    </button>
                    <button type="button" className="min-h-[40px] text-xs font-semibold text-red-700 underline" onClick={() => setState((s) => ({ ...s, logoUrl: "" }))}>
                      {copy.labels.remove}
                    </button>
                  </>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#5D4A25]/75">{copy.labels.urlFallback}</p>
              <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={`${inputClass} sm:min-w-0 sm:flex-1`}
                  placeholder="https://"
                  value={logoUrlDraft}
                  onChange={(e) => setLogoUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-2 text-sm font-semibold text-white sm:px-3"
                  onClick={() => applyUrlFallback("logoUrl", logoUrlDraft, () => setLogoUrlDraft(""))}
                >
                  {copy.labels.addUrl}
                </button>
              </div>
            </div>

            <div>
              <p className={labelClass}>{copy.labels.cover}</p>
              <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.coverHelp}</p>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFileToUrl(e.target.files?.[0] ?? null, "coverUrl")} />
              <div
                role="button"
                tabIndex={0}
                aria-label={state.coverUrl ? copy.labels.replace : copy.labels.upload}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    coverInputRef.current?.click();
                  }
                }}
                onClick={() => coverInputRef.current?.click()}
                className="mt-2 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-8 text-center hover:border-[#3B66AD]/50"
              >
                {state.coverUrl ? (
                  <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 ring-2 ring-[#3B66AD]/15">
                    <Image src={state.coverUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <FiImage className="h-10 w-10 text-[#B28A2F]" aria-hidden />
                    <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
                  </>
                )}
              </div>
              {state.coverUrl ? (
                <p className="mt-2 text-xs font-medium text-[#2d528d]">{copy.labels.mediaUploadedBadge}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {state.coverUrl ? (
                  <>
                    <button type="button" className="min-h-[40px] text-xs font-semibold text-[#3B66AD] underline" onClick={() => coverInputRef.current?.click()}>
                      {copy.labels.replace}
                    </button>
                    <button type="button" className="min-h-[40px] text-xs font-semibold text-red-700 underline" onClick={() => setState((s) => ({ ...s, coverUrl: "" }))}>
                      {copy.labels.remove}
                    </button>
                  </>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#5D4A25]/75">{copy.labels.urlFallback}</p>
              <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  className={`${inputClass} sm:min-w-0 sm:flex-1`}
                  placeholder="https://"
                  value={coverUrlDraft}
                  onChange={(e) => setCoverUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-2 text-sm font-semibold text-white sm:px-3"
                  onClick={() => applyUrlFallback("coverUrl", coverUrlDraft, () => setCoverUrlDraft(""))}
                >
                  {copy.labels.addUrl}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-[#D8C79A]/30 pt-8">
            <p className={labelClass}>{copy.labels.gallery}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.galleryListOrderHint}</p>
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#5D4A25]">
              {copy.labels.galleryCountLine.replace("{n}", String(state.gallery.length)).replace("{max}", String(GALLERY_MAX))}
            </p>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void addGalleryFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label={`${copy.labels.upload} — ${copy.labels.gallery}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  galleryInputRef.current?.click();
                }
              }}
              onClick={() => galleryInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryZoneActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                const rel = e.relatedTarget as Node | null;
                if (rel && e.currentTarget.contains(rel)) return;
                setGalleryZoneActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setGalleryZoneActive(false);
                void addGalleryFiles(e.dataTransfer.files);
              }}
              className={[
                "mt-3 flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition",
                galleryZoneActive
                  ? "border-[#3B66AD] bg-[#3B66AD]/5"
                  : "border-[#D8C79A]/80 bg-[#FFFCF7] hover:border-[#3B66AD]/45",
              ].join(" ")}
            >
              <FiUpload className="h-7 w-7 text-[#B28A2F]" aria-hidden />
              <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
              <span className="mt-1 max-w-sm text-xs text-[#6b5c42]">{copy.labels.dropzone}</span>
            </div>
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <input
                className={`${inputClass} min-w-0 sm:max-w-md sm:flex-1`}
                placeholder="https://…"
                value={galleryUrlDraft}
                onChange={(e) => setGalleryUrlDraft(e.target.value)}
              />
              <button
                type="button"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white"
                onClick={addGalleryUrl}
              >
                {copy.labels.addUrl}
              </button>
            </div>
            {state.gallery.length >= GALLERY_MAX ? (
              <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.galleryLimitHint.replace("{max}", String(GALLERY_MAX))}</p>
            ) : null}
            {state.gallery.length > 0 ? (
              <p className="mt-3 text-xs font-semibold text-[#5D4A25]">
                {copy.labels.galleryStatusLine
                  .replace("{total}", String(state.gallery.length))
                  .replace("{featured}", String(state.featuredGalleryIds.length))}
              </p>
            ) : null}
            {state.featuredGalleryIds.length > 0 ? (
              <div className="mt-6 rounded-xl border border-[#D8C79A]/50 bg-[#FFFCF7]/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5D4A25]">{copy.labels.featuredStripTitle}</p>
                <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.featuredStripHint}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {state.featuredGalleryIds.map((fid, fi) => {
                    const g = state.gallery.find((x) => x.id === fid);
                    if (!g) return null;
                    return (
                      <div key={fid} className="flex flex-col items-center gap-1">
                        <div className="relative h-16 w-20 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 sm:h-[72px] sm:w-[104px]">
                          <Image src={g.url} alt="" fill className="object-cover" unoptimized />
                          <span className="absolute left-1 top-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {fi + 1}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-[#D8C79A]/80 p-1.5 text-[#3D2C12] hover:bg-white"
                            onClick={() => moveFeaturedOrder(fi, -1)}
                            aria-label={copy.labels.moveFeaturedLeft}
                          >
                            <FiChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded border border-[#D8C79A]/80 p-1.5 text-[#3D2C12] hover:bg-white"
                            onClick={() => moveFeaturedOrder(fi, 1)}
                            aria-label={copy.labels.moveFeaturedRight}
                          >
                            <FiChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {state.gallery.length === 0 ? (
              <p className="mt-4 text-sm text-[#8a7a62]">{copy.labels.emptyGallery}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {state.gallery.map((g, gi) => {
                  const isFeatured = state.featuredGalleryIds.includes(g.id);
                  return (
                    <li
                      key={g.id}
                      className={[
                        "flex flex-col gap-3 rounded-xl border border-neutral-200/90 bg-[#FFFCF7] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-3",
                        isFeatured ? "ring-2 ring-[#B28A2F]/45 ring-offset-2 ring-offset-[#FFFCF7]" : "",
                      ].join(" ")}
                    >
                      <div className="relative mx-auto h-24 w-full max-w-[12rem] shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 sm:mx-0 sm:h-24 sm:w-32 sm:max-w-none">
                        <Image src={g.url} alt="" fill className="object-cover" unoptimized />
                        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          {g.source === "file" ? copy.labels.assetFromFile : copy.labels.assetFromUrl}
                        </span>
                      </div>
                      <div className="flex min-w-0 w-full flex-1 flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end">
                        <button
                          type="button"
                          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D8C79A]/80 text-[#3D2C12] hover:bg-white"
                          onClick={() => moveGalleryItem(gi, -1)}
                          aria-label={copy.labels.moveUp}
                        >
                          <FiChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[#D8C79A]/80 text-[#3D2C12] hover:bg-white"
                          onClick={() => moveGalleryItem(gi, 1)}
                          aria-label={copy.labels.moveDown}
                        >
                          <FiChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFeaturedGallery(g.id)}
                          className={[
                            "inline-flex min-h-[40px] touch-manipulation items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold sm:py-1",
                            isFeatured
                              ? "border-[#B28A2F] bg-[#FFF3D6] text-[#6b4f0a] ring-1 ring-[#B28A2F]/25"
                              : "border-neutral-200 bg-white text-[#5D4A25]",
                          ].join(" ")}
                        >
                          <FiStar className={isFeatured ? "h-3.5 w-3.5 text-[#B28A2F]" : "h-3.5 w-3.5"} aria-hidden />
                          {copy.labels.featuredToggle}
                          {isFeatured ? ` (${state.featuredGalleryIds.indexOf(g.id) + 1}/4)` : ""}
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-red-700 hover:bg-red-50"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              gallery: s.gallery.filter((x) => x.id !== g.id),
                              featuredGalleryIds: s.featuredGalleryIds.filter((fid) => fid !== g.id),
                            }))
                          }
                          aria-label={copy.labels.remove}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-10 border-t border-[#D8C79A]/40 pt-8">
            <p className={labelClass}>{copy.labels.videosTitle}</p>
            <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.videosHint}</p>
            <p className="mt-2 text-xs font-semibold tabular-nums text-[#5D4A25]">
              {copy.labels.videosCountLine.replace("{n}", String(state.videos.length)).replace("{max}", String(VIDEO_MAX))}
            </p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => void addVideoFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={state.videos.length >= VIDEO_MAX}
              className="mt-3 inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-3 text-sm font-semibold text-[#3D2C12] hover:border-[#3B66AD]/45 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <FiPlus className="h-4 w-4" aria-hidden />
              {copy.labels.upload}
            </button>
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <input
                className={`${inputClass} min-w-0 sm:max-w-md sm:flex-1`}
                placeholder={copy.labels.videoUrlPlaceholder}
                value={videoUrlDraft}
                onChange={(e) => setVideoUrlDraft(e.target.value)}
              />
              <button
                type="button"
                disabled={state.videos.length >= VIDEO_MAX}
                className="inline-flex min-h-[44px] w-full shrink-0 touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-4 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                onClick={addVideoUrl}
              >
                {copy.labels.addVideoUrl}
              </button>
            </div>
            {state.videos.length >= VIDEO_MAX ? (
              <p className="mt-2 text-xs text-[#8a7a62]">{copy.labels.videosLimitHint.replace("{max}", String(VIDEO_MAX))}</p>
            ) : null}
            {state.videos.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {state.videos.map((v) => {
                  const url = v.url ?? "";
                  const isData = url.startsWith("data:");
                  const previewLine = isData ? copy.labels.videoFromFile : copy.labels.videoFromUrl;
                  const detail = isData ? "—" : url.length > 56 ? `${url.slice(0, 56)}…` : url || "—";
                  return (
                    <li
                      key={v.id}
                      className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex rounded-full bg-[#3B66AD]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2d528d]">
                          {previewLine}
                        </span>
                        <p className="mt-1 break-all text-xs font-medium text-[#3D2C12]">{detail}</p>
                      </div>
                      <div className="flex w-full flex-col gap-2 border-t border-neutral-100 pt-2 sm:w-auto sm:flex-row sm:items-center sm:border-t-0 sm:pt-0">
                        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-xs font-medium text-[#5D4A25]">
                          <input
                            type="radio"
                            name="primary-video"
                            checked={v.isPrimary === true}
                            onChange={() => setPrimaryVideoId(v.id)}
                            className="h-4 w-4 text-[#3B66AD]"
                          />
                          {copy.labels.videoPrimary}
                        </label>
                        <button
                          type="button"
                          className="min-h-[44px] self-start text-left text-xs font-semibold text-red-700 hover:underline sm:self-center"
                          onClick={() => setState((s) => ({ ...s, videos: s.videos.filter((x) => x.id !== v.id) }))}
                        >
                          {copy.labels.remove}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>

        {/* 4 · About */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.about}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/80">{copy.labels.aboutHelper}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.aboutServicesGapNote}</p>
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.about}</label>
          <textarea
            className={inputClass}
            rows={5}
            value={state.aboutText}
            onChange={(e) => setState((s) => ({ ...s, aboutText: e.target.value }))}
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.specialties}</label>
          <input
            className={inputClass}
            value={state.specialtiesLine}
            onChange={(e) => setState((s) => ({ ...s, specialtiesLine: e.target.value }))}
          />
        </section>

        {preset ? (
          <>
            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.services}</h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.servicesHint}</p>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.suggestedServices.map((c: ChipDef) => (
                  <Chip
                    key={c.id}
                    selected={state.selectedServiceIds.includes(c.id)}
                    onClick={() => toggleChipList("selectedServiceIds", c.id)}
                  >
                    {chipLabel(c, lang)}
                  </Chip>
                ))}
              </div>
              <label className={`mt-6 block ${labelClass}`}>{copy.labels.customService}</label>
              <input
                className={inputClass}
                placeholder={copy.labels.customServicePlaceholder}
                value={state.customServiceLabel}
                onChange={(e) => setState((s) => ({ ...s, customServiceLabel: e.target.value }))}
              />
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.reasons}</h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.reasonsHint}</p>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.reasonsToChoose.map((c: ChipDef) => (
                  <Chip
                    key={c.id}
                    selected={state.selectedReasonIds.includes(c.id)}
                    onClick={() => toggleChipList("selectedReasonIds", c.id)}
                  >
                    {chipLabel(c, lang)}
                  </Chip>
                ))}
              </div>
            </section>

            <section className={sectionCard}>
              <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.quickFacts}</h2>
              <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.quickHint}</p>
              <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.quickFacts.map((c: ChipDef) => (
                  <Chip
                    key={c.id}
                    selected={state.selectedQuickFactIds.includes(c.id)}
                    onClick={() => toggleChipList("selectedQuickFactIds", c.id)}
                  >
                    {chipLabel(c, lang)}
                  </Chip>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className={`${sectionCard} border-dashed border-amber-300/80 bg-amber-50/40`}>
            <p className="text-sm font-medium text-amber-900">
              {lang === "es"
                ? "Selecciona un tipo de negocio arriba para ver servicios sugeridos, motivos y datos rápidos."
                : "Choose a business type above to unlock suggested services, reasons, and quick facts."}
            </p>
          </section>
        )}

        {/* 8 · Contact */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.contact}</h2>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
              checked={state.leonixVerifiedInterest}
              onChange={(e) => setState((s) => ({ ...s, leonixVerifiedInterest: e.target.checked }))}
            />
            <span>
              <span className="font-semibold text-[#3D2C12]">{copy.labels.leonixVerified}</span>
              <span className="mt-0.5 block text-xs font-normal text-[#5D4A25]/85">{copy.labels.leonixVerifiedHint}</span>
            </span>
          </label>
          <p className="mt-6 text-sm font-medium text-[#5D4A25]">{lang === "es" ? "Métodos de contacto visibles" : "Visible contact methods"}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableCall}
                onChange={(e) => setState((s) => ({ ...s, enableCall: e.target.checked }))}
              />
              {copy.labels.enableCall}
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableMessage}
                onChange={(e) => setState((s) => ({ ...s, enableMessage: e.target.checked }))}
              />
              {copy.labels.enableMessage}
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableWhatsapp}
                onChange={(e) => setState((s) => ({ ...s, enableWhatsapp: e.target.checked }))}
              />
              {copy.labels.enableWhatsapp}
            </label>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm sm:min-h-0">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableWebsite}
                onChange={(e) => setState((s) => ({ ...s, enableWebsite: e.target.checked }))}
              />
              {copy.labels.enableWebsite}
            </label>
          </div>

          {preset ? (
            <>
              <p className={`mt-6 ${labelClass}`}>{copy.labels.primaryCta}</p>
              <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                {preset.primaryCtaOptions.map((c: ChipDef) => (
                  <Chip
                    key={c.id}
                    selected={state.primaryCtaId === c.id}
                    onClick={() => setState((s) => ({ ...s, primaryCtaId: c.id }))}
                  >
                    {chipLabel(c, lang)}
                  </Chip>
                ))}
              </div>
              {preset.secondaryCtaOptions.length > 0 ? (
                <>
                  <p className={`mt-6 ${labelClass}`}>{copy.labels.secondaryCta}</p>
                  <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
                    {preset.secondaryCtaOptions.map((c: ChipDef) => (
                      <Chip
                        key={c.id}
                        selected={state.secondaryCtaIds.includes(c.id)}
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            secondaryCtaIds: toggleId(s.secondaryCtaIds, c.id, !s.secondaryCtaIds.includes(c.id)),
                          }))
                        }
                      >
                        {chipLabel(c, lang)}
                      </Chip>
                    ))}
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </section>

        {/* 9 · Social */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.social}</h2>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
            {(
              [
                ["socialInstagram", copy.labels.instagram, state.socialInstagram, socialInvalid.ig] as const,
                ["socialFacebook", copy.labels.facebook, state.socialFacebook, socialInvalid.fb] as const,
                ["socialYoutube", copy.labels.youtube, state.socialYoutube, socialInvalid.yt] as const,
                ["socialTiktok", copy.labels.tiktok, state.socialTiktok, socialInvalid.tt] as const,
                ["socialLinkedin", copy.labels.linkedin, state.socialLinkedin, socialInvalid.li] as const,
              ] as const
            ).map(([key, lab, val, inv]) => (
              <div key={key}>
                <label className={labelClass}>{lab}</label>
                <input
                  className={`${inputClass} ${inv ? inputWarn : ""}`}
                  type="url"
                  placeholder="https://"
                  value={val}
                  onChange={(e) => setState((s) => ({ ...s, [key]: e.target.value }))}
                />
                {inv ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
              </div>
            ))}
          </div>
        </section>

        {/* 10 · Hours */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.hours}</h2>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.hoursOutputHint}</p>
          <div className="mt-4 space-y-3">
            {state.hours.map((row) => (
              <div
                key={row.day}
                className="flex flex-col gap-2 rounded-xl border border-neutral-100 bg-[#FFFCF7] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:py-2"
              >
                <span className="shrink-0 text-sm font-semibold text-[#3D2C12] sm:w-28">{WEEK_DAY_LABELS[row.day][lang]}</span>
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                  <label className="flex min-h-[40px] cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={row.closed}
                      onChange={(e) => updateHour(row.day, { closed: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    {copy.labels.closed}
                  </label>
                  {!row.closed ? (
                    <>
                      <input
                        type="time"
                        className={`${inputClass} w-[min(100%,9rem)] max-w-[140px] sm:w-auto`}
                        value={row.open}
                        onChange={(e) => updateHour(row.day, { open: e.target.value })}
                      />
                      <span className="text-neutral-500">—</span>
                      <input
                        type="time"
                        className={`${inputClass} w-[min(100%,9rem)] max-w-[140px] sm:w-auto`}
                        value={row.close}
                        onChange={(e) => updateHour(row.day, { close: e.target.value })}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 11 · Testimonials */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.testimonials}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.testimonialsNote}</p>
          <div className="mt-4 space-y-4">
            {state.testimonials.map((t) => (
              <div key={t.id} className="rounded-xl border border-neutral-200 bg-[#FFFCF7] p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-[#5D4A25]">{copy.labels.testimonialAuthor}</label>
                    <input
                      className={inputClass}
                      value={t.authorName}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          testimonials: s.testimonials.map((x) => (x.id === t.id ? { ...x, authorName: e.target.value } : x)),
                        }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#5D4A25]">{copy.labels.testimonialQuote}</label>
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={t.quote}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          testimonials: s.testimonials.map((x) => (x.id === t.id ? { ...x, quote: e.target.value } : x)),
                        }))
                      }
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-red-700 hover:underline"
                  onClick={() => setState((s) => ({ ...s, testimonials: s.testimonials.filter((x) => x.id !== t.id) }))}
                >
                  {copy.labels.remove}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[#D8C79A]/80 bg-white px-4 py-2 text-sm font-semibold text-[#3D2C12]"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  testimonials: [...s.testimonials, { id: newTestimonialId(), authorName: "", quote: "" }],
                }))
              }
            >
              <FiPlus className="h-4 w-4" aria-hidden />
              {copy.labels.addTestimonial}
            </button>
          </div>
        </section>

        {/* 12 · Offer */}
        <section className={sectionCard}>
          <h2 className="text-lg font-bold text-[#3D2C12]">{copy.sections.offer}</h2>
          <p className="mt-1 text-sm text-[#5D4A25]/75">{copy.labels.offerNote}</p>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerAssetsIntro}</p>
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerTitle}</label>
          <input
            className={inputClass}
            value={state.offerTitle}
            onChange={(e) => setState((s) => ({ ...s, offerTitle: e.target.value }))}
          />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerDetails}</label>
          <textarea className={inputClass} rows={3} value={state.offerDetails} onChange={(e) => setState((s) => ({ ...s, offerDetails: e.target.value }))} />
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerLink}</label>
          <input
            className={`${inputClass} ${offerLinkInvalid ? inputWarn : ""}`}
            type="url"
            value={state.offerLink}
            onChange={(e) => setState((s) => ({ ...s, offerLink: e.target.value }))}
          />
          {offerLinkInvalid ? <p className="mt-1 text-xs text-amber-800">{copy.labels.invalidUrl}</p> : null}
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerImage}</label>
          <input
            ref={offerImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!f.type.startsWith("image/")) {
                setMediaFlash(copy.labels.mediaWrongFileType);
                e.target.value = "";
                return;
              }
              void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, offerImageUrl: url })));
            }}
          />
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[#D8C79A]/80 bg-white px-3 py-2 text-xs font-semibold text-[#3D2C12]"
                onClick={() => offerImageInputRef.current?.click()}
              >
                {copy.labels.upload}
              </button>
              {state.offerImageUrl ? (
                <button
                  type="button"
                  className="min-h-[44px] text-xs font-semibold text-red-700 underline"
                  onClick={() => setState((s) => ({ ...s, offerImageUrl: "" }))}
                >
                  {copy.labels.remove}
                </button>
              ) : null}
            </div>
            {state.offerImageUrl ? (
              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  <Image src={state.offerImageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
                <p className="text-xs font-medium text-[#2d528d]">{copy.labels.mediaUploadedBadge}</p>
              </div>
            ) : null}
          </div>
          <label className={`mt-4 block ${labelClass}`}>{copy.labels.offerPdf}</label>
          <input
            ref={offerPdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.type !== "application/pdf") {
                setMediaFlash(copy.labels.mediaWrongPdfType);
                e.target.value = "";
                return;
              }
              void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, offerPdfUrl: url })));
            }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[#D8C79A]/80 bg-white px-3 py-2 text-xs font-semibold text-[#3D2C12]"
              onClick={() => offerPdfInputRef.current?.click()}
            >
              {copy.labels.upload}
            </button>
            {state.offerPdfUrl ? (
              <>
                <span className="inline-flex items-center rounded-full bg-[#3B66AD]/10 px-2.5 py-1 text-[11px] font-semibold text-[#2d528d]">PDF</span>
                <button
                  type="button"
                  className="min-h-[44px] text-xs font-semibold text-red-700 underline"
                  onClick={() => setState((s) => ({ ...s, offerPdfUrl: "" }))}
                >
                  {copy.labels.remove}
                </button>
              </>
            ) : null}
          </div>
          <p className={`mt-6 ${labelClass}`}>{copy.labels.offerPrimaryLabel}</p>
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:pb-0">
            {(
              [
                ["none", copy.labels.offerPrimaryNone] as const,
                ["link", copy.labels.offerPrimaryLink] as const,
                ["image", copy.labels.offerPrimaryImage] as const,
                ["pdf", copy.labels.offerPrimaryPdf] as const,
              ] as const
            ).map(([val, lab]) => (
              <Chip key={val} selected={state.offerPrimaryAsset === val} onClick={() => setState((s) => ({ ...s, offerPrimaryAsset: val }))}>
                {lab}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#6b5c42]">{copy.labels.offerAssetContractNote}</p>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-[#5D4A25]">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
              checked={state.offerQrLater}
              onChange={(e) => setState((s) => ({ ...s, offerQrLater: e.target.checked }))}
            />
            <span>{copy.labels.offerQrLater}</span>
          </label>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D8C79A]/60 bg-[#FFFDF7]/98 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_rgba(61,44,18,0.12)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2 px-3 sm:px-4 lg:max-w-5xl">
          <Link
            href={previewHref}
            onClick={persistStateAndMarkOpeningPreview}
            className="flex min-h-[52px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-3 py-3 text-center text-sm font-bold leading-tight text-white shadow-sm transition hover:bg-[#2f5699] active:opacity-95 sm:min-h-[48px]"
          >
            {copy.previewCta}
          </Link>
          <button
            type="button"
            onClick={() => setPublishOpen(true)}
            className="flex min-h-[52px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl border-2 border-[#3B66AD]/45 bg-white px-3 py-3 text-center text-sm font-bold leading-tight text-[#2f5699] shadow-sm transition hover:bg-[#3B66AD]/5 active:opacity-95 sm:min-h-[48px]"
          >
            {copy.publishCta}
          </button>
        </div>
      </div>

      <ServiciosPublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        state={state}
        lang={lang}
        copy={copy}
        onPersistDraft={() => writeClasificadosServiciosApplicationToBrowser(stateRef.current)}
        getLatestState={() => stateRef.current}
      />
    </div>
  );
}
