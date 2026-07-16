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
  BR_INVENTORY_PACK_PACKAGE_KEY,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutLoadingMessage,
  startRevenueCategoryCheckout,
  validateRevenuePromoForCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
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
import {
  ensureBrAgenteResApplicationInstanceId,
  withBrAgenteResApplicationInstanceParam,
} from "../application/utils/previewDraft";
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
import { publishBrAgenteInventoryBundlePendingRows } from "../../application/brNegocioInventoryBundlePendingPublish";
import {
  bienesBackToEditHrefFromPreview,
  hydrateBienesListingForDashboardEdit,
} from "@/app/(site)/dashboard/lib/bienesDashboardInventoryAddonCheckout";

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
  const previewListingParam = searchParams?.get("preview") === "listing";
  const dashboardSource = searchParams?.get("source") === "dashboard";
  const listingIdParam = searchParams?.get("listingId")?.trim() ?? "";
  const listingSlugParam = searchParams?.get("listingSlug")?.trim() ?? "";
  const leonixAdIdParam = searchParams?.get("leonixAdId")?.trim() ?? "";
  const previewMode = searchParams?.get("mode") ?? "";
  const previewFocus = searchParams?.get("focus") === "inventory-pack" ? "inventory-pack" : null;
  const applicationInstanceId = useMemo(
    () => ensureBrAgenteResApplicationInstanceId(searchParams),
    [searchParams],
  );
  const listingBoundPreview =
    previewListingParam || (dashboardSource && Boolean(listingIdParam || listingSlugParam || leonixAdIdParam));
  const backToEditMode: "listing-edit" | "inventory-edit" | "inventory-addon" =
    previewMode === "inventory-edit" || previewMode === "inventory-addon" ? previewMode : "listing-edit";
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
  const [saveEditBusy, setSaveEditBusy] = useState(false);
  const [saveEditMessage, setSaveEditMessage] = useState<string | null>(null);
  const [parentLeonixAdId, setParentLeonixAdId] = useState<string | null>(null);
  const [bridge, setBridge] = useState<BrNegocioInventoryBridgeView | null>(null);
  const [childPreviewId, setChildPreviewId] = useState<string | null>(null);

  useEffect(() => {
    if (inventoryAdd.context) writeBrInventoryAddContextToSession(inventoryAdd.context);
  }, [inventoryAdd.context]);

  useEffect(() => {
    if (listingBoundPreview && listingIdParam) {
      void hydrateBienesListingForDashboardEdit({ listingId: listingIdParam, lang }).then((result) => {
        if (!result.ok) return;
        void loadAgenteResPreviewDraftResolved({ applicationInstanceId }).then((loaded) => {
          if (loaded) setData(loaded);
        });
      });
      return;
    }
    void loadAgenteResPreviewDraftResolved({ applicationInstanceId }).then((loaded) => {
      if (loaded) setData(loaded);
    });
  }, [applicationInstanceId, lang, listingBoundPreview, listingIdParam]);

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
    if (listingBoundPreview && (listingIdParam || listingSlugParam || leonixAdIdParam)) {
      return bienesBackToEditHrefFromPreview({
        lang,
        listingId: listingIdParam || null,
        listingSlug: listingSlugParam || null,
        leonixAdId: leonixAdIdParam || null,
        mode: backToEditMode,
        focus: previewFocus,
        categoriaPropiedad: data.categoriaPropiedad,
      });
    }
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
    return withBrAgenteResLangParam(
      withBrAgenteResApplicationInstanceParam(`${BR_PUBLICAR_NEGOCIO}?${qs.toString()}`, applicationInstanceId),
      lang,
    );
  }, [
    backToEditMode,
    applicationInstanceId,
    data.categoriaPropiedad,
    inventoryAdd.context,
    inventoryAdd.inventoryModeAdd,
    lang,
    leonixAdIdParam,
    listingBoundPreview,
    listingIdParam,
    listingSlugParam,
    previewFocus,
  ]);

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

  const onPublishLive = useCallback(async (ctx?: { newsletterOptIn?: boolean; promoCode?: string | null }) => {
    if (listingBoundPreview) {
      setPublishErr(
        lang === "es"
          ? "Para actualizar un anuncio publicado, vuelve a editar y guarda los cambios desde el formulario."
          : "To update a published listing, go back to edit and save changes from the application form.",
      );
      return;
    }
    const st = (await loadAgenteResPreviewDraftResolved({ applicationInstanceId })) ?? data;
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

      if (!r.ok) {
        setPublishBusy(false);
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

        const childDrafts = st.additionalInventoryProperties ?? [];
        let bundleCreatedCount = 0;
        if (childDrafts.length > 0) {
          const bundle = await publishBrAgenteInventoryBundlePendingRows({
            parentListingId: r.listingId,
            parentGroupId: r.listingId,
            parentDraft: st,
            childDrafts,
            lang,
            ownerUserId: ownerId ?? null,
          });
          bundleCreatedCount = bundle.createdChildren.length;
          const mergedWarnings = [...r.warnings, ...bundle.warnings];
          if (mergedWarnings.length) {
            try {
              sessionStorage.setItem("lx_br_publish_warnings", JSON.stringify(mergedWarnings));
            } catch {
              /* ignore */
            }
          }
          if (bundle.error && bundleCreatedCount < childDrafts.length) {
            setPublishErr(bundle.error);
          }
        }

        if (ctx?.newsletterOptIn && auth.user?.email) {
          void captureCheckoutNewsletterSubscriber({
            email: auth.user.email,
            lang,
            preferredLanguage: lang,
            source: CHECKOUT_NEWSLETTER_SOURCES.bienesFsbo,
            interests: bundleCreatedCount > 0
              ? ["package:br_agent_monthly", "package:br_inventory_pack_monthly"]
              : ["package:br_agent_monthly"],
            checked: true,
          });
        }

        const checkout = await startRevenueCategoryCheckout({
          ...BIENES_RAICES_NEGOCIO_CHECKOUT,
          listingId: r.listingId,
          leonixAdId: r.leonixAdId?.trim() || leonixAdId,
          locale: lang,
          promoCode: ctx?.promoCode ?? null,
          returnPath: withBrAgenteResLangParam("/clasificados/publicar/bienes-raices/negocio/agente-individual/preview?checkout=cancelled", lang),
          ...(bundleCreatedCount > 0 ? { addOns: [{ key: BR_INVENTORY_PACK_PACKAGE_KEY, quantity: 1 }] } : {}),
        });
        if (!checkout.ok) {
          setPublishBusy(false);
          setPublishErr(checkout.userMessage);
          return;
        }
        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
        return;
      }

      setPublishBusy(false);

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
  }, [applicationInstanceId, data, inventoryCtx, lang, router]);

  const onSaveListingEdit = useCallback(async () => {
    if (!listingBoundPreview || !listingIdParam || saveEditBusy) return;
    setSaveEditBusy(true);
    setPublishErr(null);
    setSaveEditMessage(null);
    try {
      const sb = createSupabaseBrowserClient();
      const { data: auth } = await sb.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) {
        setPublishErr(lang === "es" ? "Inicia sesión para guardar." : "Sign in required.");
        return;
      }
      const res = await fetch("/api/clasificados/bienes-raices/listing-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          listingId: listingIdParam,
          leonixAdId: leonixAdIdParam || null,
          lang,
          draft: data,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setPublishErr(json.message ?? (lang === "es" ? "No se pudieron guardar los cambios." : "Could not save changes."));
        return;
      }
      setSaveEditMessage(lang === "es" ? "Cambios guardados" : "Changes saved");
    } catch (e) {
      setPublishErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaveEditBusy(false);
    }
  }, [data, lang, leonixAdIdParam, listingBoundPreview, listingIdParam, saveEditBusy]);

  const handlePromoApply = useCallback(
    async (code: string) => {
      const hasInventory = childInventoryCount > 0;
      const addOns = hasInventory ? [{ key: BR_INVENTORY_PACK_PACKAGE_KEY, quantity: 1 }] : undefined;
      const subtotalCents =
        (getRevenuePackageDefinition("br_agent_monthly")?.priceCents ?? 39900) +
        (hasInventory ? getRevenuePackageDefinition(BR_INVENTORY_PACK_PACKAGE_KEY)?.priceCents ?? 9900 : 0);
      const result = await validateRevenuePromoForCheckout({
        code,
        category: BIENES_RAICES_NEGOCIO_CHECKOUT.category,
        packageKey: BIENES_RAICES_NEGOCIO_CHECKOUT.packageKey,
        subtotalCents,
        addOns,
        locale: lang,
      });
      if (!result.ok) return { ok: false, message: result.userMessage };
      return {
        ok: true,
        discountCents: result.discountCents,
        message:
          lang === "es"
            ? `${result.discountLabel} aplicado. Total: $${(result.totalCents / 100).toFixed(2)}`
            : `${result.discountLabel} applied. Total: $${(result.totalCents / 100).toFixed(2)}`,
      };
    },
    [childInventoryCount, lang],
  );

  const onPublishNextFromBridge = useCallback(() => {
    const href = navigateToNextQueuedChild();
    if (href) router.push(appendLangToPath(href, lang));
  }, [lang, router]);

  const inventoryBanner = inventoryCtx ? brInventoryPreviewOwnerBanner(lang, parentLeonixAdId) : null;
  const childPreviewDraft = useMemo(
    () => (childPreviewId ? data.additionalInventoryProperties.find((x) => x.id === childPreviewId) ?? null : null),
    [childPreviewId, data.additionalInventoryProperties],
  );

  const showPaymentCheckpoint = Boolean(checkpointConfig) && !listingBoundPreview;

  return (
    <div className="min-h-screen bg-[#F9F6F1]">
      <div className="sticky top-0 z-40 border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#B8954A]">
            {listingBoundPreview
              ? lang === "es"
                ? "Vista previa · Edición"
                : "Preview · Edit"
              : lang === "es"
                ? "Vista previa · Publicar"
                : "Preview · Publish"}
          </p>
          <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
            {listingBoundPreview ? (
              <button type="button" className={PUBLISH_BTN} disabled={saveEditBusy} onClick={() => void onSaveListingEdit()}>
                {saveEditBusy
                  ? lang === "es"
                    ? "Guardando cambios…"
                    : "Saving changes…"
                  : lang === "es"
                    ? "Guardar cambios"
                    : "Save changes"}
              </button>
            ) : showPaymentCheckpoint ? (
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
            {saveEditMessage ? (
              <p className="max-w-[320px] text-right text-[11px] font-semibold text-emerald-700" role="status">
                {saveEditMessage}
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
            onPromoApply={handlePromoApply}
            onCheckout={(ctx) => void onPublishLive(ctx)}
            editHref={editHref}
            rulesModal={{
              titleEn: "Leonix real estate publishing rules",
              titleEs: "Reglas de publicación de bienes raíces en Leonix",
              bulletsEn: [
                "Agent, business, license, contact, and property information must be truthful and current.",
                "You must be authorized to publish every selected property, photo, price, and detail.",
                "The inventory package allows up to four additional properties only after paid entitlement.",
                "Payment is required before the profile and selected properties become active.",
              ],
              bulletsEs: [
                "La información del agente, negocio, licencia, contacto y propiedades debe ser verdadera y actual.",
                "Debes tener autorización para publicar cada propiedad, foto, precio y detalle seleccionado.",
                "El paquete de inventario permite hasta cuatro propiedades adicionales solo con entitlement pagado.",
                "El pago es requerido antes de activar el perfil y las propiedades seleccionadas.",
              ],
            }}
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
