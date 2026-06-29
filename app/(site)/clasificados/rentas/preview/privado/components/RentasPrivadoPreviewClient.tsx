"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  publishLeonixListingFromRentasPrivadoDraft,
  type RentasListingPublishMuxFields,
} from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { BienesRaicesPrivadoPreviewView } from "@/app/clasificados/bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView";
import { buildRentasPrivadoTemplateVm } from "../model/buildRentasPrivadoTemplateVm";
import { RentasPreviewResultCardSection } from "@/app/clasificados/rentas/preview/shared/RentasPreviewResultCardSection";
import { buildRentasResultCardPreviewListingFromPrivadoVm, rentasPreviewResultCardFlowOverlay } from "@/app/clasificados/rentas/preview/shared/rentasPreviewResultCardListing";
import { mapRentasPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm";
import {
  clearRentasPrivadoDraft,
  loadRentasPrivadoDraft,
} from "@/app/clasificados/publicar/rentas/privado/application/utils/rentasPrivadoDraft";
import { resolveRentasPrivadoDraftMediaToRemoteUrls } from "@/app/clasificados/rentas/shared/rentasDraftPublishPrepare";
import { hydrateRentasPrivadoDraftVideoFromIdb } from "@/app/clasificados/rentas/shared/rentasDraftVideoHydrate";
import { rentasDraftVideoFileForMuxUpload, rentasMediaHasLocalMuxableVideo } from "@/app/clasificados/rentas/shared/rentasDraftVideoMuxSource";
import {
  rentasPublishStepTracePatch,
  rentasPublishStepTraceReset,
} from "@/app/clasificados/rentas/lib/rentasPublishStepTrace";
import { uploadRentasDraftVideoFileToMux } from "@/app/clasificados/rentas/shared/rentasMuxVideoClient";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import {
  rentasListingPublicPath,
  RENTAS_PREVIEW_PRIVADO,
  RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Phase = "loading" | "ready" | "recovery";

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

export default function RentasPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<RentasPrivadoFormState | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);

  const lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const onPublishLive = useCallback(async () => {
    rentasPublishStepTraceReset();
    rentasPublishStepTracePatch({
      publishClicked: true,
      existingErrorBeforePublish: publishErr != null && publishErr !== "",
    });
    setPublishErr(null);
    rentasPublishStepTracePatch({ errorClearedAtStart: true });
    setPublishBusy(true);

    const d = loadRentasPrivadoDraft();
    if (!d) {
      setPublishBusy(false);
      return;
    }

    let toPublish = d;
    const draftSessionId =
      typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `rentas-${Date.now()}`;
    rentasPublishStepTracePatch({ draftId: draftSessionId, draftSource: "localStorage" });

    const imagesCountBeforeUpload = d.media.photoDataUrls.filter((u) => typeof u === "string" && u.trim()).length;
    rentasPublishStepTracePatch({ imagesCountBeforeUpload, imagesUploadStarted: true });

    try {
      toPublish = await resolveRentasPrivadoDraftMediaToRemoteUrls(d, draftSessionId);
    } catch (e) {
      setPublishBusy(false);
      rentasPublishStepTracePatch({ imagesUploadFinished: false, finalErrorSet: true });
      setPublishErr(
        e instanceof Error
          ? e.message
          : lang === "es"
            ? "No se pudieron subir las fotos. Comprueba BLOB_READ_WRITE_TOKEN en el servidor y tu conexión."
            : "Photos could not be uploaded. Check BLOB_READ_WRITE_TOKEN on the server and your connection.",
      );
      return;
    }

    const imagesDurableCount = toPublish.media.photoDataUrls.filter(
      (u) => typeof u === "string" && /^https:\/\//i.test(u.trim()),
    ).length;
    rentasPublishStepTracePatch({ imagesUploadFinished: true, imagesDurableCount });

    let muxFields: RentasListingPublishMuxFields | undefined;
    if (rentasMediaHasLocalMuxableVideo(toPublish.media)) {
      rentasPublishStepTracePatch({ videoSelected: true });
      const file = await rentasDraftVideoFileForMuxUpload(toPublish.media);
      if (!file) {
        rentasPublishStepTracePatch({
          muxDirectUploadStarted: false,
          muxDirectUploadSucceeded: false,
          muxUploadStatusSucceeded: false,
        });
      } else {
        rentasPublishStepTracePatch({ muxDirectUploadStarted: true });
        const muxRes = await uploadRentasDraftVideoFileToMux(file, lang);
        if (!muxRes.ok) {
          rentasPublishStepTracePatch({
            muxDirectUploadSucceeded: false,
            muxUploadStatusSucceeded: false,
          });
        } else {
          rentasPublishStepTracePatch({
            muxDirectUploadSucceeded: true,
            muxUploadStatusSucceeded: true,
            muxAssetId: muxRes.assetId,
            muxPlaybackId: muxRes.playbackId,
          });
          muxFields = {
            muxAssetId: muxRes.assetId,
            muxPlaybackId: muxRes.playbackId,
            muxThumbnailUrl: muxRes.thumbnailUrl,
          };
        }
      }
    }

    rentasPublishStepTracePatch({ finalPayloadBuildStarted: true });
    const r = await publishLeonixListingFromRentasPrivadoDraft(toPublish, lang, muxFields);
    rentasPublishStepTracePatch({
      finalPayloadBuildFinished: true,
      redirectStarted: r.ok,
      finalErrorSet: !r.ok,
    });
    setPublishBusy(false);
    if (r.ok) {
      clearRentasPrivadoDraft();
      router.push(withRentasLandingLang(`${rentasListingPublicPath(r.listingId)}?published=1`, lang));
    } else {
      setPublishErr(r.error);
    }
  }, [lang, router, publishErr]);

  useEffect(() => {
    let cancelled = false;
    let revokeUrl: string | null = null;
    void (async () => {
      const raw = loadRentasPrivadoDraft();
      if (!raw) {
        if (!cancelled) {
          setDraft(null);
          setPhase("recovery");
        }
        return;
      }
      const { state, revokeObjectUrl } = await hydrateRentasPrivadoDraftVideoFromIdb(raw);
      if (cancelled) {
        if (revokeObjectUrl) URL.revokeObjectURL(revokeObjectUrl);
        return;
      }
      revokeUrl = revokeObjectUrl;
      setDraft(state);
      setPhase("ready");
    })();
    return () => {
      cancelled = true;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, []);

  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    if (draft.categoriaPropiedad !== urlCategoria) {
      router.replace(`${RENTAS_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}&lang=${lang}`);
    }
  }, [phase, draft, urlCategoria, router]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F9F6F1] px-4 text-sm text-[#5C5346]">
        {lang === "en" ? "Loading preview…" : "Cargando vista previa…"}
      </div>
    );
  }

  if (phase === "recovery" || !draft) {
    const templateVm = buildRentasPrivadoTemplateVm(urlCategoria);
    const editHrefRecovery = `${RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(urlCategoria)}`;
    return (
      <LeonixPreviewPageShell editHref={editHrefRecovery}>
        <p className="mx-auto max-w-[1240px] px-4 py-3 text-center text-xs text-[#5C5346] sm:px-6 lg:px-8">
          {lang === "en" ? (
            <>
              <span className="font-semibold text-[#2C2416]">No draft in this session</span>
              <span className="mx-2 opacity-40">·</span>
              Category template.{" "}
              <Link href={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY} className="font-semibold underline" prefetch={false}>
                Go to publish — Private
              </Link>
            </>
          ) : (
            <>
              <span className="font-semibold text-[#2C2416]">Sin borrador en esta sesión</span>
              <span className="mx-2 opacity-40">·</span>
              Plantilla por categoría.{" "}
              <Link href={RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY} className="font-semibold underline" prefetch={false}>
                Ir a publicar — Privado
              </Link>
            </>
          )}
        </p>
        <RentasPreviewResultCardSection
          listing={buildRentasResultCardPreviewListingFromPrivadoVm(templateVm)}
          lang={lang}
        />
        <section className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">
            {lang === "en" ? "Full listing preview" : "Vista previa completa"}
          </h2>
        </section>
        <BienesRaicesPrivadoPreviewView vm={templateVm} lang={lang} />
      </LeonixPreviewPageShell>
    );
  }

  const vm = mapRentasPrivadoStateToPreviewVm(draft, lang);

  const editHref = `${RENTAS_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`;

  return (
    <LeonixPreviewPageShell
      editHref={editHref}
      publishSlot={
        <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
          <button type="button" className={PUBLISH_BTN} disabled={publishBusy} onClick={() => void onPublishLive()}>
            {publishBusy
              ? lang === "es"
                ? "Publicando…"
                : "Publishing…"
              : lang === "es"
                ? "Publicar anuncio"
                : "Publish listing"}
          </button>
          {publishErr ? (
            <p className="max-w-[280px] text-right text-[11px] text-red-700" role="alert">
              {publishErr}
            </p>
          ) : null}
        </div>
      }
    >
      <RentasPreviewResultCardSection
        listing={rentasPreviewResultCardFlowOverlay(draft, buildRentasResultCardPreviewListingFromPrivadoVm(vm))}
        lang={lang}
      />
      <section className="mx-auto w-full max-w-[1240px] px-4 pt-6 sm:px-6 lg:px-8">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">
          {lang === "en" ? "Full listing preview" : "Vista previa completa"}
        </h2>
      </section>
      <BienesRaicesPrivadoPreviewView vm={vm} lang={lang} />
    </LeonixPreviewPageShell>
  );
}
