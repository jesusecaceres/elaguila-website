"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FiCheck, FiChevronDown, FiChevronUp, FiImage, FiPlus, FiStar, FiTrash2, FiUpload } from "react-icons/fi";
import { readFileAsDataUrl } from "@/app/publicar/autos/negocios/lib/readFileAsDataUrl";
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
  readClasificadosServiciosApplicationFromBrowser,
  writeClasificadosServiciosApplicationToBrowser,
} from "../lib/clasificadosServiciosStorage";
import { createDefaultClasificadosServiciosState, WEEK_DAY_LABELS } from "../lib/defaultClasificadosServiciosState";
import { mergeStateForBusinessTypeChange } from "../lib/presetStateMerge";
import {
  isProbablyValidWebUrl,
  newGalleryId,
  newTestimonialId,
  newVideoId,
  normalizeHttpUrl,
} from "../lib/socialAndUrlHelpers";

const DEBOUNCE_MS = 500;

const inputClass =
  "mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-[#3B66AD] focus:ring-1 focus:ring-[#3B66AD]";
const inputWarn = "border-amber-400 bg-amber-50/50";
const sectionCard = "rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm";
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
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
        selected
          ? "border-[#3B66AD] bg-[#3B66AD]/10 text-[#1e3a5f]"
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

  const preset = useMemo(() => getBusinessTypePreset(state.businessTypeId), [state.businessTypeId]);

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
    if (!file?.type.startsWith("image/")) return;
    const url = await readFileAsDataUrl(file);
    setState((prev) => ({ ...prev, [field]: url }));
  };

  const addGalleryFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const additions: GalleryItem[] = [];
    for (const f of arr) {
      const url = await readFileAsDataUrl(f);
      additions.push({ id: newGalleryId(), url, source: "file" as const });
    }
    setState((prev) => {
      const gallery = [...prev.gallery, ...additions].slice(0, 24);
      const gIds = new Set(gallery.map((g) => g.id));
      let fg = prev.featuredGalleryIds.filter((id) => gIds.has(id));
      for (const a of additions) {
        if (fg.length >= 4) break;
        if (!fg.includes(a.id)) fg.push(a.id);
      }
      return { ...prev, gallery, featuredGalleryIds: fg.slice(0, 4) };
    });
  };

  const addGalleryUrl = () => {
    const raw = galleryUrlDraft.trim();
    if (!raw || !isProbablyValidWebUrl(raw)) return;
    const id = newGalleryId();
    setState((prev) => {
      const gallery = [...prev.gallery, { id, url: normalizeHttpUrl(raw), source: "url" as const }].slice(0, 24);
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

  const addVideoFile = async (file: File | null) => {
    if (!file?.type.startsWith("video/")) return;
    const url = await readFileAsDataUrl(file);
    setState((prev) => ({
      ...prev,
      videos: [...prev.videos, { id: newVideoId(), url, source: "file" as const }].slice(0, 2),
    }));
  };

  const addVideoUrl = () => {
    const raw = videoUrlDraft.trim();
    if (!raw || !isProbablyValidWebUrl(raw)) return;
    setState((prev) => ({
      ...prev,
      videos: [
        ...prev.videos,
        { id: newVideoId(), url: normalizeHttpUrl(raw), source: "url" as const },
      ].slice(0, 2),
    }));
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
    if (!t || !isProbablyValidWebUrl(t)) return;
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
    <div className="min-h-screen bg-[#F6F0E2] text-[#3D2C12]">
      <header className="border-b border-[#D8C79A]/60 bg-[#FFFDF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between lg:max-w-5xl">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#3D2C12]">{copy.pageTitle}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5D4A25]/90">{copy.pageSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={lang === "es" ? "?lang=en" : "?lang=es"}
              className="rounded-lg border border-[#D8C79A]/70 bg-white px-3 py-1.5 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF6E7]"
            >
              {copy.langToggle}
            </Link>
            <button
              type="button"
              onClick={() => {
                writeClasificadosServiciosApplicationToBrowser(state);
                window.location.assign(`/clasificados/publicar/servicios/preview?lang=${lang}`);
              }}
              className="rounded-lg bg-[#3B66AD] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#2f5699]"
            >
              {copy.previewCta}
            </button>
            <Link
              href={previewHref}
              className="rounded-lg border border-[#D8C79A]/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#5D4A25]/90 hover:bg-[#FFF6E7]"
            >
              {copy.linkPreviewShell}
            </Link>
            <Link href={publicarHref} className="text-sm font-medium text-[#5D4A25]/80 underline hover:text-[#3D2C12]">
              {copy.linkBack}
            </Link>
          </div>
        </div>
        <p className="mx-auto max-w-5xl px-4 pb-3 text-xs text-[#8a7a62]">{hydrated ? copy.saveHint : "…"}</p>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 lg:max-w-5xl">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
              <div className="mt-2 flex flex-wrap gap-2">
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
          <p className="mt-1 text-sm text-[#5D4A25]/85">{copy.labels.dropzone}</p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-xs leading-relaxed text-[#6b5c42]">
            <li>{copy.labels.galleryFeaturedHint}</li>
            <li>{copy.labels.galleryMoreHint}</li>
            <li>{copy.labels.videosHint}</li>
          </ul>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <p className={labelClass}>{copy.labels.logo}</p>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFileToUrl(e.target.files?.[0] ?? null, "logoUrl")} />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && logoInputRef.current?.click()}
                onClick={() => logoInputRef.current?.click()}
                className="mt-2 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-8 text-center transition hover:border-[#3B66AD]/50"
              >
                {state.logoUrl ? (
                  <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    <Image src={state.logoUrl} alt="" fill className="object-contain" unoptimized />
                  </div>
                ) : (
                  <>
                    <FiUpload className="h-8 w-8 text-[#B28A2F]" aria-hidden />
                    <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
                  </>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {state.logoUrl ? (
                  <button type="button" className="text-xs font-semibold text-[#3B66AD] underline" onClick={() => setState((s) => ({ ...s, logoUrl: "" }))}>
                    {copy.labels.remove}
                  </button>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-[#5D4A25]/75">{copy.labels.urlFallback}</p>
              <div className="mt-1 flex gap-2">
                <input
                  className={inputClass}
                  placeholder="https://"
                  value={logoUrlDraft}
                  onChange={(e) => setLogoUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-xl bg-[#3B66AD] px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => applyUrlFallback("logoUrl", logoUrlDraft, () => setLogoUrlDraft(""))}
                >
                  {copy.labels.addUrl}
                </button>
              </div>
            </div>

            <div>
              <p className={labelClass}>{copy.labels.cover}</p>
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickFileToUrl(e.target.files?.[0] ?? null, "coverUrl")} />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && coverInputRef.current?.click()}
                onClick={() => coverInputRef.current?.click()}
                className="mt-2 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-8 text-center hover:border-[#3B66AD]/50"
              >
                {state.coverUrl ? (
                  <div className="relative h-40 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                    <Image src={state.coverUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <FiImage className="h-10 w-10 text-[#B28A2F]" aria-hidden />
                    <span className="mt-2 text-sm font-semibold text-[#3D2C12]">{copy.labels.upload}</span>
                  </>
                )}
              </div>
              <div className="mt-2">{state.coverUrl ? <button type="button" className="text-xs font-semibold text-[#3B66AD] underline" onClick={() => setState((s) => ({ ...s, coverUrl: "" }))}>{copy.labels.remove}</button> : null}</div>
              <p className="mt-3 text-xs text-[#5D4A25]/75">{copy.labels.urlFallback}</p>
              <div className="mt-1 flex gap-2">
                <input
                  className={inputClass}
                  placeholder="https://"
                  value={coverUrlDraft}
                  onChange={(e) => setCoverUrlDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-xl bg-[#3B66AD] px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => applyUrlFallback("coverUrl", coverUrlDraft, () => setCoverUrlDraft(""))}
                >
                  {copy.labels.addUrl}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p className={labelClass}>{copy.labels.gallery}</p>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addGalleryFiles(e.target.files)} />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-3 text-sm font-semibold text-[#3D2C12] hover:border-[#3B66AD]/45"
            >
              <FiUpload className="h-4 w-4" aria-hidden />
              {copy.labels.upload}
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className={`${inputClass} max-w-md flex-1`}
                placeholder="https://…"
                value={galleryUrlDraft}
                onChange={(e) => setGalleryUrlDraft(e.target.value)}
              />
              <button type="button" className="rounded-xl bg-[#3B66AD] px-4 py-2 text-sm font-semibold text-white" onClick={addGalleryUrl}>
                {copy.labels.addUrl}
              </button>
            </div>
            {state.gallery.length === 0 ? (
              <p className="mt-4 text-sm text-[#8a7a62]">{copy.labels.emptyGallery}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {state.gallery.map((g, gi) => {
                  const isFeatured = state.featuredGalleryIds.includes(g.id);
                  return (
                    <li
                      key={g.id}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200/90 bg-[#FFFCF7] p-2 sm:flex-nowrap"
                    >
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 sm:h-24 sm:w-32">
                        <Image src={g.url} alt="" fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 sm:justify-end">
                        <button
                          type="button"
                          className="rounded-lg border border-[#D8C79A]/80 p-1.5 text-[#3D2C12] hover:bg-white"
                          onClick={() => moveGalleryItem(gi, -1)}
                          aria-label={copy.labels.moveUp}
                        >
                          <FiChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-[#D8C79A]/80 p-1.5 text-[#3D2C12] hover:bg-white"
                          onClick={() => moveGalleryItem(gi, 1)}
                          aria-label={copy.labels.moveDown}
                        >
                          <FiChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFeaturedGallery(g.id)}
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            isFeatured
                              ? "border-[#B28A2F] bg-[#FFF3D6] text-[#6b4f0a]"
                              : "border-neutral-200 bg-white text-[#5D4A25]",
                          ].join(" ")}
                        >
                          <FiStar className={isFeatured ? "h-3.5 w-3.5 text-[#B28A2F]" : "h-3.5 w-3.5"} aria-hidden />
                          {copy.labels.featuredToggle}
                          {isFeatured ? ` (${state.featuredGalleryIds.indexOf(g.id) + 1}/4)` : ""}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-red-700 hover:bg-red-50"
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
            <p className={labelClass}>{lang === "en" ? "Videos" : "Videos"}</p>
            <p className="mt-1 text-xs text-[#6b5c42]">{copy.labels.videosHint}</p>
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
              disabled={state.videos.length >= 2}
              className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-[#D8C79A]/80 bg-[#FFFCF7] px-4 py-3 text-sm font-semibold text-[#3D2C12] hover:border-[#3B66AD]/45 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiPlus className="h-4 w-4" aria-hidden />
              {copy.labels.upload}
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                className={`${inputClass} max-w-md flex-1`}
                placeholder={copy.labels.videoUrlPlaceholder}
                value={videoUrlDraft}
                onChange={(e) => setVideoUrlDraft(e.target.value)}
              />
              <button
                type="button"
                disabled={state.videos.length >= 2}
                className="rounded-xl bg-[#3B66AD] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={addVideoUrl}
              >
                {copy.labels.addVideoUrl}
              </button>
            </div>
            {state.videos.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {state.videos.map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                    <span className="min-w-0 truncate text-xs font-medium text-[#3D2C12]">{v.url.slice(0, 72)}{v.url.length > 72 ? "…" : ""}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#5D4A25]">
                        <input
                          type="radio"
                          name="primary-video"
                          checked={v.isPrimary === true}
                          onChange={() => setPrimaryVideoId(v.id)}
                          className="h-3.5 w-3.5 text-[#3B66AD]"
                        />
                        {copy.labels.videoPrimary}
                      </label>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-700 hover:underline"
                        onClick={() => setState((s) => ({ ...s, videos: s.videos.filter((x) => x.id !== v.id) }))}
                      >
                        {copy.labels.remove}
                      </button>
                    </div>
                  </li>
                ))}
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
              <div className="mt-4 flex flex-wrap gap-2">
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
              <div className="mt-4 flex flex-wrap gap-2">
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
              <div className="mt-4 flex flex-wrap gap-2">
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
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableCall}
                onChange={(e) => setState((s) => ({ ...s, enableCall: e.target.checked }))}
              />
              {copy.labels.enableCall}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableMessage}
                onChange={(e) => setState((s) => ({ ...s, enableMessage: e.target.checked }))}
              />
              {copy.labels.enableMessage}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableWhatsapp}
                onChange={(e) => setState((s) => ({ ...s, enableWhatsapp: e.target.checked }))}
              />
              {copy.labels.enableWhatsapp}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-[#3B66AD] focus:ring-[#3B66AD]"
                checked={state.enableWebsite}
                onChange={(e) => setState((s) => ({ ...s, enableWebsite: e.target.checked }))}
              />
              {copy.labels.enableWebsite}
            </label>
          </div>

          {preset ? (
            <>
              <p className={`mt-6 ${labelClass}`}>{copy.labels.primaryCta}</p>
              <div className="mt-2 flex flex-wrap gap-2">
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
                  <div className="mt-2 flex flex-wrap gap-2">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <div className="mt-4 space-y-3">
            {state.hours.map((row) => (
              <div key={row.day} className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-100 bg-[#FFFCF7] px-3 py-2">
                <span className="w-28 text-sm font-medium text-[#3D2C12]">{WEEK_DAY_LABELS[row.day][lang]}</span>
                <label className="flex items-center gap-2 text-sm">
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
                      className={`${inputClass} w-auto max-w-[140px]`}
                      value={row.open}
                      onChange={(e) => updateHour(row.day, { open: e.target.value })}
                    />
                    <span className="text-neutral-500">—</span>
                    <input
                      type="time"
                      className={`${inputClass} w-auto max-w-[140px]`}
                      value={row.close}
                      onChange={(e) => updateHour(row.day, { close: e.target.value })}
                    />
                  </>
                ) : null}
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
              if (!f?.type.startsWith("image/")) return;
              void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, offerImageUrl: url })));
            }}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-[#D8C79A]/80 bg-white px-3 py-2 text-xs font-semibold text-[#3D2C12]"
              onClick={() => offerImageInputRef.current?.click()}
            >
              {copy.labels.upload}
            </button>
            {state.offerImageUrl ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-700 hover:underline"
                onClick={() => setState((s) => ({ ...s, offerImageUrl: "" }))}
              >
                {copy.labels.remove}
              </button>
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
              if (!f || f.type !== "application/pdf") return;
              void readFileAsDataUrl(f).then((url) => setState((s) => ({ ...s, offerPdfUrl: url })));
            }}
          />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-[#D8C79A]/80 bg-white px-3 py-2 text-xs font-semibold text-[#3D2C12]"
              onClick={() => offerPdfInputRef.current?.click()}
            >
              {copy.labels.upload}
            </button>
            {state.offerPdfUrl ? (
              <button
                type="button"
                className="text-xs font-semibold text-red-700 hover:underline"
                onClick={() => setState((s) => ({ ...s, offerPdfUrl: "" }))}
              >
                {copy.labels.remove}
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
