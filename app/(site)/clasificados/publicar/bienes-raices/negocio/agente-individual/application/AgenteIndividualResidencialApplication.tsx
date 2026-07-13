"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { fetchBrParentListingMetaBrowser } from "@/app/clasificados/bienes-raices/lib/fetchBrParentListingMetaBrowser";
import {
  brInventoryAddModeSubcopy,
  brInventoryAddModeTitle,
  brInventoryConnectedToParentLine,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import {
  parseBrInventoryAddSearchParams,
  resolveBrInventoryAddReturnHref,
  writeBrInventoryAddContextToSession,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import {
  applyBrNegocioBranchQuery,
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  BR_CATEGORY_HOME,
  BR_PREVIEW_NEGOCIO,
  BR_PUBLICAR_HUB,
  BR_PUBLICAR_NEGOCIO,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  abandonLeonixPublishFlowClient,
  confirmLeavePublishFlow,
  markPublishFlowOpeningPreview,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { createEmptyAgenteIndividualResidencialState } from "../schema/agenteIndividualResidencialFormState";
import { brShouldIgnoreWizardShortcut } from "../../application/brWizardKeyboard";
import {
  bootstrapAgenteIndividualResidencialApplicationStateResolved,
  flushAgenteResDraftSyncForUnload,
  persistAgenteResApplicationDraftQuiet,
  persistAgenteResApplicationDraftResolved,
  saveAgenteResPreviewReturnDraft,
} from "./utils/previewDraft";
import { agenteResFormHasProgress } from "./formProgress";
import {
  Step01TipoAnuncio,
  Step02InformacionBasica,
  Step03Media,
} from "../sections/steps01-03";
import {
  Step04DetallesEsenciales,
  Step05Caracteristicas,
  Step06Descripcion,
  Step07InformacionProfesional,
  Step08CtaEnlaces,
  Step09ExtrasOpcionales,
} from "../sections/steps04-09";
import { useBrAgenteResidencialCopy } from "./BrAgenteResidencialLocaleContext";
import { withBrAgenteResLangParam } from "./brAgenteResidencialLang";
import { brAgenteApplicationPricingCopy } from "../../../shared/brAgenteApplicationPricingCopy";
import { BrNegocioPrePublishInventoryShell } from "../../application/sections/shared/BrNegocioPrePublishInventoryShell";
import type { BrPendingInventoryChildOpen } from "../../application/sections/shared/BrNegocioPrePublishInventoryShell";
import {
  clearBrInventoryChildContext,
  parseBrInventoryChildSearchParams,
  readBrInventoryChildContext,
} from "../../application/brNegocioInventoryChildContext";
import { BrAgenteApplicationPricingSummary } from "../../application/sections/shared/BrAgenteApplicationPricingSummary";
import { BrAgenteApplicationConfirmations } from "../../application/sections/shared/BrAgenteApplicationConfirmations";
import { mapAgenteFormToMainInventoryCard } from "../../application/brNegocioInventoryCardModel";
import { getQueue, readQueuePrefillForAddMode } from "../../application/brNegocioInventoryPublishQueue";
import { applyInventoryDraftToAgenteFormState } from "../../application/brNegocioInventoryQueuePrefill";
import { setChildInventoryMediaBridge } from "../../application/brNegocioInventoryDraftPersistence";
import { syncAgenteAddModePreviewHandoff } from "../../application/brNegocioInventoryAddModePreviewHandoff";
import {
  bienesInventoryEditHref,
  bienesInventoryPackAddonUpgradeBusyLabel,
  bienesInventoryPackAddonUpgradeLabel,
  bienesInventoryPackInactiveDashboardHint,
  bienesListingPreviewHref,
  fetchBienesInventoryPackEntitlementActive,
  hydrateBienesListingForDashboardEdit,
  redirectBienesDashboardInventoryPackCheckout,
} from "@/app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

export default function AgenteIndividualResidencialApplication() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useBrAgenteResidencialCopy();
  const inventoryAdd = useMemo(
    () => parseBrInventoryAddSearchParams(searchParams ?? new URLSearchParams()),
    [searchParams],
  );
  const inventoryChildRoute = useMemo(
    () => parseBrInventoryChildSearchParams(searchParams ?? new URLSearchParams()),
    [searchParams],
  );
  const [pendingInventoryChildOpen, setPendingInventoryChildOpen] = useState<BrPendingInventoryChildOpen | null>(
    null,
  );
  const [parentDraftReady, setParentDraftReady] = useState(false);
  const inventoryChildConsumedRef = useRef(false);
  const editListingId = searchParams?.get("listingId")?.trim() ?? "";
  const editListingSlug = searchParams?.get("listingSlug")?.trim() ?? "";
  const editLeonixAdId = searchParams?.get("leonixAdId")?.trim() ?? "";
  const listingIdentity = Boolean(editListingId || editListingSlug || editLeonixAdId);
  const dashboardSource = searchParams?.get("source") === "dashboard";
  const dashboardMode = searchParams?.get("mode") ?? "";
  const focusInventoryPack = searchParams?.get("focus") === "inventory-pack";
  const isDashboardListingEditMode = dashboardSource && dashboardMode === "listing-edit" && listingIdentity;
  const isDashboardInventoryEditMode = dashboardSource && dashboardMode === "inventory-edit" && listingIdentity;
  const isDashboardInventoryAddonMode = dashboardSource && dashboardMode === "inventory-addon" && listingIdentity;
  const isExistingDashboardListingMode =
    isDashboardListingEditMode || isDashboardInventoryEditMode || isDashboardInventoryAddonMode;
  const dashboardReturnHref = appendLangToPath(
    buildDashboardMisAnunciosReturnPath(lang, "bienes-raices"),
    lang,
  );
  const [editHydration, setEditHydration] = useState<
    { status: "idle" } | { status: "loading" } | { status: "error"; message: string }
  >({ status: "idle" });
  const dashboardHydratedRef = useRef(false);
  const [parentMeta, setParentMeta] = useState<{ leonix_ad_id: string | null; title: string | null } | null>(null);
  const [inventoryEntitlement, setInventoryEntitlement] = useState<
    "idle" | "loading" | "active" | "inactive" | "pending"
  >("idle");
  const [inventoryCheckoutBusy, setInventoryCheckoutBusy] = useState(false);
  const [inventoryCheckoutError, setInventoryCheckoutError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [state, setState] = useState(() => createEmptyAgenteIndividualResidencialState());
  const addModePreviewSyncedRef = useRef(false);
  const skipFirstPersistRef = useRef(true);

  useEffect(() => {
    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      persistAgenteResApplicationDraftQuiet(state);
    }, 800);
    return () => clearTimeout(timer);
  }, [state]);

  /** Hard-refresh safety: flush draft sync before unload (debounced async may still be pending). */
  useEffect(() => {
    const onPageHide = () => {
      flushAgenteResDraftSyncForUnload(state);
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, [state]);

  /** Defensive: any future page-level wizard shortcuts must ignore editable targets (Spacebar contract). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (brShouldIgnoreWizardShortcut(e)) return;
      // Intentionally no Space/letter shortcuts — next/prev are explicit buttons only.
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        setStep((s) => Math.min(9, s + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useLayoutEffect(() => {
    if (inventoryAdd.context) writeBrInventoryAddContextToSession(inventoryAdd.context);
  }, [inventoryAdd.context]);

  useLayoutEffect(() => {
    if (isExistingDashboardListingMode) {
      return;
    }
    let cancelled = false;
    void (async () => {
      let boot = await bootstrapAgenteIndividualResidencialApplicationStateResolved();
      boot = applyBrNegocioBranchQuery(boot, searchParams);

      if (inventoryAdd.inventoryModeAdd && inventoryAdd.context) {
        const queue = getQueue();
        const prefill = readQueuePrefillForAddMode();
        if (queue?.formKind === "agente" && queue.inheritedAgenteSnapshot) {
          boot = queue.inheritedAgenteSnapshot;
          if (prefill) boot = applyInventoryDraftToAgenteFormState(boot, prefill, lang);
          boot = applyBrNegocioBranchQuery(boot, searchParams);
        }
      }

      if (cancelled) return;
      setState(boot);
      setChildInventoryMediaBridge(boot.additionalInventoryProperties ?? []);
      setParentDraftReady(true);
      if (inventoryAdd.inventoryModeAdd && inventoryAdd.context && readQueuePrefillForAddMode()) {
        syncAgenteAddModePreviewHandoff(boot);
        addModePreviewSyncedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
    // Bootstrap + return-draft consume runs once per mount (Strict Mode safe via previewReturnMemory).
  }, [isExistingDashboardListingMode]);

  useEffect(() => {
    if (isExistingDashboardListingMode) setParentDraftReady(true);
  }, [isExistingDashboardListingMode]);

  useEffect(() => {
    if (!isExistingDashboardListingMode || !editListingId || dashboardHydratedRef.current) return;
    dashboardHydratedRef.current = true;
    setEditHydration({ status: "loading" });
    void hydrateBienesListingForDashboardEdit({ listingId: editListingId, lang }).then(async (result) => {
      if (!result.ok) {
        setEditHydration({ status: "error", message: result.userMessage });
        return;
      }
      const boot = await bootstrapAgenteIndividualResidencialApplicationStateResolved();
      setState(boot);
      setChildInventoryMediaBridge(boot.additionalInventoryProperties ?? []);
      setEditHydration({ status: "idle" });
    });
  }, [editListingId, isExistingDashboardListingMode, lang]);

  useEffect(() => {
    if (!isExistingDashboardListingMode || !editListingId) {
      setInventoryEntitlement("idle");
      return;
    }
    let cancelled = false;
    setInventoryEntitlement("loading");
    void fetchBienesInventoryPackEntitlementActive({
      listingId: editListingId,
      leonixAdId: editLeonixAdId,
      slug: editListingSlug,
    }).then((result) => {
      if (cancelled) return;
      if (result.active) {
        setInventoryEntitlement("active");
        return;
      }
      if (result.pending) {
        setInventoryEntitlement("pending");
        return;
      }
      const postPaymentReturn = isDashboardInventoryEditMode && focusInventoryPack;
      setInventoryEntitlement(postPaymentReturn ? "pending" : "inactive");
    });
    return () => {
      cancelled = true;
    };
  }, [
    dashboardMode,
    editLeonixAdId,
    editListingId,
    editListingSlug,
    focusInventoryPack,
    isDashboardInventoryAddonMode,
    isDashboardInventoryEditMode,
    isExistingDashboardListingMode,
  ]);

  const startDashboardInventoryPackCheckout = useCallback(async () => {
    if (!editListingId) return;
    setInventoryCheckoutError(null);
    setInventoryCheckoutBusy(true);
    try {
      const result = await redirectBienesDashboardInventoryPackCheckout({
        listingId: editListingId,
        leonixAdId: editLeonixAdId,
        lang,
        returnPath: bienesInventoryEditHref({
          lang,
          listingId: editListingId,
          listingSlug: editListingSlug,
          leonixAdId: editLeonixAdId,
        }),
      });
      if (!result.ok) setInventoryCheckoutError(result.userMessage);
    } finally {
      setInventoryCheckoutBusy(false);
    }
  }, [editLeonixAdId, editListingId, editListingSlug, lang]);

  useEffect(() => {
    // Pre-publish inventory-child return uses `focus=inventory-pack` so the shell (and drawer) mount.
    if (focusInventoryPack) {
      setStep(9);
      return;
    }
    if (!isExistingDashboardListingMode) return;
    if (!isDashboardInventoryEditMode && !isDashboardInventoryAddonMode) return;
    setStep(9);
  }, [focusInventoryPack, isDashboardInventoryEditMode, isDashboardInventoryAddonMode, isExistingDashboardListingMode]);

  useEffect(() => {
    if (addModePreviewSyncedRef.current) return;
    if (!inventoryAdd.inventoryModeAdd || !inventoryAdd.context) return;
    if (!readQueuePrefillForAddMode()) return;
    if (!trim(state.titulo)) return;
    addModePreviewSyncedRef.current = true;
    syncAgenteAddModePreviewHandoff(state);
  }, [inventoryAdd.context, inventoryAdd.inventoryModeAdd, state.titulo]);

  useEffect(() => {
    const parentId = inventoryAdd.context?.parentListingId;
    if (!parentId) {
      setParentMeta(null);
      return;
    }
    let cancelled = false;
    void fetchBrParentListingMetaBrowser(parentId).then((meta) => {
      if (cancelled) return;
      setParentMeta(meta ? { leonix_ad_id: meta.leonix_ad_id, title: meta.title } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [inventoryAdd.context?.parentListingId]);

  const propiedadParam = searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null;
  useEffect(() => {
    const prop = parseBrNegocioPropiedadParam(propiedadParam);
    if (!prop) return;
    // Never apply childPropiedad to parent — only parent `propiedad` query.
    setState((s) => (s.categoriaPropiedad === prop ? s : { ...s, categoriaPropiedad: prop }));
  }, [propiedadParam]);

  useEffect(() => {
    if (!parentDraftReady) return;
    if (!inventoryChildRoute.active) return;
    if (inventoryChildConsumedRef.current) return;
    inventoryChildConsumedRef.current = true;
    const session = readBrInventoryChildContext();
    const childDraftId =
      inventoryChildRoute.childDraftId?.trim() || session?.childDraftId?.trim() || "";
    const childPropiedad =
      inventoryChildRoute.childPropiedad || session?.childPropiedad || null;
    if (!childDraftId || !childPropiedad) {
      clearBrInventoryChildContext();
      return;
    }
    setPendingInventoryChildOpen({ childDraftId, childPropiedad });
    clearBrInventoryChildContext();
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.delete("mode");
    qs.delete("childDraftId");
    qs.delete("childPropiedad");
    qs.set("focus", "inventory-pack");
    if (inventoryChildRoute.parentPropiedad) {
      qs.set(BR_NEGOCIO_Q_PROPIEDAD, inventoryChildRoute.parentPropiedad);
    } else if (session?.parentPropiedad) {
      qs.set(BR_NEGOCIO_Q_PROPIEDAD, session.parentPropiedad);
    }
    const next = qs.toString();
    router.replace(next ? `${BR_PUBLICAR_NEGOCIO}?${next}` : BR_PUBLICAR_NEGOCIO);
  }, [inventoryChildRoute, parentDraftReady, router, searchParams]);

  const stepLabels = t.stepLabels;
  const total = stepLabels.length;
  const stepLabel = stepLabels[step] ?? "";
  const isDirty = agenteResFormHasProgress(state);
  const muxIds = useMemo(() => [] as string[], []);

  const leaveAndGo = useCallback(
    (href: string) => {
      if (!isDirty || confirmLeavePublishFlow(lang)) {
        abandonLeonixPublishFlowClient({ muxAssetIds: muxIds, useBeacon: false });
        router.push(href);
      }
    },
    [isDirty, lang, muxIds, router]
  );

  const pricingCopy = brAgenteApplicationPricingCopy(lang);
  const childInventoryCount = state.additionalInventoryProperties.length;
  const dashboardInventoryPackUnlocked = !isExistingDashboardListingMode || inventoryEntitlement === "active";
  const inventoryPackAcceptedForShell = isExistingDashboardListingMode
    ? dashboardInventoryPackUnlocked
    : state.inventoryPackAccepted;

  const confirmAll =
    state.confirmListingAccurate &&
    state.confirmPhotosRepresentItem &&
    state.confirmCommunityRules &&
    state.confirmPaymentAfterPreview &&
    (childInventoryCount >= 1 ? state.confirmInventoryPackPricing : true);

  const openPreview = useCallback(async () => {
    if (!confirmAll) return;
    markPublishFlowOpeningPreview();
    await persistAgenteResApplicationDraftResolved(state);
    saveAgenteResPreviewReturnDraft(state);
    const previewQs = new URLSearchParams();
    if (inventoryAdd.inventoryModeAdd && inventoryAdd.context) {
      previewQs.set("inventoryMode", "add");
      previewQs.set("parentListingId", inventoryAdd.context.parentListingId);
      if (inventoryAdd.context.returnToListingId?.trim()) {
        previewQs.set("returnToListingId", inventoryAdd.context.returnToListingId.trim());
      }
      if (inventoryAdd.context.brInventoryGroupId?.trim()) {
        previewQs.set("inventoryGroupId", inventoryAdd.context.brInventoryGroupId.trim());
      }
    }
    const previewPath = isExistingDashboardListingMode
      ? bienesListingPreviewHref({
          lang,
          listingId: editListingId || null,
          listingSlug: editListingSlug || null,
          leonixAdId: editLeonixAdId || null,
          mode: isDashboardInventoryEditMode
            ? "inventory-edit"
            : isDashboardInventoryAddonMode
              ? "inventory-addon"
              : "listing-edit",
          focus: focusInventoryPack ? "inventory-pack" : null,
          categoriaPropiedad: state.categoriaPropiedad,
        })
      : previewQs.toString()
        ? `${BR_PREVIEW_NEGOCIO}?${previewQs.toString()}`
        : BR_PREVIEW_NEGOCIO;
    router.push(withBrAgenteResLangParam(previewPath, lang));
  }, [
    confirmAll,
    editLeonixAdId,
    editListingId,
    editListingSlug,
    focusInventoryPack,
    inventoryAdd.context,
    inventoryAdd.inventoryModeAdd,
    isDashboardInventoryAddonMode,
    isDashboardInventoryEditMode,
    isExistingDashboardListingMode,
    lang,
    router,
    state,
  ]);

  const nav = useMemo(
    () => (
      <aside className="hidden lg:block lg:sticky lg:top-28 lg:w-56 lg:shrink-0">
        <nav className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-[#5C5346]/75">{t.app.navPasos}</p>
          <ol className="max-h-[50vh] space-y-1 overflow-y-auto text-sm lg:max-h-[calc(100vh-8rem)]">
            {stepLabels.map((label, i) => (
              <li key={`${i}-${label}`}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={
                    "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition " +
                    (i === step ? "bg-[#FFF0D4] font-bold text-[#6E5418]" : "text-[#5C5346] hover:bg-white/80")
                  }
                >
                  <span className="w-5 shrink-0 text-xs opacity-70">{i + 1}.</span>
                  <span className="leading-snug">{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    ),
    [step, stepLabels, t.app.navPasos]
  );

  const mobileStepNav = useMemo(
    () => (
      <div className="mb-4 lg:hidden">
        <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7]/95 p-2 shadow-sm">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">{t.app.navPasos}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
            {stepLabels.map((label, i) => (
              <button
                key={`m-${i}-${label}`}
                type="button"
                onClick={() => setStep(i)}
                className={
                  "min-h-[52px] w-[min(100%,9.5rem)] shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-snug transition touch-manipulation " +
                  (i === step
                    ? "border-[#C9B46A] bg-[#FFF0D4] text-[#6E5418] shadow-sm"
                    : "border-[#E8DFD0]/80 bg-white/90 text-[#5C5346] active:bg-white")
                }
              >
                <span className="block text-[10px] font-bold tabular-nums opacity-70">
                  {i + 1}/{total}
                </span>
                <span className="line-clamp-2">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    [step, stepLabels, t.app.navPasos, total]
  );

  if (isExistingDashboardListingMode && editHydration.status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-semibold text-[#5D4A25]" role="status">
          {lang === "en" ? "Loading saved listing for editing…" : "Cargando anuncio publicado…"}
        </p>
      </main>
    );
  }

  if (isExistingDashboardListingMode && editHydration.status === "error") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {editHydration.message}
        </p>
        <a href={dashboardReturnHref} className="mt-4 inline-block text-sm font-semibold underline">
          {lang === "en" ? "← Back to dashboard" : "← Volver al panel"}
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F0E2] pb-24 pt-24 text-[#2C2416] sm:pb-20 sm:pt-28">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="mb-4 rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 shadow-[0_10px_32px_-14px_rgba(42,36,22,0.1)] sm:mb-6 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">{t.app.kicker}</p>
              <h1 className="mt-1 text-2xl font-extrabold text-[#1E1810] sm:text-3xl">
                {inventoryAdd.inventoryModeAdd ? brInventoryAddModeTitle(lang) : t.app.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5C5346]/88">
                {inventoryAdd.inventoryModeAdd ? brInventoryAddModeSubcopy(lang) : t.app.subtitle}
              </p>
              {inventoryAdd.inventoryModeAdd && inventoryAdd.context ? (
                <p className="mt-2 text-sm font-semibold text-[#6E5418]">
                  {parentMeta?.leonix_ad_id
                    ? brInventoryConnectedToParentLine(lang, parentMeta.leonix_ad_id)
                    : lang === "es"
                      ? `Conectada al anuncio principal · ${inventoryAdd.context.parentListingId.slice(0, 8)}…`
                      : `Connected to main listing · ${inventoryAdd.context.parentListingId.slice(0, 8)}…`}
                </p>
              ) : null}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              {inventoryAdd.context ? (
                <button
                  type="button"
                  className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7] sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
                  onClick={() =>
                    leaveAndGo(
                      resolveBrInventoryAddReturnHref({
                        returnToListingId: inventoryAdd.context!.returnToListingId,
                        lang,
                      }),
                    )
                  }
                >
                  {lang === "es" ? "Volver al anuncio principal" : "Back to main listing"}
                </button>
              ) : null}
              {isExistingDashboardListingMode ? (
                <button
                  type="button"
                  className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7] sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
                  onClick={() => leaveAndGo(dashboardReturnHref)}
                >
                  {lang === "en" ? "← Back to dashboard" : "← Volver al panel"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7] sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
                    onClick={() => leaveAndGo(BR_PUBLICAR_HUB)}
                  >
                    {t.app.cambiarCanal}
                  </button>
                  <button
                    type="button"
                    className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-4 py-3 text-sm font-semibold text-[#6E5418] hover:bg-[#FFEFD8] sm:w-auto sm:min-h-0 sm:px-3 sm:py-2"
                    onClick={() => leaveAndGo(BR_CATEGORY_HOME)}
                  >
                    {t.app.verCategoria}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {mobileStepNav}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {nav}
          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-xl border border-[#E8DFD0]/80 bg-white/60 px-3 py-3 text-sm leading-snug text-[#5C5346] sm:py-2">
              {t.app.pasoDe} <span className="font-bold text-[#1E1810]">{step + 1}</span> {t.app.de} {total}
              <span className="mx-2 text-[#C9B46A]">·</span>
              {stepLabel}
            </div>

            {step === 0 ? <Step01TipoAnuncio state={state} setState={setState} /> : null}
            {step === 1 ? <Step02InformacionBasica state={state} setState={setState} /> : null}
            {step === 2 ? <Step03Media state={state} setState={setState} /> : null}
            {step === 3 ? <Step04DetallesEsenciales state={state} setState={setState} /> : null}
            {step === 4 ? <Step05Caracteristicas state={state} setState={setState} /> : null}
            {step === 5 ? <Step06Descripcion state={state} setState={setState} /> : null}
            {step === 6 ? <Step07InformacionProfesional state={state} setState={setState} /> : null}
            {step === 7 ? <Step08CtaEnlaces state={state} setState={setState} /> : null}
            {step === 8 ? <Step09ExtrasOpcionales state={state} setState={setState} /> : null}
            {step === 9 ? (
              <section className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#1E1810]">{t.app.vistaPreviaTitulo}</h2>
                <p className="mt-1 text-sm text-[#5C5346]/88">{t.app.vistaPreviaBody}</p>
                {isExistingDashboardListingMode && inventoryEntitlement === "loading" ? (
                  <p className="mt-4 text-sm text-[#5C5346]">
                    {lang === "es" ? "Verificando tu inventario…" : "Checking your inventory…"}
                  </p>
                ) : null}
                {isExistingDashboardListingMode && inventoryEntitlement === "pending" ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    {lang === "es"
                      ? "Estamos confirmando tu activación. Actualiza en unos segundos o vuelve desde el panel."
                      : "We are confirming your activation. Refresh in a few seconds or return from your dashboard."}
                  </div>
                ) : null}
                {isExistingDashboardListingMode && inventoryEntitlement === "inactive" ? (
                  <div className="mt-4 rounded-xl border border-[#E8DFD0] bg-white p-4">
                    <p className="text-sm text-[#2C2416]">{bienesInventoryPackInactiveDashboardHint(lang)}</p>
                    {inventoryCheckoutError ? (
                      <p className="mt-2 text-xs text-red-800">{inventoryCheckoutError}</p>
                    ) : null}
                    <button
                      type="button"
                      disabled={inventoryCheckoutBusy}
                      onClick={() => void startDashboardInventoryPackCheckout()}
                      className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#C9B46A]/50 bg-[#FFF6E7] px-5 py-2 text-sm font-semibold text-[#6E5418] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {inventoryCheckoutBusy
                        ? bienesInventoryPackAddonUpgradeBusyLabel(lang)
                        : bienesInventoryPackAddonUpgradeLabel(lang)}
                    </button>
                  </div>
                ) : null}
                {dashboardInventoryPackUnlocked ? (
                  <BrNegocioPrePublishInventoryShell
                    lang={lang}
                    parentHubSnapshot={state}
                    parentFullState={state}
                    mainProperty={mapAgenteFormToMainInventoryCard(state, lang)}
                    items={state.additionalInventoryProperties}
                    inventoryPackAccepted={inventoryPackAcceptedForShell}
                    pendingInventoryChildOpen={pendingInventoryChildOpen}
                    onPendingInventoryChildConsumed={() => setPendingInventoryChildOpen(null)}
                    onInventoryPackAcceptedChange={
                      isExistingDashboardListingMode
                        ? undefined
                        : (accepted) => setState((s) => ({ ...s, inventoryPackAccepted: accepted }))
                    }
                    onInventoryPackCancel={
                      isExistingDashboardListingMode
                        ? undefined
                        : () => {
                            setChildInventoryMediaBridge([]);
                            setState((s) => {
                              const next = {
                                ...s,
                                inventoryPackAccepted: false,
                                additionalInventoryProperties: [],
                                confirmInventoryPackPricing: false,
                              };
                              persistAgenteResApplicationDraftQuiet(next);
                              return next;
                            });
                          }
                    }
                    onGoToParentPreview={() => {
                      queueMicrotask(() => {
                        if (confirmAll) openPreview();
                      });
                    }}
                    onItemsChange={(items) => {
                      if (isExistingDashboardListingMode && !dashboardInventoryPackUnlocked) return;
                      setChildInventoryMediaBridge(items);
                      setState((s) => {
                        const next = {
                          ...s,
                          additionalInventoryProperties: items,
                          inventoryPackAccepted: isExistingDashboardListingMode
                            ? true
                            : items.length > 0
                              ? true
                              : s.inventoryPackAccepted,
                          confirmInventoryPackPricing:
                            items.length === 0 ? false : s.confirmInventoryPackPricing,
                        };
                        persistAgenteResApplicationDraftQuiet(next);
                        return next;
                      });
                    }}
                    hidden={inventoryAdd.inventoryModeAdd}
                  />
                ) : null}
                {!isExistingDashboardListingMode ? (
                  <>
                    <BrAgenteApplicationPricingSummary lang={lang} childCount={childInventoryCount} />
                    <BrAgenteApplicationConfirmations
                      lang={lang}
                      state={state}
                      childCount={childInventoryCount}
                      setState={setState}
                    />
                    <button
                      type="button"
                      disabled={!confirmAll}
                      onClick={openPreview}
                      className="mt-5 rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-6 py-3 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {pricingCopy.continueToPreview}
                    </button>
                  </>
                ) : null}
              </section>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-[#E8DFD0]/80 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={step <= 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#E8DFD0] bg-white px-4 py-3 text-sm font-semibold text-[#2C2416] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-h-0 sm:py-2.5"
              >
                {t.app.anterior}
              </button>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-1 sm:flex-row sm:justify-end">
                {step === 9 && !isExistingDashboardListingMode ? (
                  <button
                    type="button"
                    disabled={!confirmAll}
                    onClick={openPreview}
                    className="min-h-[48px] w-full touch-manipulation rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-3 text-sm font-bold text-[#1E1810] shadow-md disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0 sm:py-2.5"
                  >
                    {pricingCopy.continueToPreview}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={step >= total - 1}
                  onClick={() => setStep((s) => Math.min(total - 1, s + 1))}
                  className="min-h-[48px] w-full touch-manipulation rounded-xl border border-[#C9B46A]/60 bg-[#FFF6E7] px-4 py-3 text-sm font-semibold text-[#6E5418] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:w-auto sm:py-2.5"
                >
                  {t.app.siguiente}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
