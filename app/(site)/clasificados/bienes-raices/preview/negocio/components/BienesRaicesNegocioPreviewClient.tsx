"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { leonixLiveAnuncioPath } from "@/app/clasificados/lib/leonixRealEstateListingContract";
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
  brPropertyInventoryAddToInventoryCtaLabel,
  brPropertyInventoryBaseLimitMessage,
  brPropertyInventoryMaxTotalLimitMessage,
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
import {
  brInventoryPreviewOwnerBanner,
  brLeonixAdIdPlaceholderLine,
} from "@/app/clasificados/lib/leonixBrPropertyInventoryCopy";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";

const GRACE_STEP_MS = 200;
const GRACE_TOTAL_MS = 1000;

const PUBLISH_BTN =
  "inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-full bg-[#1E1810] px-5 py-2.5 text-center text-[11px] font-bold uppercase leading-snug tracking-wide text-[#F9F6F1] hover:bg-[#2C2416] disabled:opacity-50 sm:min-h-[40px] sm:w-auto sm:py-2";

type Phase = "loading" | "ready" | "recovery";

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
  const lang = searchParams?.get("lang") === "en" ? "en" : "es";
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

  const onPublishLive = useCallback(async () => {
    const st = loadBienesRaicesNegocioPreviewDraft();
    if (!st) return;
    setPublishBusy(true);
    setPublishErr(null);

    try {
      const sb = createSupabaseBrowserClient();
      const { data: auth } = await sb.auth.getUser();
      const ownerId = auth.user?.id;
      const publishInventory: BrNegocioPublishInventoryContext | null = inventoryCtx
        ? inventoryCtx
        : { mode: "main" };

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

      const r = await publishLeonixListingFromBienesRaicesNegocioDraft(st, lang, publishInventory);
      setPublishBusy(false);
      if (r.ok) {
        if (r.warnings.length) {
          try {
            sessionStorage.setItem("lx_br_publish_warnings", JSON.stringify(r.warnings));
          } catch {
            /* ignore */
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
        } else {
          router.push(appendLangToPath(leonixLiveAnuncioPath(r.listingId), lang));
        }
      } else {
        setPublishErr(r.error);
      }
    } catch (e) {
      setPublishBusy(false);
      setPublishErr(e instanceof Error ? e.message : String(e));
    }
  }, [inventoryCtx, lang, router]);

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

  const publishLabel = inventoryCtx
    ? brPropertyInventoryAddToInventoryCtaLabel(lang)
    : lang === "es"
      ? "Publicar anuncio"
      : "Publish listing";

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
          publishSlot={
            <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
              <button type="button" className={PUBLISH_BTN} disabled={publishBusy} onClick={() => void onPublishLive()}>
                {publishBusy ? (lang === "es" ? "Publicando…" : "Publishing…") : publishLabel}
              </button>
              {publishErr ? (
                <p className="max-w-[280px] text-right text-[11px] text-red-700" role="alert">
                  {publishErr}
                </p>
              ) : null}
            </div>
          }
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
          <BienesRaicesNegocioPreviewView vm={vm} lang={lang} />
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
