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
    add: "Añadir fotos",
    atLimit: "Límite de fotos alcanzado para tu plan.",
    remove: "Quitar",
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
    primary: "Primary",
    add: "Add photos",
    atLimit: "Photo limit reached for your plan.",
    remove: "Remove",
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
    plan: dark ? "text-white/75" : "text-[#111111]/70",
    hint: dark ? "text-white/55" : "text-[#111111]/55",
    count: dark ? "text-white/80" : "text-[#111111]/80",
    atLimit: dark ? "text-white/50" : "text-[#111111]/55",
    vidTitle: dark ? "text-white" : "text-[#111111]",
    vidDesc: dark ? "text-white/60" : "text-[#111111]/60",
    vidHint: dark ? "text-white/50" : "text-[#111111]/50",
    vidStatus: dark ? "text-white/55" : "text-[#111111]/55",
    imgBorder: dark ? "border-white/15" : "border-black/20",
    noVideoBox: dark ? "border-white/15 bg-white/5 text-white/60" : "border-black/15 bg-[#F7F7F7] text-[#111111]/60",
    label: dark ? "block text-xs font-semibold uppercase tracking-wide text-white/55" : labelClass,
    input:
      dark
        ? "mt-2 w-full rounded-xl border border-white/15 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-white/35"
        : "mt-2 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-[#111111]",
    btnPrimary: dark
      ? "mt-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
      : "mt-3 rounded-xl border border-black/15 bg-[#F5F5F5] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#ECECEC]",
    btnDisabled: dark
      ? "mt-3 cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/35"
      : "mt-3 cursor-not-allowed rounded-xl border border-black/10 bg-[#EAEAEA] px-4 py-2.5 text-sm font-semibold text-[#111111]/40",
    btnVideo: dark
      ? "rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
      : "rounded-xl border border-black/15 bg-[#F5F5F5] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#ECECEC]",
    btnGhost: dark
      ? "rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
      : "rounded-xl border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]",
    divider: dark ? "border-white/10" : "border-black/10",
  };

  function onImageFiles(files: FileList | null) {
    if (!files?.length) return;
    setState((s) => {
      const next = [...s.images];
      for (let i = 0; i < files.length; i++) {
        if (next.length >= maxPhotos) break;
        next.push(URL.createObjectURL(files[i]));
      }
      return { ...s, images: next };
    });
  }

  function removeImage(index: number) {
    setState((s) => {
      const url = s.images[index];
      revokeIfBlob(url);
      return { ...s, images: s.images.filter((_, i) => i !== index) };
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

  const n = state.images.length;
  const canAddMore = n < maxPhotos;

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <p className={cx("text-xs font-medium", c.plan)}>{isProMedia ? t.planPro : t.planFree}</p>
      <p className={cx("text-xs", c.hint)}>{t.hint}</p>

      <div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={cx("text-xs font-semibold", c.count)}>{t.count(n, maxPhotos)}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.images.map((url, index) => (
            <div key={`${url}-${index}`} className="relative">
              <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                {index === 0 ? t.primary : `${index + 1}`}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={cx("h-24 w-24 rounded-xl border object-cover sm:h-28 sm:w-28", c.imgBorder)}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-1 -top-1 rounded-full bg-[#111111] px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
              >
                {t.remove}
              </button>
            </div>
          ))}
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
          className={canAddMore ? c.btnPrimary : c.btnDisabled}
        >
          {t.add}
        </button>
        {!canAddMore ? (
          <p className={cx("mt-2 text-xs", c.atLimit)}>{t.atLimit}</p>
        ) : null}
      </div>

      {allowVideo ? (
        <div className={cx("border-t pt-4", c.divider)}>
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
        <p className={cx("mt-4 rounded-xl border border-dashed px-3 py-2 text-xs", c.noVideoBox)}>
          {t.noVideoFree}
        </p>
      )}
    </SectionShell>
  );
}
