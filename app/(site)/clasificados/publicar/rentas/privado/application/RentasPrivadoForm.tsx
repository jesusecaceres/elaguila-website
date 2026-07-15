"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClasificadosApplicationTopActions } from "@/app/clasificados/lib/publishUi/ClasificadosApplicationTopActions";
import { LeonixLaunchCouponCard } from "@/app/components/leonix/LeonixLaunchCouponCard";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { gateRentasPrivadoPreview } from "@/app/clasificados/lib/publish/leonixRequiredForPreviewGates";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  RENTAS_PREVIEW_PRIVADO,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { Gate12cContactChannelsFields } from "@/app/clasificados/publicar/shared/Gate12cContactChannelsFields";
import { RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL } from "@/app/clasificados/rentas/shared/rentasResidencialHighlightFormVisuals";
import {
  AiField,
  aiCardClass,
  aiHintClass,
  aiInputClass,
  aiLabelClass,
  aiSubClass,
  aiTextareaClass,
  aiTitleClass,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";

const fieldClass = `${aiInputClass} min-w-0 max-w-full`;
const textareaFieldClass = `${aiTextareaClass} min-w-0 max-w-full`;
import {
  formatUsPhoneDisplay,
  onPhoneInputChange,
  digitsOnly,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/phoneMask";
import {
  compressImageFileToJpegDataUrl,
} from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/brPrivadoMediaCompress";
import { LeonixRealEstateSortablePhotoStrip } from "@/app/clasificados/lib/LeonixRealEstateSortablePhotoStrip";
import { RentasAnuncioFormSection } from "@/app/clasificados/publicar/rentas/shared/RentasAnuncioFormSection";
import { RentasShowingTourSection } from "@/app/clasificados/publicar/rentas/shared/RentasShowingTourSection";
import {
  rentasFlowGroupActive,
  rentasResidencialFormRowsMode,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import {
  COMERCIAL_DESTACADOS_DEFS,
  COMERCIAL_SUBTIPO_POR_TIPO,
  COMERCIAL_TIPO_OPCIONES,
  TERRENO_DESTACADOS_DEFS,
  TERRENO_SUBTIPO_POR_TIPO,
  TERRENO_TIPO_OPCIONES,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteComercialTerrenoMeta";
import { SUBTIPO_POR_TIPO, TIPO_PROPIEDAD_OPCIONES } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteResidencialTipoMeta";
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
  type RentasPrivadoFormState,
} from "../schema/rentasPrivadoFormState";
import {
  clearRentasPrivadoDraft,
  loadRentasPrivadoDraft,
  saveRentasPrivadoDraft,
} from "./utils/rentasPrivadoDraft";
import { formatRentasSqftPreview } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  withClasificadosPublishLang,
} from "@/app/lib/clasificados/clasificadosPublishLang";
import type { OfficialLocale } from "@/app/lib/language";
import { getLaunchUiMessages } from "@/app/lib/i18n/launchUiDictionaries";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { hydrateRentasDashboardEditDraft } from "../../shared/rentasDashboardEditHydration";
import { parseRentasListingEditContext, rentasListingEditPreviewParams, type RentasListingEditContext } from "../../shared/rentasListingEditContext";
import {
  clearRentasListingEditWorkspace,
  loadRentasListingEditWorkspace,
  saveRentasListingEditWorkspace,
} from "../../shared/rentasListingEditWorkspace";

const MAX_PHOTOS = 8;
const MAX_VIDEO_URLS = 4;

const CANCEL_EDIT_CONFIRM: Record<OfficialLocale, string> = {
  es: "¿Cancelar la edición?\n\nLos cambios no guardados se descartarán. Tu anuncio publicado permanecerá sin cambios.",
  en: "Cancel editing?\n\nUnsaved changes will be discarded. Your published listing will remain unchanged.",
  pt: "Cancelar a edição?\n\nAs alterações não salvas serão descartadas. Seu anúncio publicado permanecerá inalterado.",
  tl: "I-cancel ang pag-edit?\n\nMawawala ang hindi naka-save na mga pagbabago. Mananatiling hindi magbabago ang published listing mo.",
};

const PREVIEW_MUST_FINISH_LOADING: Record<OfficialLocale, string> = {
  es: "El anuncio publicado debe terminar de cargar antes de la vista previa.",
  en: "The published listing must finish loading before preview.",
  pt: "O anúncio publicado deve terminar de carregar antes da prévia.",
  tl: "Kailangang matapos mag-load ang published listing bago ang preview.",
};

const RESIDENTIAL_FLOW_HIGHLIGHTS_ONLY: Record<OfficialLocale, string> = {
  es: "Para este tipo de renta, los detalles de habitación o espacio compartido van arriba en “Anuncio”; aquí solo puedes marcar destacados si aplica.",
  en: "For this rental type, room or shared-space details are above under “Listing”; here you can only mark highlights if they apply.",
  pt: "Para este tipo de aluguel, os detalhes de quarto ou espaço compartilhado ficam acima em “Anúncio”; aqui você só pode marcar destaques se aplicável.",
  tl: "Para sa uri ng rentang ito, ang mga detalye ng kuwarto o shared space ay nasa itaas sa “Anuncio”; dito maaari mo lang i-mark ang highlights kung applicable.",
};

function RentasSqftPreview({ value, lang }: { value: string; lang: OfficialLocale }) {
  const shown = formatRentasSqftPreview(value);
  if (!shown) return null;
  const label = getLaunchUiMessages(lang).rentas.page.sqftPreviewPrefix;
  return <p className="mt-1.5 text-xs font-medium text-[#5C5346]">{label} {shown}</p>;
}

const CATEGORIAS: { id: BrNegocioCategoriaPropiedad; labelKey: "residential" | "commercial" | "landLot" }[] = [
  { id: "residencial", labelKey: "residential" },
  { id: "comercial", labelKey: "commercial" },
  { id: "terreno_lote", labelKey: "landLot" },
];

const POSTER_TYPE_OPTIONS: {
  id: Exclude<RentasPrivadoFormState["posterType"], "">;
  labelKey: "ownerPrivate" | "agent" | "propertyManager" | "business";
}[] = [
  { id: "owner_private", labelKey: "ownerPrivate" },
  { id: "agent", labelKey: "agent" },
  { id: "property_manager", labelKey: "propertyManager" },
  { id: "business", labelKey: "business" },
];

const ESTADOS: { id: RentasPrivadoFormState["estadoAnuncio"]; labelKey: "disponible" | "pendiente" | "bajo_contrato" | "rentado" }[] = [
  { id: "disponible", labelKey: "disponible" },
  { id: "pendiente", labelKey: "pendiente" },
  { id: "bajo_contrato", labelKey: "bajo_contrato" },
  { id: "rentado", labelKey: "rentado" },
];

const CONDICION_OPTS: {
  value: RentasPrivadoFormState["residencial"]["condicion"];
  labelKey: "emptyDash" | "excelente" | "buena" | "regular" | "necesita_reparacion";
}[] = [
  { value: "", labelKey: "emptyDash" },
  { value: "excelente", labelKey: "excelente" },
  { value: "buena", labelKey: "buena" },
  { value: "regular", labelKey: "regular" },
  { value: "necesita_reparacion", labelKey: "necesita_reparacion" },
];

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), template);
}

