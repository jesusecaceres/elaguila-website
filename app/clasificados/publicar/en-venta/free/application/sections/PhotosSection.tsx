"use client";

import { useRef } from "react";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaPhotosSectionProps } from "../types/sectionProps";
import { cx, labelClass } from "../helpers/fieldCx";

const COPY = {
  es: {
    title: "Fotos y medios",
    desc: "Añade fotos reales y bien iluminadas. Las fotos claras ayudan a vender más rápido.",
    planFree: "Plan Gratis: hasta 3 fotos. No se admite video en este plan.",
    planPro: "Plan Pro: hasta 12 fotos y 1 video corto (archivo o enlace).",
    count: (n: number, max: number) => `${n} / ${max} fotos`,
    primary: "Principal",
    setMain: "Usar como principal",
    moveUp: "Mover arriba",
    moveDown: "Mover abajo",
    add: "Añadir fotos",
    addHint: "PNG o JPG · se muestran al instante en tu borrador",
    atLimit: "Límite de fotos alcanzado para tu plan.",
    remove: "Quitar",
    emptyTitle: "Aún no hay fotos",
    emptyHint: "Sube al menos una foto clara del artículo. Puedes reordenarlas y marcar la principal.",
    videoTitle: "Video (Pro)",
    videoDesc: "Un clip corto ayuda, pero es opcional. Máximo 1 video.",
    videoFile: "Elegir archivo de video",
    videoLink: "O pega un enlace al video (YouTube, Vimeo, etc.)",
    videoClear: "Quitar video",
    noVideoFree: "El plan Gratis no incluye video; cambia a Pro para añadir video.",
    hint: "La publicación final conectará al almacenamiento; esto es tu borrador de medios.",
  },
  en: {
    title: "Photos & media",
    desc: "Add real, well-lit photos. Clear photos help items sell faster.",
    planFree: "Free plan: up to 3 photos. No video on Free.",
    planPro: "Pro plan: up to 12 photos and 1 short video (file or link).",
    count: (n: number, max: number) => `${n} / ${max} photos`,
    primary: "Main",
    setMain: "Set as main",
    moveUp: "Move up",
    moveDown: "Move down",
    add: "Add photos",
    addHint: "PNG or JPG · shown instantly in your draft",
    atLimit: "Photo limit reached for your plan.",
    remove: "Remove",
    emptyTitle: "No photos yet",
    emptyHint: "Upload at least one clear photo. You can reorder and pick a main image.",
    videoTitle: "Video (Pro)",
    videoDesc: "A short clip helps buyers — optional. Max 1 video.",
    videoFile: "Choose video file",
    videoLink: "Or paste a link (YouTube, Vimeo, etc.)",
    videoClear: "Remove video",
    noVideoFree: "Free doesn’t include video; switch to Pro to add video.",
    hint: "Publish will connect storage; this is your draft media.",
  },
} as const;

