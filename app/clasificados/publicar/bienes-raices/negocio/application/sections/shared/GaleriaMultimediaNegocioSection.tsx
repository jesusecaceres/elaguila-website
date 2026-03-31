"use client";

import { useRef, useState } from "react";
import type {
  BienesRaicesMuxVideoSlotState,
  BienesRaicesNegocioFormState,
} from "../../schema/bienesRaicesNegocioFormState";
import {
  BrField,
  BrPreviewHint,
  brCardClass,
  brHintClass,
  brInputClass,
  brLabelClass,
  brSectionTitleClass,
  brSubTitleClass,
} from "./brFormPrimitives";

const MAX_PHOTOS = 50;
const MAX_PLANS = 3;

type MuxDirectUploadPayload = {
  ok?: boolean;
  error?: string;
  errorType?: string;
  uploadId?: string;
  uploadUrl?: string;
};

type MuxStatusPayload = {
  ok?: boolean;
  error?: string;
  muxStatus?: string;
};

function revokeIfBlob(url: string | undefined) {
  if (url?.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function uploadFileToUrl(file: File, uploadUrl: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.timeout = 900_000;
    const contentType = file.type?.trim() || "application/octet-stream";
    try {
      xhr.setRequestHeader("Content-Type", contentType);
    } catch {
      /* ignore */
    }
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      onProgress(Math.max(0, Math.min(100, Math.round((ev.loaded / ev.total) * 100))));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`PUT_${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("PUT_0"));
    xhr.ontimeout = () => reject(new Error("PUT_timeout"));
    xhr.send(file);
  });
}

function setVideoSlot(
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>,
  slotIndex: 0 | 1,
  patch: Partial<BienesRaicesMuxVideoSlotState>
) {
  setState((s) => {
    const next = [...s.media.listingVideoSlots] as [BienesRaicesMuxVideoSlotState, BienesRaicesMuxVideoSlotState];
    next[slotIndex] = { ...next[slotIndex], ...patch };
    return { ...s, media: { ...s.media, listingVideoSlots: next } };
  });
}

function muxInitMessage(): string {
  return "No pudimos iniciar la subida de video. Prueba un enlace público (YouTube, Vimeo, .mp4) o revisa la configuración de video.";
}

function muxPutMessage(code: number): string {
  if (!code || code === 0) return "Error de red al subir el archivo.";
  if (code >= 400 && code < 500) return muxInitMessage();
  return "No se pudo completar la subida. Comprueba tu conexión.";
}

function muxPollMessage(): string {
  return "No pudimos terminar de procesar el video. Prueba de nuevo o usa un enlace público.";
}

export function GaleriaMultimediaNegocioSection({
  state,
  setState,
  isConstructor,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
  isConstructor: boolean;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const floorInputRef = useRef<HTMLInputElement>(null);
  const siteInputRef = useRef<HTMLInputElement>(null);
  const videoInputs = useRef<[HTMLInputElement | null, HTMLInputElement | null]>([null, null]);
  const [photoUrlDraft, setPhotoUrlDraft] = useState("");
  const [siteUrlDraft, setSiteUrlDraft] = useState("");

  const photos = state.media.photoUrls;
  const n = photos.length;
  const primaryIdx = Math.min(Math.max(0, state.media.primaryImageIndex), Math.max(0, n - 1));

  function onImageFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => !f.type || f.type.startsWith("image/"));
    if (!list.length) return;
    void (async () => {
      const dataUrls: string[] = [];
      for (const file of list) {
        try {
          dataUrls.push(await fileToDataUrl(file));
        } catch {
          /* skip */
        }
      }
      if (!dataUrls.length) return;
      setState((s) => {
        const room = MAX_PHOTOS - s.media.photoUrls.length;
        if (room <= 0) return s;
        const wasEmpty = s.media.photoUrls.length === 0;
        const next = [...s.media.photoUrls, ...dataUrls.slice(0, room)];
        const pi =
          next.length === 0 ? 0 : wasEmpty ? 0 : Math.min(s.media.primaryImageIndex, next.length - 1);
        return { ...s, media: { ...s.media, photoUrls: next, primaryImageIndex: pi } };
      });
    })();
  }

  function removePhoto(index: number) {
    setState((s) => {
      const url = s.media.photoUrls[index];
      revokeIfBlob(url);
      const urls = s.media.photoUrls.filter((_, i) => i !== index);
      let nextPi = s.media.primaryImageIndex;
      if (urls.length === 0) nextPi = 0;
      else if (index === nextPi) nextPi = 0;
      else if (index < nextPi) nextPi = nextPi - 1;
      nextPi = Math.min(Math.max(0, nextPi), Math.max(0, urls.length - 1));
      return { ...s, media: { ...s.media, photoUrls: urls, primaryImageIndex: nextPi } };
    });
  }

  function setPrimary(index: number) {
    setState((s) => ({ ...s, media: { ...s.media, primaryImageIndex: index } }));
  }

  function movePhoto(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= photos.length) return;
    setState((s) => {
      const imgs = [...s.media.photoUrls];
      [imgs[index], imgs[j]] = [imgs[j]!, imgs[index]!];
      let pi = s.media.primaryImageIndex;
      if (pi === index) pi = j;
      else if (pi === j) pi = index;
      return { ...s, media: { ...s.media, photoUrls: imgs, primaryImageIndex: pi } };
    });
  }

  function addPhotoFromUrl() {
    const u = photoUrlDraft.trim();
    if (!u || photos.length >= MAX_PHOTOS) return;
    setState((s) => ({
      ...s,
      media: { ...s.media, photoUrls: [...s.media.photoUrls, u], primaryImageIndex: s.media.photoUrls.length === 0 ? 0 : s.media.primaryImageIndex },
    }));
    setPhotoUrlDraft("");
  }

  function onFloorFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => !f.type || f.type.startsWith("image/"));
    void (async () => {
      const dataUrls: string[] = [];
      for (const file of list) {
        try {
          dataUrls.push(await fileToDataUrl(file));
        } catch {
          /* skip */
        }
      }
      if (!dataUrls.length) return;
      setState((s) => {
        const cur = s.media.floorPlanUrls.filter((u) => u.trim());
        const next = [...cur, ...dataUrls].slice(0, MAX_PLANS);
        return { ...s, media: { ...s.media, floorPlanUrls: next } };
      });
    })();
  }

  function removeFloorAt(i: number) {
    setState((s) => ({
      ...s,
      media: { ...s.media, floorPlanUrls: s.media.floorPlanUrls.filter((_, j) => j !== i) },
    }));
  }

  function onSiteFile(files: FileList | null) {
    const f = files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    void (async () => {
      try {
        const dataUrl = await fileToDataUrl(f);
        setState((s) => ({ ...s, media: { ...s.media, sitePlanUrl: dataUrl } }));
      } catch {
        /* ignore */
      }
    })();
  }

  function startMuxUpload(slot: 0 | 1, file: File) {
    setVideoSlot(setState, slot, {
      fileName: file.name,
      status: "requesting_upload",
      errorMessage: "",
      progressPct: 0,
      uploadId: "",
      assetId: "",
      playbackId: "",
      playbackUrl: "",
      thumbnailUrl: "",
      durationSeconds: null,
      fallbackUrl: "",
    });

    void (async () => {
      try {
        const req = await fetch("/api/mux/direct-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot }),
          cache: "no-store",
        });
        const payload = (await req.json().catch(() => ({}))) as MuxDirectUploadPayload;
        if (!req.ok || !payload.ok || !payload.uploadId || !payload.uploadUrl) {
          setVideoSlot(setState, slot, { status: "error", errorMessage: muxInitMessage() });
          return;
        }
        setVideoSlot(setState, slot, { uploadId: payload.uploadId, status: "uploading" });
        try {
          await uploadFileToUrl(file, payload.uploadUrl, (pct) => {
            setVideoSlot(setState, slot, { progressPct: pct, status: "uploading" });
          });
        } catch (putErr: unknown) {
          const msg = putErr instanceof Error ? putErr.message : "";
          if (msg === "PUT_timeout") {
            setVideoSlot(setState, slot, { status: "error", errorMessage: "La subida tardó demasiado. Prueba un archivo más pequeño o usa un enlace." });
            return;
          }
          const statusMatch = /^PUT_(\d+)$/.exec(msg);
          const code = statusMatch ? Number(statusMatch[1]) : 0;
          setVideoSlot(setState, slot, { status: "error", errorMessage: muxPutMessage(code) });
          return;
        }
        setVideoSlot(setState, slot, { status: "preparing", progressPct: 100 });

        let becameReady = false;
        for (let tries = 0; tries < 40; tries += 1) {
          await new Promise((r) => setTimeout(r, tries === 0 ? 700 : 2200));
          const statusRes = await fetch(`/api/mux/upload-status?uploadId=${encodeURIComponent(payload.uploadId)}`, {
            cache: "no-store",
          });
          const statusPayload = (await statusRes.json().catch(() => ({}))) as MuxStatusPayload & {
            muxStatus?: string;
            assetId?: string;
            playbackId?: string;
            thumbnailUrl?: string;
            playbackUrl?: string;
            durationSeconds?: number | null;
          };
          if (!statusRes.ok || !statusPayload.ok) {
            setVideoSlot(setState, slot, {
              status: "error",
              errorMessage: statusPayload.error ? String(statusPayload.error) : muxPollMessage(),
            });
            return;
          }
          const muxStatus = (statusPayload.muxStatus ?? "").toLowerCase();
          if (muxStatus === "errored") {
            setVideoSlot(setState, slot, { status: "error", errorMessage: muxPollMessage() });
            return;
          }
          const ready = muxStatus === "ready";
          setVideoSlot(setState, slot, {
            assetId: statusPayload.assetId ?? "",
            playbackId: statusPayload.playbackId ?? "",
            playbackUrl: statusPayload.playbackUrl ?? "",
            thumbnailUrl: statusPayload.thumbnailUrl ?? "",
            durationSeconds:
              typeof statusPayload.durationSeconds === "number" ? statusPayload.durationSeconds : null,
            status: ready ? "ready" : "preparing",
            errorMessage: "",
          });
          if (ready) {
            becameReady = true;
            break;
          }
        }
        if (!becameReady) {
          setVideoSlot(setState, slot, { status: "error", errorMessage: "El video tardó demasiado en procesarse." });
        }
      } catch {
        setVideoSlot(setState, slot, { status: "error", errorMessage: muxPollMessage() });
      }
    })();
  }

  function clearVideoSlot(slot: 0 | 1) {
    setVideoSlot(setState, slot, {
      uploadId: "",
      assetId: "",
      playbackId: "",
      playbackUrl: "",
      thumbnailUrl: "",
      durationSeconds: null,
      status: "idle",
      progressPct: 0,
      fileName: "",
      errorMessage: "",
      fallbackUrl: "",
    });
  }

  function videoStatusLabel(sl: BienesRaicesMuxVideoSlotState): string {
    switch (sl.status) {
      case "requesting_upload":
        return "Solicitando carga segura…";
      case "uploading":
        return `Subiendo… ${sl.progressPct}%`;
      case "preparing":
        return "Procesando video…";
      case "ready":
        return "Video listo";
      case "error":
        return sl.errorMessage || "Error";
      default:
        return sl.fallbackUrl.trim() ? "Enlace de video" : "Sin video";
    }
  }

  const tour = state.media.virtualTourUrl.trim();
  const floorFilled = state.media.floorPlanUrls.map((u) => u.trim()).filter(Boolean);

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Galería multimedia</h2>
      <p className={brSubTitleClass}>
        Sube fotos y ordénalas con las flechas. Elige cuál es la portada (hero) con un clic — no tiene que ser la primera de la
        lista. Dos videos destacados (Mux o enlace) alimentan el preview; tour y planos activan sus bloques.
      </p>
      <BrPreviewHint>
        <span className="font-semibold text-[#4A3F2E]">Portada</span> es la foto grande del encabezado del anuncio. El orden en
        la cuadrícula solo agrupa miniaturas; puedes mover cualquier foto y seguir usando otra como portada.
      </BrPreviewHint>

      <div className="mt-5 space-y-8">
        <div>
          <div>
            <span className={brLabelClass}>Fotos</span>
            <p className={brHintClass}>
              {`Hasta ${MAX_PHOTOS}. Las flechas cambian el orden; “Portada” define el hero (independiente del primer casillero).`}
            </p>
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
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={n >= MAX_PHOTOS}
              className="rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#5C4E2E] disabled:opacity-40"
              onClick={() => n < MAX_PHOTOS && imageInputRef.current?.click()}
            >
              + Agregar fotos
            </button>
          </div>
          {n === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[#E8DFD0] bg-white/80 px-4 py-8 text-center text-sm text-[#5C5346]">
              Aún no hay fotos. Usa “Agregar fotos” o pega un enlace abajo.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((url, i) => (
                <li
                  key={`${i}-${url.slice(0, 48)}`}
                  className={`overflow-hidden rounded-xl border bg-white p-2 shadow-sm ${
                    i === primaryIdx ? "ring-2 ring-[#C9B46A] ring-offset-2 ring-offset-[#FFFCF7]" : "border-[#E8DFD0]"
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A7B62]">
                      Foto {i + 1}
                      {i === primaryIdx ? " · Hero / portada" : ""}
                    </span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-[11px] font-semibold text-[#2C2416] disabled:opacity-30"
                      disabled={i === 0}
                      onClick={() => movePhoto(i, -1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-[#E8DFD0] px-2 py-1 text-[11px] font-semibold text-[#2C2416] disabled:opacity-30"
                      disabled={i >= n - 1}
                      onClick={() => movePhoto(i, 1)}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                        i === primaryIdx
                          ? "bg-[#C9B46A]/25 text-[#6E5418]"
                          : "border border-[#C9B46A]/40 text-[#6E5418]"
                      }`}
                      onClick={() => setPrimary(i)}
                    >
                      {i === primaryIdx ? "Portada activa" : "Usar como portada"}
                    </button>
                    <button
                      type="button"
                      className="ml-auto rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-800"
                      onClick={() => removePhoto(i)}
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className={brInputClass + " max-w-xl flex-1 min-w-[200px]"}
              value={photoUrlDraft}
              onChange={(e) => setPhotoUrlDraft(e.target.value)}
              placeholder="O pega URL de imagen (https://…)"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhotoFromUrl())}
            />
            <button
              type="button"
              className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#2C2416] disabled:opacity-40"
              disabled={!photoUrlDraft.trim() || n >= MAX_PHOTOS}
              onClick={addPhotoFromUrl}
            >
              Añadir URL
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {([0, 1] as const).map((slot) => {
            const sl = state.media.listingVideoSlots[slot];
            return (
              <div key={slot} className="rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
                <p className="text-sm font-bold text-[#1E1810]">Video destacado {slot + 1}</p>
                <p className="mt-1 text-xs text-[#5C5346]">{videoStatusLabel(sl)}</p>
                <input
                  ref={(el) => {
                    videoInputs.current[slot] = el;
                  }}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) startMuxUpload(slot, f);
                  }}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-[#C9B46A]/50 bg-white px-3 py-2 text-sm font-semibold text-[#6E5418]"
                    onClick={() => videoInputs.current[slot]?.click()}
                  >
                    Subir archivo
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#2C2416]"
                    onClick={() => clearVideoSlot(slot)}
                  >
                    Limpiar
                  </button>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-semibold text-[#5C5346]">O enlace (YouTube, Vimeo, .mp4, .m3u8)</label>
                  <input
                    className={brInputClass + " mt-1"}
                    value={sl.fallbackUrl}
                    onChange={(e) =>
                      setVideoSlot(setState, slot, { fallbackUrl: e.target.value, status: "idle", errorMessage: "" })
                    }
                    placeholder="https://…"
                  />
                </div>
                {sl.status === "ready" && sl.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sl.thumbnailUrl} alt="" className="mt-3 max-h-32 rounded-lg border object-cover" />
                ) : null}
              </div>
            );
          })}
        </div>

        <BrField
          label="Tour virtual (enlace)"
          hint="Matterport, Insta360 u otro recorrido. Debe ser una URL https completa."
        >
          <div className="flex flex-wrap gap-2">
            <input
              className={brInputClass + " min-w-[240px] flex-1"}
              value={state.media.virtualTourUrl}
              onChange={(e) => setState((s) => ({ ...s, media: { ...s.media, virtualTourUrl: e.target.value } }))}
              placeholder="https://..."
            />
            <button
              type="button"
              className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#2C2416] disabled:opacity-40"
              disabled={!tour}
              onClick={() => tour && window.open(tour.startsWith("http") ? tour : `https://${tour}`, "_blank", "noopener,noreferrer")}
            >
              Probar enlace
            </button>
          </div>
        </BrField>

        <div>
          <p className="text-sm font-bold text-[#1E1810]">Planos de planta (hasta {MAX_PLANS})</p>
          <input
            ref={floorInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              onFloorFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="mt-2 rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#5C4E2E] disabled:opacity-40"
            disabled={floorFilled.length >= MAX_PLANS}
            onClick={() => floorFilled.length < MAX_PLANS && floorInputRef.current?.click()}
          >
            + Subir planos
          </button>
          {floorFilled.length > 0 ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {state.media.floorPlanUrls.map((u, i) => (
                <li key={i} className="rounded-xl border border-[#E8DFD0] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="aspect-[3/4] w-full rounded-lg object-contain bg-white" />
                  <button
                    type="button"
                    className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 py-1 text-[11px] font-semibold text-red-800"
                    onClick={() => removeFloorAt(i)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-[#5C5346]/85">Sin planos aún. Solo se listan en el preview cuando hay al menos uno.</p>
          )}
        </div>

        {isConstructor ? (
          <div className="rounded-xl border border-[#E8DFD0] bg-white/90 p-4">
            <p className="text-sm font-bold text-[#1E1810]">Plano de sitio / comunidad</p>
            <p className="mt-1 text-xs text-[#5C5346]">Opcional; visible en vista previa para desarrolladores.</p>
            <input
              ref={siteInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                onSiteFile(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="mt-3 rounded-xl border border-[#C9B46A]/50 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#5C4E2E]"
              onClick={() => siteInputRef.current?.click()}
            >
              Subir imagen
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                className={brInputClass + " max-w-xl flex-1 min-w-[200px]"}
                value={siteUrlDraft}
                onChange={(e) => setSiteUrlDraft(e.target.value)}
                placeholder="O URL del plano de sitio"
              />
              <button
                type="button"
                className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm font-semibold text-[#2C2416]"
                onClick={() => {
                  const u = siteUrlDraft.trim();
                  if (!u) return;
                  setState((s) => ({ ...s, media: { ...s.media, sitePlanUrl: u } }));
                  setSiteUrlDraft("");
                }}
              >
                Usar URL
              </button>
            </div>
            {state.media.sitePlanUrl.trim() ? (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.media.sitePlanUrl}
                  alt=""
                  className="max-h-40 rounded-lg border object-contain"
                />
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-red-800"
                  onClick={() => setState((s) => ({ ...s, media: { ...s.media, sitePlanUrl: "" } }))}
                >
                  Quitar plano de sitio
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
