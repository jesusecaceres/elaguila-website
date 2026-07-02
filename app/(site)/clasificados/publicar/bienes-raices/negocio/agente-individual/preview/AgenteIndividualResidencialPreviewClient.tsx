"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { publishLeonixListingFromAgenteResidencialDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import { brPublishPaymentRequired } from "@/app/lib/clasificados/bienes-raices/brPublishPaymentPolicy";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import {
  BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutLoadingMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { BIENES_RAICES_NEGOCIO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  computeBrPropertyInventoryCounts,
  isBrInventoryUpgradeActive,
  type BrNegocioPublishInventoryContext,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brPropertyInventoryAddToInventoryCtaLabel,
  brPropertyInventoryBaseLimitMessage,
  brPropertyInventoryMaxTotalLimitMessage,
  brInventoryPreviewOwnerBanner,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import {
  clearBrInventoryAddContextFromSession,
  parseBrInventoryAddSearchParams,
  readBrInventoryAddContextFromSession,
  resolveBrInventoryAddReturnHref,
  resolveBrInventoryGroupIdForParent,
  writeBrInventoryAddContextToSession,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import { fetchBrOwnerInventoryListingRows } from "@/app/clasificados/bienes-raices/lib/fetchBrOwnerInventoryListingsBrowser";
import { fetchBrParentListingMetaBrowser } from "@/app/clasificados/bienes-raices/lib/fetchBrParentListingMetaBrowser";
import { markPublishFlowReturningToEdit } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { loadAgenteResPreviewDraftResolved } from "../application/utils/previewDraft";
import { createEmptyAgenteIndividualResidencialState } from "../schema/agenteIndividualResidencialFormState";
import type { AgenteIndividualResidencialFormState } from "../schema/agenteIndividualResidencialFormState";
import { AgenteIndividualResidencialPreviewPage } from "./AgenteIndividualResidencialPreviewPage";
import { useBrAgenteResidencialCopy } from "../application/BrAgenteResidencialLocaleContext";
import { withBrAgenteResLangParam } from "../application/brAgenteResidencialLang";
import { mapAgenteFormToMainInventoryCard } from "../../application/brNegocioInventoryCardModel";
import { BrNegocioPrePublishInventoryPreview } from "../../application/sections/shared/BrNegocioPrePublishInventoryPreview";
import { BrNegocioChildInventoryFullPreviewOverlay } from "../../application/sections/shared/BrNegocioChildInventoryFullPreviewOverlay";
import { BrNegocioInventoryPublishBridgePanel } from "../../application/sections/shared/BrNegocioInventoryPublishBridgePanel";
import {
  handleMainPublishWithOptionalQueue,
  handleQueuedChildPublishSuccess,
  isQueueDrivenChildPublish,
  navigateToNextQueuedChild,
  type BrNegocioInventoryBridgeView,
} from "../../application/brNegocioInventoryPostPublishFlow";

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

export default function AgenteIndividualResidencialPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useBrAgenteResidencialCopy();
  const inventoryAdd = useMemo(
    () => parseBrInventoryAddSearchParams(searchParams ?? new URLSearchParams()),
    [searchParams],
  );
  const inventoryCtx = useMemo(() => {
    const ctx = inventoryAdd.context ?? readBrInventoryAddContextFromSession();
    if (!ctx) return null;
    const groupId = resolveBrInventoryGroupIdForParent(
      { id: ctx.parentListingId, br_inventory_group_id: ctx.brInventoryGroupId },
      ctx.brInventoryGroupId,
    );
    return {
      mode: "add" as const,
      parentListingId: ctx.parentListingId,
      brInventoryGroupId: groupId,
    } satisfies BrNegocioPublishInventoryContext;
  }, [inventoryAdd.context]);

  const [data, setData] = useState<AgenteIndividualResidencialFormState>(createEmptyAgenteIndividualResidencialState);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [parentLeonixAdId, setParentLeonixAdId] = useState<string | null>(null);
  const [bridge, setBridge] = useState<BrNegocioInventoryBridgeView | null>(null);
  const [childPreviewId, setChildPreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (inventoryAdd.context) writeBrInventoryAddContextToSession(inventoryAdd.context);
  }, [inventoryAdd.context]);

  useEffect(() => {
    void loadAgenteResPreviewDraftResolved().then((loaded) => {
      if (loaded) setData(loaded);
    });
  }, []);

  useEffect(() => {
    const parentId = inventoryCtx?.parentListingId;
    if (!parentId) {
      setParentLeonixAdId(null);
      return;
    }
    let cancelled = false;
    void fetchBrParentListingMetaBrowser(parentId).then((meta) => {
      if (!cancelled) setParentLeonixAdId(meta?.leonix_ad_id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [inventoryCtx?.parentListingId]);

  const editHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set(BR_NEGOCIO_Q_PROPIEDAD, data.categoriaPropiedad);
    if (inventoryAdd.inventoryModeAdd && inventoryAdd.context) {
      qs.set("inventoryMode", "add");
      qs.set("parentListingId", inventoryAdd.context.parentListingId);
      if (inventoryAdd.context.returnToListingId?.trim()) {
        qs.set("returnToListingId", inventoryAdd.context.returnToListingId.trim());
      }
      if (inventoryAdd.context.brInventoryGroupId?.trim()) {
        qs.set("inventoryGroupId", inventoryAdd.context.brInventoryGroupId.trim());
      }
    }
    return withBrAgenteResLangParam(`${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`, lang);
  }, [data.categoriaPropiedad, inventoryAdd.context, inventoryAdd.inventoryModeAdd, lang]);

  const needsNegocioPayment = !inventoryCtx && brPublishPaymentRequired("negocio");

  const publishLabel = inventoryCtx
    ? brPropertyInventoryAddToInventoryCtaLabel(lang)
    : needsNegocioPayment
      ? lang === "es"
        ? "Continuar al pago seguro"
        : "Continue to secure payment"
      : lang === "es"
        ? "Publicar anuncio"
        : "Publish listing";

  const childInventoryCount = data.additionalInventoryProperties?.length ?? 0;
  const hasInventoryPackage = childInventoryCount > 0 && !inventoryCtx;

  const checkpointConfig = useMemo((): PublishCheckpointConfig | null => {
    if (inventoryCtx || !needsNegocioPayment) return null;
    return {
      category: BIENES_RAICES_NEGOCIO_CHECKOUT.category,
      packageKey: BIENES_RAICES_NEGOCIO_CHECKOUT.packageKey,
      lang,
      mode: "checkout",
      childInventoryCount,
      confirmations: BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS,
      newsletterEligible: true,
      promoEligible: true,
      returnPath: BIENES_RAICES_NEGOCIO_CHECKOUT.returnPath,
    };
  }, [childInventoryCount, inventoryCtx, lang, needsNegocioPayment]);

  const onPublishLive = useCallback(async () => {
    const st = (await loadAgenteResPreviewDraftResolved()) ?? data;
    if (!st) return;
    setPublishBusy(true);
    setPublishErr(null);
    setBridge(null);

    try {
      const sb = createSupabaseBrowserClient();
      const { data: auth } = await sb.auth.getUser();
      const ownerId = auth.user?.id;
      const publishInventory: BrNegocioPublishInventoryContext | null = inventoryCtx ?? { mode: "main" };

      if (ownerId && publishInventory.mode === "add") {
        const rows = await fetchBrOwnerInventoryListingRows(ownerId);
        const upgradeActive = isBrInventoryUpgradeActive();
        const counts = computeBrPropertyInventoryCounts(rows, {
          groupingKey: publishInventory.brInventoryGroupId,
          upgradeActive,
        });
        if (!counts.canAddProperty) {
          setPublishErr(
            counts.atTotalLimit
              ? brPropertyInventoryMaxTotalLimitMessage(lang)
              : brPropertyInventoryBaseLimitMessage(lang),
          );
          setPublishBusy(false);
          return;
        }
      }

      const isInventoryAdd = publishInventory.mode === "add";
      const needsPayment = !isInventoryAdd && brPublishPaymentRequired("negocio");
      const r = await publishLeonixListingFromAgenteResidencialDraft(st, lang, publishInventory, {
        activationMode: needsPayment ? "pending_payment" : "immediate",
      });
      setPublishBusy(false);

      if (!r.ok) {
        setPublishErr(r.error);
        return;
      }

      if (r.pendingPayment && needsPayment) {
        let leonixAdId: string | null = null;
        try {
          const { data: adRow } = await sb
            .from("listings")
            .select("leonix_ad_id")
            .eq("id", r.listingId)
            .maybeSingle();
          leonixAdId = (adRow as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
        } catch {
          /* optional metadata */
        }

        const checkout = await startRevenueCategoryCheckout({
          ...BIENES_RAICES_NEGOCIO_CHECKOUT,
          listingId: r.listingId,
          leonixAdId,
          locale: lang,
        });
        if (!checkout.ok) {
          setPublishErr(checkout.userMessage);
          return;
        }
        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
        return;
      }

      if (r.warnings.length) {
        try {
          sessionStorage.setItem("lx_br_publish_warnings", JSON.stringify(r.warnings));
        } catch {
          /* ignore */
        }
      }

      if (isQueueDrivenChildPublish(inventoryCtx)) {
        const bridgeView = handleQueuedChildPublishSuccess(r.listingId, lang);
        if (bridgeView) {
          setBridge(bridgeView);
          return;
        }
      }

      if (inventoryCtx) {
        clearBrInventoryAddContextFromSession();
        router.push(
          appendLangToPath(
            resolveBrInventoryAddReturnHref({ returnToListingId: inventoryCtx.parentListingId, lang }),
            lang,
          ),
        );
        return;
      }

      const queueBridge = handleMainPublishWithOptionalQueue({
        listingId: r.listingId,
        lang,
        formKind: "agente",
        additionalItems: st.additionalInventoryProperties,
        inheritedAgenteSnapshot: st,
      });
      if (queueBridge) {
        setBridge(queueBridge);
        return;
      }

      router.push(appendLangToPath(leonixLiveAnuncioPath(r.listingId), lang));
    } catch (e) {
      setPublishBusy(false);
      setPublishErr(e instanceof Error ? e.message : String(e));
    }
  }, [data, inventoryCtx, lang, router]);

  const onPublishNextFromBridge = useCallback(() => {
    const href = navigateToNextQueuedChild();
    if (href) router.push(appendLangToPath(href, lang));
  }, [lang, router]);

  const inventoryBanner = inventoryCtx ? brInventoryPreviewOwnerBanner(lang, parentLeonixAdId) : null;
  const childPreviewDraft = useMemo(
    () => (childPreviewId ? data.additionalInventoryProperties.find((x) => x.id === childPreviewId) ?? null : null),
    [childPreviewId, data.additionalInventoryProperties],
  );

  const showPaymentCheckpoint = Boolean(checkpointConfig);

  return (
    <div className="min-h-screen bg-[#F9F6F1]">
      <div className="sticky top-0 z-40 border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#B8954A]">
            {lang === "es" ? "Vista previa · Publicar" : "Preview · Publish"}
          </p>
          <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
            {showPaymentCheckpoint ? (
              <button
                type="button"
                className={PUBLISH_BTN}
                onClick={() => {
                  document.getElementById("publish-checkout-checkpoint")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {lang === "es" ? "Ir al pago final" : "Go to final checkout"}
              </button>
            ) : (
              <button type="button" className={PUBLISH_BTN} disabled={publishBusy} onClick={() => void onPublishLive()}>
                {publishBusy
                  ? needsNegocioPayment
                    ? revenueCategoryCheckoutLoadingMessage(lang)
                    : lang === "es"
                      ? "Publicando…"
                      : "Publishing…"
                  : publishLabel}
              </button>
            )}
            {!showPaymentCheckpoint && publishErr ? (
              <p className="max-w-[320px] text-right text-[11px] text-red-700" role="alert">
                {publishErr}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {inventoryBanner ? (
        <div className="mx-auto max-w-[1140px] px-4 pt-3 sm:px-6">
          <div className="rounded-xl border border-[#C9B46A]/40 bg-[#FFF6E7] px-4 py-3 text-sm text-[#2C2416]">
            <p className="font-bold text-[#6E5418]">{inventoryBanner.title}</p>
            {inventoryBanner.connected ? (
              <p className="mt-1 text-[#5C5346]">{inventoryBanner.connected}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {bridge ? (
        <div className="mx-auto max-w-[1140px] px-4 pt-3 sm:px-6">
          <BrNegocioInventoryPublishBridgePanel
            lang={lang}
            mode={bridge.mode}
            remainingCount={bridge.remainingCount}
            mainListingHref={bridge.mainListingHref}
            childListingHref={bridge.childListingHref}
            onPublishNext={bridge.remainingCount > 0 ? onPublishNextFromBridge : undefined}
          />
        </div>
      ) : null}

      <AgenteIndividualResidencialPreviewPage
        data={data}
        editHref={editHref}
        footerExtra={t.previewUi.footerDefault}
        onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
      />

      {hasInventoryPackage ? (
        <div className="mx-auto max-w-[1140px] px-4 pb-4 sm:px-6">
          <BrNegocioPrePublishInventoryPreview
            lang={lang}
            variant="package"
            mainProperty={mapAgenteFormToMainInventoryCard(data, lang)}
            items={data.additionalInventoryProperties}
            onPreview={(id) => setChildPreviewId(id)}
          />
        </div>
      ) : null}

      {checkpointConfig ? (
        <div className="mx-auto max-w-[1140px] px-4 pb-10 sm:px-6">
          <PublishCheckoutCheckpoint
            config={checkpointConfig}
            lang={lang}
            busy={publishBusy}
            errorMessage={publishErr}
            onCheckout={() => void onPublishLive()}
          />
        </div>
      ) : null}

      {childPreviewDraft ? (
        <BrNegocioChildInventoryFullPreviewOverlay
          open
          onClose={() => setChildPreviewId(null)}
          lang={lang}
          parentHubSnapshot={data}
          childDraft={childPreviewDraft}
          parentFullState={data}
        />
      ) : null}
    </div>
  );
}