function revokeIfBlob(url: string | undefined) {
  if (url?.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

export function PhotosSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
  maxPhotos,
  allowVideo = false,
  surface = "light",
}: EnVentaPhotosSectionProps<S>) {
  const t = COPY[lang];
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const isProMedia = allowVideo && maxPhotos > 3;
  const dark = surface === "dark";
  const c = {
    plan: dark ? "text-white/85" : "text-[#111111]/80",
    hint: dark ? "text-white/55" : "text-[#111111]/55",
    count: dark ? "text-white/90" : "text-[#111111]/85",
    atLimit: dark ? "text-white/50" : "text-[#111111]/55",
    vidTitle: dark ? "text-white" : "text-[#111111]",
    vidDesc: dark ? "text-white/60" : "text-[#111111]/60",
    vidHint: dark ? "text-white/50" : "text-[#111111]/50",
    vidStatus: dark ? "text-white/55" : "text-[#111111]/55",
    imgBorder: dark ? "border-white/15" : "border-black/15",
    tray: dark ? "border-white/15 bg-white/[0.04]" : "border-black/12 bg-[#FAFAFA]",
    empty: dark ? "border-white/20 bg-white/[0.03] text-white/65" : "border-black/12 bg-white text-[#111111]/55",
    noVideoBox: dark ? "border-white/15 bg-white/5 text-white/60" : "border-black/15 bg-[#F7F7F7] text-[#111111]/60",
    label: dark ? "block text-xs font-semibold uppercase tracking-wide text-white/55" : labelClass,
    input:
      dark
        ? "mt-2 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35"
        : "mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-[#111111]",
    btnCta: dark
      ? "inline-flex items-center justify-center gap-2 rounded-xl border border-[#C9B46A]/50 bg-[#C9B46A]/15 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#C9B46A]/25"
      : "inline-flex items-center justify-center gap-2 rounded-xl border border-[#A98C2A]/40 bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] shadow-sm hover:opacity-95",
    btnDisabled: dark
      ? "inline-flex cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/35"
      : "inline-flex cursor-not-allowed rounded-xl border border-black/10 bg-[#EAEAEA] px-5 py-3 text-sm font-semibold text-[#111111]/40",
    btnVideo: dark
      ? "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
      : "rounded-xl border border-black/15 bg-[#F5F5F5] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#ECECEC]",
    btnGhost: dark
      ? "rounded-lg border border-white/20 bg-black/40 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black/55"
      : "rounded-lg border border-black/15 bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#111111] hover:bg-white",
    btnIcon: dark
      ? "rounded-lg border border-white/15 bg-black/50 px-2 py-1 text-[11px] font-semibold text-white hover:bg-black/65 disabled:cursor-not-allowed disabled:opacity-40"
      : "rounded-lg border border-black/10 bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#111111] hover:bg-white disabled:cursor-not-allowed disabled:opacity-40",
    divider: dark ? "border-white/10" : "border-black/10",
  };

  const n = state.images.length;
  const canAddMore = n < maxPhotos;
  const primaryIdx = Math.min(
    Math.max(0, state.primaryImageIndex),
    Math.max(0, n - 1)
  );

  function onImageFiles(files: FileList | null) {
    if (!files?.length) return;
    setState((s) => {
      const wasEmpty = s.images.length === 0;
      const next = [...s.images];
      for (let i = 0; i < files.length; i++) {
        if (next.length >= maxPhotos) break;
        next.push(URL.createObjectURL(files[i]));
      }
      const pi =
        next.length === 0 ? 0 : wasEmpty ? 0 : Math.min(s.primaryImageIndex, next.length - 1);
      return { ...s, images: next, primaryImageIndex: pi };
    });
  }

  function removeImage(index: number) {
    setState((s) => {
      const url = s.images[index];
      revokeIfBlob(url);
      const urls = s.images.filter((_, i) => i !== index);
      let nextPi = s.primaryImageIndex;
      if (urls.length === 0) nextPi = 0;
      else if (index === nextPi) nextPi = 0;
      else if (index < nextPi) nextPi = nextPi - 1;
      nextPi = Math.min(Math.max(0, nextPi), urls.length - 1);
      return { ...s, images: urls, primaryImageIndex: nextPi };
    });
  }

  function setPrimary(index: number) {
    setState((s) => ({ ...s, primaryImageIndex: index }));
  }

  function moveImage(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= state.images.length) return;
    setState((s) => {
      const imgs = [...s.images];
      [imgs[index], imgs[j]] = [imgs[j], imgs[index]];
      let pi = s.primaryImageIndex;
      if (pi === index) pi = j;
      else if (pi === j) pi = index;
      return { ...s, images: imgs, primaryImageIndex: pi };
    });
  }

  function onVideoFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setState((s) => {
      revokeIfBlob(s.listingVideoUrl);
      return { ...s, listingVideoUrl: URL.createObjectURL(f) };
    });
  }

  function clearVideo() {
    setState((s) => {
      revokeIfBlob(s.listingVideoUrl);
      return { ...s, listingVideoUrl: "" };
    });
  }

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div
        className={cx(
          "rounded-2xl border px-4 py-3 sm:px-5 sm:py-4",
          dark ? "border-white/12 bg-white/[0.03]" : "border-black/10 bg-white"
        )}
      >
        <p className={cx("text-sm font-semibold leading-snug", c.plan)}>{isProMedia ? t.planPro : t.planFree}</p>
        <p className={cx("mt-1.5 text-xs leading-relaxed", c.hint)}>{t.hint}</p>
      </div>

      <div className={cx("mt-5 rounded-2xl border p-4 sm:p-5", c.tray)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className={cx("text-sm font-bold", c.count)}>{t.count(n, maxPhotos)}</span>
            <p className={cx("mt-0.5 text-xs", c.hint)}>{t.addHint}</p>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onImageFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={!canAddMore}
            onClick={() => canAddMore && imageInputRef.current?.click()}
            className={canAddMore ? c.btnCta : c.btnDisabled}
          >
            {t.add}
          </button>
        </div>

        {n === 0 ? (
          <div
            className={cx(
              "mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center",
              c.empty
            )}
          >
            <p className="text-sm font-semibold">{t.emptyTitle}</p>
            <p className="mt-2 max-w-md text-xs leading-relaxed">{t.emptyHint}</p>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.images.map((url, index) => {
              const isMain = index === primaryIdx;
              return (
                <li
                  key={`${url}-${index}`}
                  className={cx(
                    "flex flex-col overflow-hidden rounded-2xl border shadow-sm",
                    c.imgBorder,
                    dark ? "bg-black/20" : "bg-white"
                  )}
                >
                  <div className="relative aspect-[4/3] w-full bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    {isMain ? (
                      <span className="absolute left-2 top-2 rounded-full bg-[#A98C2A] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                        {t.primary}
                      </span>
                    ) : null}
                    <div className="absolute bottom-0 left-0 right-0 flex flex-wrap gap-1.5 bg-gradient-to-t from-black/70 to-transparent p-2 pt-8">
                      {!isMain ? (
                        <button type="button" className={c.btnGhost} onClick={() => setPrimary(index)}>
                          {t.setMain}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={c.btnIcon}
                        disabled={index === 0}
                        onClick={() => moveImage(index, -1)}
                        aria-label={t.moveUp}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={c.btnIcon}
                        disabled={index >= n - 1}
                        onClick={() => moveImage(index, 1)}
                        aria-label={t.moveDown}
                      >
                        ↓
                      </button>
                      <button type="button" className={c.btnIcon} onClick={() => removeImage(index)}>
                        {t.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!canAddMore ? (
          <p className={cx("mt-4 text-xs font-medium", c.atLimit)}>{t.atLimit}</p>
        ) : null}
      </div>

      {allowVideo ? (
        <div className={cx("border-t pt-5", c.divider)}>
          <p className={cx("text-sm font-semibold", c.vidTitle)}>{t.videoTitle}</p>
          <p className={cx("mt-1 text-xs", c.vidDesc)}>{t.videoDesc}</p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              onVideoFile(e.target.files);
              e.target.value = "";
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => videoInputRef.current?.click()} className={c.btnVideo}>
              {t.videoFile}
            </button>
            {state.listingVideoUrl ? (
              <button type="button" onClick={clearVideo} className={c.btnGhost}>
                {t.videoClear}
              </button>
            ) : null}
          </div>
          <div className="mt-3">
            <label className={c.label}>{t.videoLink}</label>
            <input
              className={c.input}
              value={state.listingVideoUrl.startsWith("blob:") ? "" : state.listingVideoUrl}
              onChange={(e) =>
                setState((s) => {
                  const v = e.target.value.trim();
                  if (v.startsWith("http") || v === "") {
                    revokeIfBlob(s.listingVideoUrl);
                    return { ...s, listingVideoUrl: v };
                  }
                  return s;
                })
              }
              placeholder="https://"
            />
            <p className={cx("mt-1 text-xs", c.vidHint)}>
              {lang === "es"
                ? "Si subes un archivo, el enlace se puede dejar vacío."
                : "If you upload a file, you can leave the link blank."}
            </p>
          </div>
          {state.listingVideoUrl ? (
            <p className={cx("mt-2 text-xs", c.vidStatus)}>
              {state.listingVideoUrl.startsWith("blob:")
                ? lang === "es"
                  ? "Video local seleccionado (vista previa en el paso de publicación)."
                  : "Local video selected (preview when publish is wired)."
                : state.listingVideoUrl}
            </p>
          ) : null}
        </div>
      ) : (
        <p className={cx("mt-5 rounded-xl border border-dashed px-4 py-3 text-xs leading-relaxed", c.noVideoBox)}>
          {t.noVideoFree}
        </p>
      )}
    </SectionShell>
  );
}
