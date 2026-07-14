"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { publishLeonixListingFromBienesRaicesNegocioDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { BienesRaicesNegocioPreviewView } from "@/app/clasificados/bienes-raices/preview/BienesRaicesNegocioPreviewView";
import { BR_PUBLICAR_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { mapNegocioFormStateToBrNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/brNegocioInputToPreviewMap";
import {
  loadBienesRaicesNegocioPreviewDraft,
  readBienesRaicesNegocioPreviewDraftRaw,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/utils/bienesRaicesPreviewDraft";
import {
  clearLeonixPreviewNavSessionFlag,
  markPublishFlowReturningToEdit,
} from "@/app/clasificados/lib/publishFlowLifecycleClient";
import {
  computeBrPropertyInventoryCounts,
  isBrInventoryUpgradeActive,
  type BrNegocioPublishInventoryContext,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  brPropertyInventoryBaseLimitMessage,
  brPropertyInventoryMaxTotalLimitMessage,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import {
  parseBrInventoryAddSearchParams,
  readBrInventoryAddContextFromSession,
  resolveBrInventoryGroupIdForParent,
  writeBrInventoryAddContextToSession,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryAddFlow";
import { fetchBrOwnerInventoryListingRows } from "@/app/clasificados/bienes-raices/lib/fetchBrOwnerInventoryListingsBrowser";
import { fetchBrParentListingMetaBrowser } from "@/app/clasificados/bienes-raices/lib/fetchBrParentListingMetaBrowser";
import { BrNegocioInventoryPublishBridgePanel } from "@/app/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioInventoryPublishBridgePanel";
import {
  type BrNegocioInventoryBridgeView,
} from "@/app/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPostPublishFlow";
import {
  brInventoryPreviewOwnerBanner,
  brLeonixAdIdPlaceholderLine,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { PublishCheckoutCheckpoint } from "@/app/(site)/clasificados/components/PublishCheckoutCheckpoint";
import {
  BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS,
  BR_INVENTORY_PACK_PACKAGE_KEY,
  type PublishCheckpointConfig,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
  validateRevenuePromoForCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { BIENES_RAICES_NEGOCIO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import {
  CHECKOUT_NEWSLETTER_SOURCES,
  captureCheckoutNewsletterSubscriber,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import { publishBrAgenteInventoryBundlePendingRows } from "@/app/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryBundlePendingPublish";

const GRACE_STEP_MS = 200;
const GRACE_TOTAL_MS = 1000;

type Phase = "loading" | "ready" | "recovery";

function bienesNegocioCheckpointConfig(
  lang: "es" | "en",
  childCount: number,
): PublishCheckpointConfig {
  const base = getRevenuePackageDefinition("br_agent_monthly");
  return {
    category: BIENES_RAICES_NEGOCIO_CHECKOUT.category,
    packageKey: BIENES_RAICES_NEGOCIO_CHECKOUT.packageKey,
    lang,
    mode: "checkout",
    pipeline: "negocio",
    childInventoryCount: childCount,
    baseLineItem: {
      labelEn: "Bienes Raices professional",
      labelEs: "Bienes Raíces profesional",
      priceCents: base?.priceCents ?? 39900,
      detailEn: "Professional agent/business profile plus one primary property.",
      detailEs: "Perfil profesional de agente/negocio con una propiedad principal.",
    },
    confirmations: BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS,
    newsletterEligible: true,
    promoEligible: true,
    returnPath: "/clasificados/bienes-raices/preview/negocio",
  };
}

function tryReadPreviewDraftForMap(): BienesRaicesNegocioPreviewVm | null {
  const raw = readBienesRaicesNegocioPreviewDraftRaw();
  if (!raw) return null;
  const draft = loadBienesRaicesNegocioPreviewDraft();
  if (!draft) return null;
  try {
    return mapNegocioFormStateToBrNegocioPreviewVm(draft);
  } catch {
    return null;
  }
}

export default function BienesRaicesNegocioPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );
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

  const [phase, setPhase] = useState<Phase>("loading");
  const [vm, setVm] = useState<BienesRaicesNegocioPreviewVm | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const [parentLeonixAdId, setParentLeonixAdId] = useState<string | null>(null);
  const [bridge, setBridge] = useState<BrNegocioInventoryBridgeView | null>(null);

  useEffect(() => {
    if (inventoryAdd.context) writeBrInventoryAddContextToSession(inventoryAdd.context);
  }, [inventoryAdd.context]);

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

  const handlePromoApply = useCallback(
    async (code: string) => {
      const draft = loadBienesRaicesNegocioPreviewDraft();
      const hasInventory = (draft?.additionalInventoryProperties?.length ?? 0) > 0;
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
    [lang],
  );

  const onCheckout = useCallback(async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
    const st = loadBienesRaicesNegocioPreviewDraft();
    if (!st) return;
    setPublishBusy(true);
    setPublishErr(null);
    setBridge(null);

    try {
      const sb = createSupabaseBrowserClient();
      const { data: auth } = await sb.auth.getUser();
      const ownerId = auth.user?.id;
      const publishInventory: BrNegocioPublishInventoryContext | null = inventoryCtx ? inventoryCtx : { mode: "main" };

      if (ownerId && publishInventory.mode === "add") {
        const rows = await fetchBrOwnerInventoryListingRows(ownerId);
        const upgradeActive = isBrInventoryUpgradeActive();
        const counts = computeBrPropertyInventoryCounts(rows, {
          groupingKey: publishInventory.brInventoryGroupId,
          upgradeActive,
        });
        if (!counts.canAddProperty) {
          setPublishErr(
            counts.atTotalLimit ? brPropertyInventoryMaxTotalLimitMessage(lang) : brPropertyInventoryBaseLimitMessage(lang),
          );
          setPublishBusy(false);
          return;
        }
      }

      const r = await publishLeonixListingFromBienesRaicesNegocioDraft(st, lang, publishInventory, {
        activationMode: "pending_payment",
      });
      setPublishBusy(false);
      if (r.ok) {
        if (r.warnings.length) {
          try {
            sessionStorage.setItem("lx_br_publish_warnings", JSON.stringify(r.warnings));
          } catch {
            /* ignore */
          }
        }

        const childCount = Math.min(4, st.additionalInventoryProperties?.length ?? 0);
        const children =
          childCount > 0
            ? await publishBrAgenteInventoryBundlePendingRows({
                parentListingId: r.listingId,
                parentDraft: st as never,
                childDrafts: st.additionalInventoryProperties,
                lang,
                ownerUserId: ownerId,
              })
            : null;

        if (children && !children.ok) {
          setPublishErr(children.error ?? (lang === "es" ? "No se pudieron preparar las propiedades adicionales." : "Additional properties could not be prepared."));
          return;
        }

        let customerEmail: string | null = null;
        try {
          const { data: auth } = await sb.auth.getUser();
          customerEmail = auth.user?.email ?? null;
        } catch {
          customerEmail = null;
        }

        void captureCheckoutNewsletterSubscriber({
          email: customerEmail,
          lang,
          preferredLanguage: lang,
          source: CHECKOUT_NEWSLETTER_SOURCES.bienesFsbo,
          interests: childCount > 0 ? ["package:br_agent_monthly", "package:br_inventory_pack_monthly"] : ["package:br_agent_monthly"],
          checked: ctx.newsletterOptIn,
        });

        const checkout = await startRevenueCategoryCheckout({
          ...BIENES_RAICES_NEGOCIO_CHECKOUT,
          listingId: r.listingId,
          leonixAdId: r.leonixAdId,
          locale: lang,
          promoCode: ctx.promoCode,
          returnPath: appendLangToPath("/clasificados/bienes-raices/preview/negocio?checkout=cancelled", routeLang),
          ...(childCount > 0 ? { addOns: [{ key: BR_INVENTORY_PACK_PACKAGE_KEY, quantity: 1 }] } : {}),
        });
        if (!checkout.ok) {
          setPublishErr(checkout.userMessage);
          return;
        }
        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
      } else {
        setPublishErr(r.error);
      }
    } catch (e) {
      setPublishBusy(false);
      setPublishErr(e instanceof Error ? e.message : String(e));
    }
  }, [inventoryCtx, lang, routeLang]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    const deadline = Date.now() + GRACE_TOTAL_MS;

    const attempt = () => {
      if (cancelled) return;
      const next = tryReadPreviewDraftForMap();
      if (next) {
        const shell = inventoryCtx
          ? {
              inventoryMode: true,
              parentLeonixAdId,
              leonixAdIdLine: brLeonixAdIdPlaceholderLine(lang),
            }
          : {
              inventoryMode: false,
              parentLeonixAdId: null,
              leonixAdIdLine: brLeonixAdIdPlaceholderLine(lang),
            };
        setVm({ ...next, ownerPreviewShell: shell });
        setPhase("ready");
        clearLeonixPreviewNavSessionFlag();
        return;
      }
      if (Date.now() >= deadline) {
        setPhase("recovery");
        return;
      }
      timeoutId = window.setTimeout(attempt, GRACE_STEP_MS);
    };

    attempt();
    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [retryKey, inventoryCtx, parentLeonixAdId, lang]);

  const currentDraftForCheckout = phase === "ready" ? loadBienesRaicesNegocioPreviewDraft() : null;
  const selectedChildCount = Math.min(4, currentDraftForCheckout?.additionalInventoryProperties?.length ?? 0);
  const checkpointConfig = bienesNegocioCheckpointConfig(lang, selectedChildCount);

  return (
    <>
      {phase === "loading" ? (
        <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
          Cargando vista previa…
        </div>
      ) : phase === "ready" && vm != null ? (
        <LeonixPreviewPageShell
          editHref={BR_PUBLICAR_NEGOCIO}
          onBeforeNavigateToEdit={markPublishFlowReturningToEdit}
        >
          {inventoryCtx ? (
            <div className="mx-auto mb-4 max-w-[1240px] rounded-xl border border-[#C9B46A]/40 bg-[#FFF6E7] px-4 py-3 text-sm text-[#2C2416]">
              <p className="font-bold text-[#6E5418]">{brInventoryPreviewOwnerBanner(lang, parentLeonixAdId).title}</p>
              {brInventoryPreviewOwnerBanner(lang, parentLeonixAdId).connected ? (
                <p className="mt-1 text-[#5C5346]">{brInventoryPreviewOwnerBanner(lang, parentLeonixAdId).connected}</p>
              ) : null}
              {vm.ownerPreviewShell?.leonixAdIdLine ? (
                <p className="mt-1 font-mono text-xs text-[#7A7164]">{vm.ownerPreviewShell.leonixAdIdLine}</p>
              ) : null}
            </div>
          ) : vm.ownerPreviewShell?.leonixAdIdLine ? (
            <p className="mx-auto mb-3 max-w-[1240px] font-mono text-xs text-[#7A7164]">{vm.ownerPreviewShell.leonixAdIdLine}</p>
          ) : null}
          {bridge ? (
            <div className="mx-auto mb-4 max-w-[1240px]">
              <BrNegocioInventoryPublishBridgePanel
                lang={lang}
                mode={bridge.mode}
                remainingCount={bridge.remainingCount}
                mainListingHref={bridge.mainListingHref}
                childListingHref={bridge.childListingHref}
              />
            </div>
          ) : null}
          <BienesRaicesNegocioPreviewView vm={vm} lang={lang} />
          <div className="mx-auto mt-8 max-w-3xl px-4 pb-10 sm:px-6">
            <PublishCheckoutCheckpoint
              config={checkpointConfig}
              lang={lang}
              busy={publishBusy}
              errorMessage={publishErr}
              draftReady={true}
              onPromoApply={handlePromoApply}
              onCheckout={(ctx) => void onCheckout(ctx)}
              editHref={BR_PUBLICAR_NEGOCIO}
              rulesModal={{
                titleEn: "Leonix real estate publishing rules",
                titleEs: "Reglas de publicación de bienes raíces en Leonix",
                bulletsEn: [
                  "Agent, business, license, contact, and property information must be accurate and current.",
                  "You must be authorized to publish every selected property, image, price, and detail.",
                  "The inventory package allows up to four additional properties only after paid entitlement.",
                  "Payment is required before the profile and selected properties become active.",
                ],
                bulletsEs: [
                  "La información del agente, negocio, licencia, contacto y propiedades debe ser correcta y actual.",
                  "Debes tener autorización para publicar cada propiedad, imagen, precio y detalle seleccionado.",
                  "El paquete de inventario permite hasta cuatro propiedades adicionales solo con entitlement pagado.",
                  "El pago es requerido antes de activar el perfil y las propiedades seleccionadas.",
                ],
              }}
            />
          </div>
        </LeonixPreviewPageShell>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F9F6F1] px-4 text-[#2C2416]">
          <div className="max-w-md rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-6 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#B8954A]">Vista previa</p>
            <p className="mt-2 text-sm text-[#5C5346]">
              No pudimos cargar el borrador de vista previa todavía. Puedes reintentar o volver al formulario para seguir
              editando.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-[#C9A85A] to-[#B8954A] px-5 py-2.5 text-sm font-bold text-[#1E1810] shadow-md hover:opacity-95"
                onClick={() => {
                  setVm(null);
                  setPhase("loading");
                  setRetryKey((k) => k + 1);
                }}
              >
                Reintentar cargar vista previa
              </button>
              <Link
                href={BR_PUBLICAR_NEGOCIO}
                className="rounded-xl border border-[#E8DFD0] bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#2C2416] hover:bg-[#FFFCF7]"
                prefetch={false}
                onClick={() => {
                  markPublishFlowReturningToEdit();
                }}
              >
                Volver a editar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