export function RentasPrivadoForm({ initialLocale }: { initialLocale: OfficialLocale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeLang = initialLocale;
  const lang = initialLocale;
  const rm = getLaunchUiMessages(lang).rentas;
  const routeEditContext = useMemo(
    () => parseRentasListingEditContext(new URLSearchParams(searchParams?.toString() ?? ""), "privado"),
    [searchParams],
  );
  const [state, setState] = useState<RentasPrivadoFormState>(createEmptyRentasPrivadoFormState);
  const [hydrated, setHydrated] = useState(false);
  const [editContext, setEditContext] = useState<RentasListingEditContext | null>(routeEditContext);
  const [hydrationStatus, setHydrationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [dirty, setDirty] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [previewGateMessage, setPreviewGateMessage] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const cleanEditSnapshotRef = useRef<string>("");
  const photosInputRef = useRef<HTMLInputElement>(null);
  const ownerPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const ctx = routeEditContext;
    if (ctx) {
      setEditContext({ ...ctx, hydrationStatus: "loading" });
      setHydrationStatus("loading");
      const cached = loadRentasListingEditWorkspace<RentasPrivadoFormState>({
        listingId: ctx.listingId,
        lane: "privado",
        merge: mergePartialRentasPrivadoState,
      });
      if (cached) {
        setState(cached);
        cleanEditSnapshotRef.current = JSON.stringify(cached);
        setHydrationStatus("ready");
        setEditContext({ ...ctx, originalSnapshotLoaded: true, hydrationStatus: "ready" });
        setHydrated(true);
        return;
      }
      void hydrateRentasDashboardEditDraft({ listingId: ctx.listingId, lane: "privado" }).then((result) => {
        if (result.ok && result.lane === "privado") {
          setState(result.draft);
          cleanEditSnapshotRef.current = JSON.stringify(result.draft);
          saveRentasListingEditWorkspace({ listingId: ctx.listingId, lane: "privado", draft: result.draft });
          setHydrationStatus("ready");
          setEditContext({ ...ctx, leonixAdId: result.leonixAdId ?? ctx.leonixAdId, originalSnapshotLoaded: true, hydrationStatus: "ready" });
        } else if (!result.ok) {
          setPreviewGateMessage(result.message);
          setHydrationStatus("error");
          setEditContext({ ...ctx, hydrationStatus: "error" });
        }
        setHydrated(true);
      });
      return;
    }
    const d = loadRentasPrivadoDraft();
    if (d) {
      setState(d);
      setHydrated(true);
      return;
    }
    try {
      const p = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
      if (p) setState((s) => ({ ...s, categoriaPropiedad: p }));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [routeEditContext]);

  useEffect(() => {
    if (!hydrated) return;
    if (editContext && hydrationStatus !== "ready") return;
    const id = window.setTimeout(() => {
      if (editContext) {
        saveRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "privado", draft: stateRef.current });
      } else {
        saveRentasPrivadoDraft(stateRef.current);
      }
    }, 280);
    return () => window.clearTimeout(id);
  }, [state, hydrated, editContext, hydrationStatus]);

  useEffect(() => {
    if (!editContext || hydrationStatus !== "ready") return;
    if (!cleanEditSnapshotRef.current) return;
    setDirty(JSON.stringify(state) !== cleanEditSnapshotRef.current);
  }, [state, editContext, hydrationStatus]);

  useEffect(() => {
    if (!hydrated) return;
    function flush() {
      if (editContext) {
        if (hydrationStatus === "ready") saveRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "privado", draft: stateRef.current });
      } else {
        saveRentasPrivadoDraft(stateRef.current);
      }
    }
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hydrated, editContext, hydrationStatus]);

  useEffect(() => {
    if (!editContext) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editContext, dirty]);

  const flushSave = useCallback(() => {
    if (editContext) saveRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "privado", draft: stateRef.current });
    else saveRentasPrivadoDraft(stateRef.current);
  }, [editContext]);

  const previewHref = useMemo(
    () =>
      withClasificadosPublishLang(RENTAS_PREVIEW_PRIVADO, routeLang, {
        [BR_NEGOCIO_Q_PROPIEDAD]: state.categoriaPropiedad,
        ...(editContext ? rentasListingEditPreviewParams(editContext) : {}),
      }),
    [routeLang, state.categoriaPropiedad, editContext],
  );

  const onPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - state.media.photoDataUrls.length;
    if (room <= 0) return;
    const next: string[] = [...state.media.photoDataUrls];
    for (let i = 0; i < files.length && next.length < MAX_PHOTOS; i++) {
      const f = files[i];
      if (!f || !/^image\//.test(f.type)) continue;
      try {
        next.push(await compressImageFileToJpegDataUrl(f));
      } catch {
        /* ignore */
      }
    }
    setState((s) => {
      const primaryImageIndex = Math.min(s.media.primaryImageIndex, Math.max(0, next.length - 1));
      const out: RentasPrivadoFormState = {
        ...s,
        media: { ...s.media, photoDataUrls: next, primaryImageIndex },
      };
      queueMicrotask(() => saveRentasPrivadoDraft(out));
      return out;
    });
    if (photosInputRef.current) photosInputRef.current.value = "";
  };

  const normalizeVideoUrls = (urls: readonly string[]): string[] => {
    const out: string[] = [];
    for (const raw of urls) {
      const v = String(raw ?? "").trim();
      if (!v || out.includes(v)) continue;
      out.push(v);
      if (out.length >= MAX_VIDEO_URLS) break;
    }
    return out;
  };

  const onVideoUrlChange = (index: number, raw: string) => {
    setMediaNotice(null);
    setState((s) => {
      const current = normalizeVideoUrls(s.media.videoUrls?.length ? s.media.videoUrls : [s.media.videoUrl]);
      const nextInput = Array.from({ length: MAX_VIDEO_URLS }, (_, i) => current[i] ?? "");
      nextInput[index] = raw;
      const nextUrls = normalizeVideoUrls(nextInput);
      const out: RentasPrivadoFormState = {
        ...s,
        media: {
          ...s.media,
          videoUrl: nextUrls[0] ?? "",
          videoUrls: nextUrls,
          videoLocalDataUrl: "",
          videoLocalDraftId: "",
          videoLocalFileName: "",
          videoLocalMimeType: "",
          videoLocalSizeBytes: 0,
          videoLocalUpdatedAt: 0,
        },
      };
      queueMicrotask(() => saveRentasPrivadoDraft(out));
      return out;
    });
  };

  const cat = state.categoriaPropiedad;
  const rentasFlow = rentasFlowGroupActive(state);
  const residencialRowsMode = rentasResidencialFormRowsMode(rentasFlow);
  const confirmAll =
    state.confirmListingAccurate && state.confirmPhotosRepresentItem && state.confirmCommunityRules;

  const cancelEdit = useCallback(() => {
    if (!editContext) return;
    if (dirty) {
      const ok = window.confirm(CANCEL_EDIT_CONFIRM[lang]);
      if (!ok) return;
    }
    clearRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "privado" });
    router.push(editContext.returnHref);
  }, [dirty, editContext, lang, router]);

  const saveListingEdit = useCallback(async () => {
    if (!editContext || hydrationStatus !== "ready") return;
    const gate = gateRentasPrivadoPreview(stateRef.current);
    if (!gate.ok) {
      setSaveMessage(gate.message);
      return;
    }
    setSaveBusy(true);
    setSaveMessage(null);
    const sb = createSupabaseBrowserClient();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setSaveMessage(rm.actions.signInRequired);
      setSaveBusy(false);
      return;
    }
    const res = await fetch("/api/clasificados/rentas/listing-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        listingId: editContext.listingId,
        leonixAdId: editContext.leonixAdId,
        lane: "privado",
        lang,
        draft: stateRef.current,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    setSaveBusy(false);
    if (!res.ok || !json.ok) {
      setSaveMessage(json.message ?? rm.actions.couldNotSave);
      return;
    }
    cleanEditSnapshotRef.current = JSON.stringify(stateRef.current);
    setDirty(false);
    saveRentasListingEditWorkspace({ listingId: editContext.listingId, lane: "privado", draft: stateRef.current });
    setSaveMessage(rm.actions.changesSaved);
    router.push(editContext.returnHref);
  }, [editContext, hydrationStatus, lang, router, rm.actions]);

  const previewActionsProps = {
    onPreviewValidated: () => {
      if (editContext && hydrationStatus !== "ready") return;
      if (!confirmAll) return;
      const g = gateRentasPrivadoPreview(stateRef.current);
      if (!g.ok) {
        setPreviewGateMessage(g.message);
        return;
      }
      setPreviewGateMessage(null);
      flushSave();
      router.push(previewHref);
    },
    openPreviewHref: previewHref,
    onBeforeOpenUnvalidatedPreview: flushSave,
    disableValidatedPreview: !confirmAll || (Boolean(editContext) && hydrationStatus !== "ready"),
    validationBlockedMessage:
      previewGateMessage ??
      (editContext && hydrationStatus !== "ready"
        ? PREVIEW_MUST_FINISH_LOADING[lang]
        : !confirmAll
          ? rm.actions.confirmPreviewBlocked
          : null),
    labels: {
      preview: rm.actions.validatePreview,
      openPreview: rm.actions.viewWithoutValidation,
      openPreviewTitle: rm.actions.openPreviewTitle,
      deleteApplication: rm.actions.deleteDraft,
    },
    onDeleteApplication: async () => {
      if (editContext) {
        cancelEdit();
        return;
      }
      clearRentasPrivadoDraft();
      const empty = createEmptyRentasPrivadoFormState();
      try {
        const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        const p = parseBrNegocioPropiedadParam(sp.get(BR_NEGOCIO_Q_PROPIEDAD));
        setState(p ? { ...empty, categoriaPropiedad: p } : empty);
      } catch {
        setState(empty);
      }
      setPreviewGateMessage(null);
    },
    deleteConfirmMessage: rm.actions.deleteConfirmMessage,
  };

  if (editContext && hydrationStatus !== "ready") {
    return (
      <main className="min-h-screen bg-[#F6F0E2] px-4 py-24 text-[#2C2416]">
        <section className="mx-auto max-w-2xl rounded-3xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9A7B32]">
            {rm.page.listingEdit}
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {hydrationStatus === "error" ? rm.page.loadError : rm.page.loadLoading}
          </h1>
          <p className="mt-3 text-sm text-[#5C5346]">{rm.page.loadBlockedHint}</p>
          {previewGateMessage ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">{previewGateMessage}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className="min-h-[44px] rounded-xl bg-[#2A2620] px-4 py-2 text-sm font-bold text-white">
              {rm.actions.tryAgain}
            </button>
            <button type="button" onClick={cancelEdit} className="min-h-[44px] rounded-xl border border-[#C9B46A]/50 bg-white px-4 py-2 text-sm font-bold text-[#2C2416]">
              {rm.actions.cancelEdit}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-hidden bg-[#F6F0E2] px-4 pb-[max(7rem,env(safe-area-inset-bottom,0px))] pt-24 text-[#2C2416] sm:px-5 sm:pb-24 sm:pt-28">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-7 md:space-y-8">
        <header className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{rm.page.brandKicker}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1E1810] sm:text-[1.65rem]">
            {editContext ? rm.page.editTitle : rm.page.postTitle}
          </h1>
          <p className={aiSubClass}>{editContext ? rm.page.introEdit : rm.page.introNew}</p>
        </header>

        {editContext ? (
          <section className="rounded-2xl border border-[#C9B46A]/45 bg-[#FFF8E8] p-4 text-sm text-[#3D3428]">
            <p className="font-bold">{rm.page.publishedProtected}</p>
            <p className="mt-1 text-xs text-[#5C5346]">{rm.page.publishedProtectedHint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={cancelEdit} className="min-h-[44px] rounded-xl border border-[#C9B46A]/60 bg-white px-4 py-2 text-sm font-bold text-[#2C2416]">
                {rm.actions.cancelEdit}
              </button>
              <button type="button" disabled={saveBusy || hydrationStatus !== "ready"} onClick={() => void saveListingEdit()} className="min-h-[44px] rounded-xl bg-[#2A2620] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {saveBusy ? rm.actions.saving : rm.actions.saveChanges}
              </button>
            </div>
            {saveMessage ? <p className="mt-2 text-xs font-semibold text-[#6E5418]" role="status">{saveMessage}</p> : null}
          </section>
        ) : null}

        <ClasificadosApplicationTopActions {...previewActionsProps} />
        <p className="text-xs leading-relaxed text-[#5C5346]/88">{rm.page.previewExplanation}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={withClasificadosPublishLang("/clasificados/rentas", routeLang)}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-[#C9B46A]/50 px-6 text-sm font-semibold text-[#6E5418] transition hover:bg-[#FFEFD8] sm:w-auto"
          >
            {rm.actions.backToRentals}
          </Link>
        </div>

        <LeonixLaunchCouponCard
          lang={lang}
          variant="mini"
          href={`/newsletter?lang=${lang}&source=rentas_privado&sourceCta=launch_25`}
        />

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{rm.publisher.whoPosting}</h2>
          <p className={aiSubClass}>{rm.publisher.whoHint}</p>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {POSTER_TYPE_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, posterType: o.id }))}
                className={`min-h-[48px] w-full rounded-xl border px-3 py-3 text-center text-sm font-semibold leading-snug transition sm:min-h-[44px] sm:py-2.5 ${
                  state.posterType === o.id
                    ? "border-[#B8954A] bg-[#FFF6E7] text-[#1E1810] ring-1 ring-[#B8954A]/30"
                    : "border-[#E8DFD0] bg-white text-[#5C5346] hover:border-[#C9B46A]/60"
                }`}
              >
                {rm.publisher[o.labelKey]}
              </button>
            ))}
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{rm.category.title}</h2>
          <p className={aiSubClass}>{rm.category.hint}</p>
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, categoriaPropiedad: c.id }))}
                className={`min-h-[48px] w-full rounded-xl border px-3 py-3 text-center text-sm font-semibold leading-snug transition sm:min-h-[44px] sm:py-2.5 ${
                  cat === c.id
                    ? "border-[#B8954A] bg-[#FFF6E7] text-[#1E1810] ring-1 ring-[#B8954A]/30"
                    : "border-[#E8DFD0] bg-white text-[#5C5346] hover:border-[#C9B46A]/60"
                }`}
              >
                {rm.category[c.labelKey]}
              </button>
            ))}
          </div>
        </section>

        <RentasAnuncioFormSection
          state={state}
          setState={setState}
          fieldClass={fieldClass}
          textareaFieldClass={textareaFieldClass}
          estadoOptions={ESTADOS.map((o) => ({ id: o.id, label: rm.listingStatus[o.labelKey] }))}
          lang={lang}
        />

        <RentasShowingTourSection
          state={state}
          setState={setState}
          fieldClass={fieldClass}
          textareaFieldClass={textareaFieldClass}
          lang={lang}
        />

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{rm.media.sectionTitle}</h2>
          <p className={aiSubClass}>{rm.media.intro}</p>
          {mediaNotice ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs text-amber-950" role="status">
              {mediaNotice}
            </p>
          ) : null}
          <div className="mt-4">
            <span className={aiLabelClass}>{rm.media.listingPhotos}</span>
            <input
              ref={photosInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => onPhotos(e.target.files)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFEFD8]"
                onClick={() => photosInputRef.current?.click()}
              >
                {rm.media.uploadAdd}
              </button>
              <span className="self-center text-xs text-[#5C5346]">
                {fillTemplate(rm.media.selectedCountTemplate, {
                  count: state.media.photoDataUrls.length,
                  max: MAX_PHOTOS,
                  selectedWord: rm.media.selectedWord,
                })}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">{rm.media.photoCardHint}</p>
            {state.media.photoDataUrls.length > 0 ? (
              <LeonixRealEstateSortablePhotoStrip
                urls={state.media.photoDataUrls}
                primaryImageIndex={state.media.primaryImageIndex}
                onReorder={(nextUrls, nextPrimary) => {
                  setState((s) => {
                    const out: RentasPrivadoFormState = {
                      ...s,
                      media: { ...s.media, photoDataUrls: nextUrls, primaryImageIndex: nextPrimary },
                    };
                    queueMicrotask(() => saveRentasPrivadoDraft(out));
                    return out;
                  });
                }}
                onRemove={(i) =>
                  setState((s) => {
                    const urls = s.media.photoDataUrls.filter((_, j) => j !== i);
                    let pi = s.media.primaryImageIndex;
                    if (pi >= urls.length) pi = Math.max(0, urls.length - 1);
                    const out: RentasPrivadoFormState = {
                      ...s,
                      media: { ...s.media, photoDataUrls: urls, primaryImageIndex: pi },
                    };
                    queueMicrotask(() => saveRentasPrivadoDraft(out));
                    return out;
                  })
                }
                onSetPrimary={(i) =>
                  setState((s) => {
                    const out: RentasPrivadoFormState = {
                      ...s,
                      media: { ...s.media, primaryImageIndex: i },
                    };
                    queueMicrotask(() => saveRentasPrivadoDraft(out));
                    return out;
                  })
                }
                labels={{
                  photoN: (n) => fillTemplate(rm.photoStrip.photoN, { n }),
                  coverSuffix: rm.photoStrip.coverSuffix,
                  coverActive: rm.photoStrip.coverActive,
                  useAsCover: rm.photoStrip.useAsCover,
                  dragReorder: rm.photoStrip.dragReorder,
                  order: rm.photoStrip.order,
                  remove: rm.photoStrip.remove,
                }}
              />
            ) : null}
          </div>
          <div className="mt-6 border-t border-[#E8DFD0] pt-5">
            <span className={aiLabelClass}>{rm.media.videosByLink}</span>
            <p className={aiHintClass}>
              {rm.media.videosHint} {rm.media.recommendedPlatforms}
            </p>
            <div className="mt-4 grid gap-3">
              {Array.from({ length: MAX_VIDEO_URLS }, (_, i) => {
                const current = normalizeVideoUrls(state.media.videoUrls?.length ? state.media.videoUrls : [state.media.videoUrl]);
                const value = current[i] ?? "";
                const invalid = value.trim() && !/^https?:\/\//i.test(value.trim());
                return (
                  <AiField
                    key={i}
                    label={fillTemplate(rm.media.videoN, { n: i + 1 })}
                    hint={i === 0 ? rm.media.primaryVideoHint : undefined}
                  >
                    <input
                      className={fieldClass}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      placeholder="https://youtube.com/..."
                      value={value}
                      onChange={(e) => onVideoUrlChange(i, e.target.value)}
                    />
                    {invalid ? (
                      <p className="mt-2 text-xs font-medium text-amber-800">{rm.media.invalidUrl}</p>
                    ) : null}
                  </AiField>
                );
              })}
            </div>
            {normalizeVideoUrls(state.media.videoUrls?.length ? state.media.videoUrls : [state.media.videoUrl]).length ? (
              <p className="mt-3 text-xs font-medium text-[#2C7A4E]">{rm.media.linksReady}</p>
            ) : null}
          </div>
        </section>

        <section className={`${aiCardClass} min-w-0`}>
          <h2 className={aiTitleClass}>{rm.contact.sectionTitle}</h2>
          <p className={aiSubClass}>{rm.contact.intro}</p>
          <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="sm:col-span-2">
              <span className={aiLabelClass}>{rm.contact.contactPhoto}</span>
              <input
                ref={ownerPhotoInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const data = await compressImageFileToJpegDataUrl(f);
                    setState((s) => {
                      const out: RentasPrivadoFormState = { ...s, seller: { ...s.seller, fotoDataUrl: data } };
                      queueMicrotask(() => saveRentasPrivadoDraft(out));
                      return out;
                    });
                  } catch {
                    /* ignore */
                  }
                  if (ownerPhotoInputRef.current) ownerPhotoInputRef.current.value = "";
                }}
              />
              <div className="mt-2 flex flex-wrap items-start gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFF6E7] px-4 text-sm font-semibold text-[#1E1810] transition hover:bg-[#FFEFD8]"
                  onClick={() => ownerPhotoInputRef.current?.click()}
                >
                  {rm.contact.uploadPhoto}
                </button>
                {state.seller.fotoDataUrl ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <img
                      src={state.seller.fotoDataUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-full border border-[#E8DFD0] object-cover"
                    />
                    <button
                      type="button"
                      className="text-left text-xs font-bold text-[#B8954A] underline"
                      onClick={() =>
                        setState((s) => {
                          const out: RentasPrivadoFormState = { ...s, seller: { ...s.seller, fotoDataUrl: "" } };
                          queueMicrotask(() => saveRentasPrivadoDraft(out));
                          return out;
                        })
                      }
                    >
                      {rm.contact.removePhoto}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
            <AiField required label={rm.contact.fullName}>
              <input
                className={fieldClass}
                value={state.seller.nombre}
                onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, nombre: e.target.value } }))}
                autoComplete="name"
              />
            </AiField>
            <AiField label={rm.contact.phone}>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.seller.telefono))}
                onChange={(e) => {
                  const prev = digitsOnly(state.seller.telefono);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, seller: { ...s.seller, telefono: display } }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField label={rm.contact.whatsapp}>
              <input
                className={fieldClass}
                inputMode="numeric"
                value={formatUsPhoneDisplay(digitsOnly(state.seller.whatsapp))}
                onChange={(e) => {
                  const prev = digitsOnly(state.seller.whatsapp);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, seller: { ...s.seller, whatsapp: display } }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <AiField label={rm.contact.textNumber} hint={rm.contact.textNumberHint}>
              <input
                className={fieldClass}
                inputMode="numeric"
                placeholder={rm.contact.textNumberPlaceholder}
                value={formatUsPhoneDisplay(digitsOnly(state.seller.mensajesTexto))}
                onChange={(e) => {
                  const prev = digitsOnly(state.seller.mensajesTexto);
                  const { display } = onPhoneInputChange(e.target.value, prev);
                  setState((s) => ({ ...s, seller: { ...s.seller, mensajesTexto: display } }));
                }}
                autoComplete="tel"
              />
            </AiField>
            <div className="sm:col-span-2">
              <AiField label={rm.contact.email}>
                <input
                  className={fieldClass}
                  type="email"
                  value={state.seller.correo}
                  onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, correo: e.target.value } }))}
                  autoComplete="email"
                />
              </AiField>
            </div>
            <div className="sm:col-span-2">
              <AiField label={rm.contact.messageOptional} hint={rm.contact.messageHint}>
                <textarea
                  className={textareaFieldClass}
                  rows={3}
                  value={state.seller.notaContacto}
                  onChange={(e) => setState((s) => ({ ...s, seller: { ...s.seller, notaContacto: e.target.value } }))}
                />
              </AiField>
            </div>
            <div className="sm:col-span-2 mt-2 border-t border-black/10 pt-5">
              <Gate12cContactChannelsFields
                lang={lang}
                value={state.contactChannels}
                onChange={(next) => setState((s) => ({ ...s, contactChannels: next }))}
                fieldClass={fieldClass}
                titleClass={aiTitleClass}
              />
            </div>
          </div>
        </section>

        {cat === "residencial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{rm.residential.sectionTitle}</h2>
            {residencialRowsMode === "full_legacy" ? (
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label={rm.residential.type}>
                <select
                  className={fieldClass}
                  value={state.residencial.tipoCodigo}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      residencial: { ...s.residencial, tipoCodigo: e.target.value as typeof s.residencial.tipoCodigo, subtipo: "" },
                    }))
                  }
                >
                  {TIPO_PROPIEDAD_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {rm.residentialTypes[o.value]}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={rm.residential.subtype}>
                <select
                  className={fieldClass}
                  value={state.residencial.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, subtipo: e.target.value } }))}
                >
                  {SUBTIPO_POR_TIPO[state.residencial.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.value
                        ? (rm.residentialSubtypes as Record<string, string>)[o.value] || o.label
                        : rm.residentialSubtypes.noAdditionalDetail}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={rm.residential.bedrooms}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.recamaras}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, recamaras: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.residential.fullBaths}>
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={state.residencial.banos}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, banos: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.residential.halfBaths}>
                <input
                  className={fieldClass}
                  inputMode="decimal"
                  value={state.residencial.mediosBanos}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, mediosBanos: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.residential.interior}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.interiorSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, interiorSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.residencial.interiorSqft} lang={lang} />
              </AiField>
              <AiField label={rm.residential.lot}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, loteSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.residencial.loteSqft} lang={lang} />
              </AiField>
              <AiField label={rm.residential.parking}>
                <input
                  className={fieldClass}
                  value={state.residencial.estacionamiento}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, estacionamiento: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.residential.yearBuilt}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.residencial.ano}
                  onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, ano: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.residential.condition}>
                <select
                  className={fieldClass}
                  value={state.residencial.condicion}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      residencial: { ...s.residencial, condicion: e.target.value as typeof s.residencial.condicion },
                    }))
                  }
                >
                  {CONDICION_OPTS.map((o) => (
                    <option key={o.value || "x"} value={o.value}>
                      {rm.condition[o.labelKey]}
                    </option>
                  ))}
                </select>
              </AiField>
            </div>
            ) : residencialRowsMode === "room_partial" ? (
              <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
                <AiField label={rm.residential.fullBaths}>
                  <input
                    className={fieldClass}
                    inputMode="decimal"
                    value={state.residencial.banos}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, banos: e.target.value } }))}
                  />
                </AiField>
                <AiField label={rm.residential.halfBaths}>
                  <input
                    className={fieldClass}
                    inputMode="decimal"
                    value={state.residencial.mediosBanos}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, mediosBanos: e.target.value } }))}
                  />
                </AiField>
                <AiField label={rm.residential.interior}>
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    value={state.residencial.interiorSqft}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, interiorSqft: e.target.value } }))}
                  />
                  <RentasSqftPreview value={state.residencial.interiorSqft} lang={lang} />
                </AiField>
                <AiField label={rm.residential.parking}>
                  <input
                    className={fieldClass}
                    value={state.residencial.estacionamiento}
                    onChange={(e) => setState((s) => ({ ...s, residencial: { ...s.residencial, estacionamiento: e.target.value } }))}
                  />
                </AiField>
              </div>
            ) : (
              <p className={`${aiSubClass} mt-3`}>{RESIDENTIAL_FLOW_HIGHLIGHTS_ONLY[lang]}</p>
            )}
            <div className="mt-6">
              <span className={aiLabelClass}>{rm.highlights.highlightsHeading}</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {BR_HIGHLIGHT_PRESET_DEFS.map((d) => (
                  <label key={d.key} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                      checked={state.residencial.highlightKeys.includes(d.key)}
                      onChange={(e) =>
                        setState((s) => {
                          const set = new Set(s.residencial.highlightKeys);
                          if (e.target.checked) set.add(d.key);
                          else set.delete(d.key);
                          return { ...s, residencial: { ...s.residencial, highlightKeys: [...set] } };
                        })
                      }
                    />
                    <span className="text-base leading-none shrink-0 pt-0.5" aria-hidden>
                      {RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL[d.key as keyof typeof RENTAS_RESIDENCIAL_HIGHLIGHT_FORM_VISUAL]}
                    </span>
                    <span className="min-w-0 flex-1">{(rm.highlights as Record<string, string>)[d.key] ?? d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {cat === "comercial" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{rm.commercialSection.sectionTitle}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label={rm.commercialSection.type}>
                <select
                  className={fieldClass}
                  value={state.comercial.tipoCodigo}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      comercial: { ...s.comercial, tipoCodigo: e.target.value as typeof s.comercial.tipoCodigo, subtipo: "" },
                    }))
                  }
                >
                  {COMERCIAL_TIPO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {rm.commercialTypes[o.value]}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={rm.commercialSection.subtype}>
                <select
                  className={fieldClass}
                  value={state.comercial.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, subtipo: e.target.value } }))}
                >
                  {COMERCIAL_SUBTIPO_POR_TIPO[state.comercial.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {!o.value
                        ? rm.commercialSubtypes.noAdditionalDetail
                        : (rm.commercialSubtypes as Record<string, string>)[o.value] ?? o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <div className="sm:col-span-2">
                <AiField label={rm.commercialSection.use}>
                  <input
                    className={fieldClass}
                    value={state.comercial.uso}
                    onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, uso: e.target.value } }))}
                  />
                </AiField>
              </div>
              <AiField label={rm.commercialSection.interior}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.comercial.interiorSqft}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, interiorSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.comercial.interiorSqft} lang={lang} />
              </AiField>
              <AiField label={rm.commercialSection.offices}>
                <input
                  className={fieldClass}
                  value={state.comercial.oficinas}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, oficinas: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.commercialSection.baths}>
                <input
                  className={fieldClass}
                  value={state.comercial.banos}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, banos: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.commercialSection.levels}>
                <input
                  className={fieldClass}
                  value={state.comercial.niveles}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, niveles: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.commercialSection.parking}>
                <input
                  className={fieldClass}
                  value={state.comercial.estacionamiento}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, estacionamiento: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.commercialSection.zoning}>
                <input
                  className={fieldClass}
                  value={state.comercial.zonificacion}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, zonificacion: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.commercialSection.condition}>
                <select
                  className={fieldClass}
                  value={state.comercial.condicion}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      comercial: { ...s.comercial, condicion: e.target.value as typeof s.comercial.condicion },
                    }))
                  }
                >
                  {CONDICION_OPTS.map((o) => (
                    <option key={`c-${o.value || "x"}`} value={o.value}>
                      {rm.condition[o.labelKey]}
                    </option>
                  ))}
                </select>
              </AiField>
              <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.comercial.accesoCarga}
                  onChange={(e) => setState((s) => ({ ...s, comercial: { ...s.comercial, accesoCarga: e.target.checked } }))}
                />
                <span className="text-sm font-medium text-[#2C2416]">{rm.commercialSection.loadingAccess}</span>
              </label>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>{rm.commercialSection.highlightsHeading}</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {COMERCIAL_DESTACADOS_DEFS.map((d) => (
                  <label key={d.id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                      checked={state.comercial.destacadoIds.includes(d.id)}
                      onChange={(e) =>
                        setState((s) => {
                          const set = new Set(s.comercial.destacadoIds);
                          if (e.target.checked) set.add(d.id);
                          else set.delete(d.id);
                          return { ...s, comercial: { ...s.comercial, destacadoIds: [...set] } };
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">{rm.commercialHighlights[d.id] ?? d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {cat === "terreno_lote" ? (
          <section className={`${aiCardClass} min-w-0`}>
            <h2 className={aiTitleClass}>{rm.landSection.sectionTitle}</h2>
            <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
              <AiField label={rm.landSection.type}>
                <select
                  className={fieldClass}
                  value={state.terreno.tipoCodigo}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      terreno: { ...s.terreno, tipoCodigo: e.target.value as typeof s.terreno.tipoCodigo, subtipo: "" },
                    }))
                  }
                >
                  {TERRENO_TIPO_OPCIONES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {rm.landTypes[o.value]}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={rm.landSection.subtype}>
                <select
                  className={fieldClass}
                  value={state.terreno.subtipo}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, subtipo: e.target.value } }))}
                >
                  {TERRENO_SUBTIPO_POR_TIPO[state.terreno.tipoCodigo].map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {!o.value
                        ? rm.landSubtypes.noAdditionalDetail
                        : (rm.landSubtypes as Record<string, string>)[o.value] ?? o.label}
                    </option>
                  ))}
                </select>
              </AiField>
              <AiField label={rm.landSection.lot}>
                <input
                  className={fieldClass}
                  inputMode="numeric"
                  value={state.terreno.loteSqft}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, loteSqft: e.target.value } }))}
                />
                <RentasSqftPreview value={state.terreno.loteSqft} lang={lang} />
              </AiField>
              <AiField label={rm.landSection.useZoning}>
                <input
                  className={fieldClass}
                  value={state.terreno.usoZonificacion}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, usoZonificacion: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.landSection.access}>
                <input
                  className={fieldClass}
                  value={state.terreno.acceso}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, acceso: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.landSection.utilities}>
                <input
                  className={fieldClass}
                  value={state.terreno.servicios}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, servicios: e.target.value } }))}
                />
              </AiField>
              <AiField label={rm.landSection.topography}>
                <input
                  className={fieldClass}
                  value={state.terreno.topografia}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, topografia: e.target.value } }))}
                />
              </AiField>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.terreno.listoConstruir}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, listoConstruir: e.target.checked } }))}
                />
                <span className="text-sm font-medium">{rm.landSection.readyToBuild}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.terreno.cercado}
                  onChange={(e) => setState((s) => ({ ...s, terreno: { ...s.terreno, cercado: e.target.checked } }))}
                />
                <span className="text-sm font-medium">{rm.landSection.fenced}</span>
              </label>
            </div>
            <div className="mt-6">
              <span className={aiLabelClass}>{rm.landSection.highlightsHeading}</span>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {TERRENO_DESTACADOS_DEFS.map((d) => (
                  <label key={d.id} className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                      checked={state.terreno.destacadoIds.includes(d.id)}
                      onChange={(e) =>
                        setState((s) => {
                          const set = new Set(s.terreno.destacadoIds);
                          if (e.target.checked) set.add(d.id);
                          else set.delete(d.id);
                          return { ...s, terreno: { ...s.terreno, destacadoIds: [...set] } };
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">{rm.landHighlights[d.id] ?? d.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <ListingRulesConfirmationSection
          lang={lang}
          subject="property"
          confirmAccurate={state.confirmListingAccurate}
          confirmPhotos={state.confirmPhotosRepresentItem}
          confirmRules={state.confirmCommunityRules}
          onAccurate={(v) => setState((s) => ({ ...s, confirmListingAccurate: v }))}
          onPhotos={(v) => setState((s) => ({ ...s, confirmPhotosRepresentItem: v }))}
          onRules={(v) => setState((s) => ({ ...s, confirmCommunityRules: v }))}
        />

        <section className={`${aiCardClass} min-w-0`} aria-labelledby="sec-review">
          <h2 id="sec-review" className={aiTitleClass}>
            {rm.review.finalReview}
          </h2>
          <p className={aiSubClass}>{rm.review.finalReviewHint}</p>

          <div className="mt-5 rounded-xl border border-[#C9782F]/50 bg-[#FFFDF7]/50 px-4 py-3">
            <p className="text-xs font-semibold text-[#8a7a62]">{rm.review.priceSummary}</p>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5D4A25]">{rm.review.rentalListing}</span>
                <span className="font-semibold text-[#3D2C12]">$24.99 / 30 {rm.review.days30}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-[#D8C79A]/40 pt-2">
                <span className="font-semibold text-[#3D2C12]">{rm.review.total}</span>
                <span className="font-bold text-[#C9782F]">$24.99</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[#5D4A25]/80">{rm.review.paidActivationHint}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-[#D8C79A]/40 pt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
              <button
                type="button"
                onClick={previewActionsProps.onPreviewValidated}
                disabled={previewActionsProps.disableValidatedPreview}
                className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl bg-[#3B66AD] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#2f5699] disabled:cursor-not-allowed disabled:opacity-40 sm:max-w-xs"
              >
                {rm.review.preview}
              </button>
              <button
                type="button"
                onClick={() => {
                  previewActionsProps.onBeforeOpenUnvalidatedPreview();
                  router.push(previewActionsProps.openPreviewHref);
                }}
                className="inline-flex min-h-[48px] min-w-0 flex-1 touch-manipulation items-center justify-center rounded-xl border-2 border-[#3B66AD]/45 bg-white px-4 py-3 text-sm font-bold leading-tight text-[#2f5699] shadow-sm transition hover:bg-[#3B66AD]/5 sm:max-w-xs"
              >
                {rm.review.viewPreviewDraft}
              </button>
            </div>
            {previewActionsProps.validationBlockedMessage ? (
              <p className="text-sm font-medium text-amber-900" role="status">
                {previewActionsProps.validationBlockedMessage}
              </p>
            ) : null}
            {editContext ? (
              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#C9B46A]/60 bg-white px-4 py-3 text-sm font-bold text-[#2C2416]"
                >
                  {rm.actions.cancelEdit}
                </button>
                <button
                  type="button"
                  disabled={saveBusy || hydrationStatus !== "ready"}
                  onClick={() => void saveListingEdit()}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#2A2620] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saveBusy ? rm.actions.saving : rm.actions.saveChanges}
                </button>
              </div>
            ) : (
            <div className="pt-1">
              <button
                type="button"
                onClick={previewActionsProps.onDeleteApplication}
                className="text-xs font-medium text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
              >
                {previewActionsProps.labels.deleteApplication}
              </button>
            </div>
            )}
          </div>
        </section>

        <p className="break-words text-center text-xs leading-relaxed text-[#5C5346]/80">
          {rm.page.draftDeviceOnly}
        </p>
      </div>
    </main>
  );
}
