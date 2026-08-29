"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { publishLeonixListingFromBienesRaicesPrivadoDraft } from "@/app/clasificados/lib/leonixPublishRealEstateFromDraftState";
import { useLeonixPublishFlowExitClear } from "@/app/clasificados/lib/leonixApplicationStandard/useLeonixPublishFlowExitClear";
import { clearLeonixPreviewNavSessionFlag } from "@/app/clasificados/lib/publishFlowLifecycleClient";
import { BrPrivadoPreviewResultCardSection } from "./BrPrivadoPreviewResultCardSection";
import { buildBrResultCardPreviewListing } from "../model/buildBrResultCardPreviewListing";
import { PublishCheckoutCheckpoint } from "@/app/clasificados/components/PublishCheckoutCheckpoint";
import {
  previewModeSuppressesBasePlanCheckout,
  resolvePreviewMode,
} from "@/app/lib/listingIdentity/previewModeContract";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  coerceBrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { BIENES_RAICES_FSBO_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  captureCheckoutNewsletterSubscriber,
  CHECKOUT_NEWSLETTER_SOURCES,
} from "@/app/lib/newsletter/checkoutNewsletterCapture";
import {
  BR_PREVIEW_PRIVADO,
  BR_PUBLICAR_PRIVADO,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { mapBienesRaicesPrivadoStateToPreviewVm } from "@/app/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm";
import {
  clearBienesRaicesPrivadoDraft,
  loadBienesRaicesPrivadoDraft,
} from "@/app/clasificados/publicar/bienes-raices/privado/application/utils/bienesRaicesPrivadoDraft";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import { LeonixPreviewPageShell } from "@/app/clasificados/lib/preview/LeonixPreviewPageShell";
import { BienesRaicesPrivadoPreviewView } from "../BienesRaicesPrivadoPreviewView";
import {
  applyBienesRaicesFsboPreviewPromoCode,
  bienesRaicesFsboPreviewCheckpointConfig,
  BIENES_RAICES_FSBO_NEWSLETTER_INTERESTS,
  BIENES_RAICES_FSBO_PACKAGE_KEY,
  BIENES_RAICES_FSBO_PREVIEW_RULES_MODAL,
} from "../lib/bienesRaicesFsboPreviewPaidCheckout";

type Phase = "loading" | "ready" | "recovery";

const BR_FSBO_PENDING_CHECKOUT_KEY = "br-fsbo-pending-checkout-listing-v1";

function readCachedPendingListingId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BR_FSBO_PENDING_CHECKOUT_KEY);
    const id = raw?.trim();
    return id || null;
  } catch {
    return null;
  }
}

function writeCachedPendingListingId(listingId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BR_FSBO_PENDING_CHECKOUT_KEY, listingId);
  } catch {
    /* ignore */
  }
}

function clearCachedPendingListingId(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BR_FSBO_PENDING_CHECKOUT_KEY);
  } catch {
    /* ignore */
  }
}

export default function BienesRaicesPrivadoPreviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suspendExitClearRef = useRef(false);

  useLayoutEffect(() => {
    clearLeonixPreviewNavSessionFlag();
  }, []);

  const isPathInsideFlow = useCallback((p: string) => {
    return (
      p.startsWith(BR_PUBLICAR_PRIVADO) ||
      p.startsWith(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY) ||
      p.startsWith(BR_PREVIEW_PRIVADO)
    );
  }, []);

  useLeonixPublishFlowExitClear({
    getSuspend: () => suspendExitClearRef.current,
    isPathInsideFlow,
    onClear: () => {
      clearBienesRaicesPrivadoDraft();
    },
  });
  const urlCategoria = useMemo(
    () => coerceBrNegocioCategoriaPropiedad(searchParams?.get(BR_NEGOCIO_Q_PROPIEDAD) ?? null),
    [searchParams],
  );

  const [phase, setPhase] = useState<Phase>("loading");
  const [draft, setDraft] = useState<BienesRaicesPrivadoFormState | null>(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishErr, setPublishErr] = useState<string | null>(null);
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(searchParams?.get("lang")),
    [searchParams],
  );

  const validateCachedPendingListing = useCallback(async (): Promise<{
    listingId: string;
    leonixAdId: string | null;
  } | null> => {
    const listingId = readCachedPendingListingId();
    if (!listingId) return null;
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: row } = await supabase
        .from("listings")
        .select("id, category, status, is_published, leonix_ad_id, listing_json")
        .eq("id", listingId)
        .maybeSingle();
      const rec = row as
        | {
            id?: string | null;
            category?: string | null;
            status?: string | null;
            is_published?: boolean | null;
            leonix_ad_id?: string | null;
            listing_json?: { br_publish?: { lane?: string; payment_status?: string } } | null;
          }
        | null;
      const br = rec?.listing_json?.br_publish;
      const recId = rec?.id?.trim() || "";
      if (!rec || !recId) {
        clearCachedPendingListingId();
        return null;
      }
      const valid =
        String(rec.category ?? "").toLowerCase() === BIENES_RAICES_FSBO_CHECKOUT.category &&
        String(rec.status ?? "").toLowerCase() === "pending" &&
        rec.is_published === false &&
        br?.lane === "privado" &&
        br?.payment_status === "pending";
      if (!valid) {
        clearCachedPendingListingId();
        return null;
      }
      return {
        listingId: recId,
        leonixAdId: rec.leonix_ad_id?.trim() || null,
      };
    } catch {
      return null;
    }
  }, []);

  const savePendingFsboListing = useCallback(
    async (d: BienesRaicesPrivadoFormState): Promise<{ ok: true; listingId: string; leonixAdId: string | null } | { ok: false; error: string }> => {
      const cached = await validateCachedPendingListing();
      if (cached) return { ok: true, ...cached };

      const r = await publishLeonixListingFromBienesRaicesPrivadoDraft(d, lang, {
        activationMode: "pending_payment",
      });
      if (!r.ok) return { ok: false, error: r.error };
      // Gate I.5.4A.1 — same warnings-banner pattern already proven for BR Negocio: surfaces a
      // seller-photo upload failure (or any other publish warning) on the published page instead
      // of silently dropping it.
      if (r.warnings.length) {
        try {
          sessionStorage.setItem("lx_br_publish_warnings", JSON.stringify(r.warnings));
        } catch {
          /* ignore */
        }
      }
      writeCachedPendingListingId(r.listingId);

      let leonixAdId: string | null = null;
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: adRow } = await supabase
          .from("listings")
          .select("leonix_ad_id")
          .eq("id", r.listingId)
          .maybeSingle();
        leonixAdId = (adRow as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
      } catch {
        /* checkout can still continue with listingId */
      }

      return { ok: true, listingId: r.listingId, leonixAdId };
    },
    [lang, validateCachedPendingListing],
  );

  const onStartFsboCheckout = useCallback(
    async (ctx: { newsletterOptIn: boolean; promoCode: string | null }) => {
      const d = await loadBienesRaicesPrivadoDraft();
      if (!d) return;
      setPublishBusy(true);
      setPublishErr(null);
      const pending = await savePendingFsboListing(d);
      if (!pending.ok) {
        setPublishBusy(false);
        setPublishErr(pending.error);
        return;
      }

      void captureCheckoutNewsletterSubscriber({
        checked: ctx.newsletterOptIn,
        email: d.seller.correo,
        name: d.seller.nombre,
        city: d.ciudad,
        zipCode: d.gate12d.codigoPostal,
        preferredLanguage: lang,
        lang,
        source: CHECKOUT_NEWSLETTER_SOURCES.bienesFsbo,
        interests: BIENES_RAICES_FSBO_NEWSLETTER_INTERESTS,
        consentText:
          lang === "es"
            ? "Acepto recibir promociones y novedades de Leonix relacionadas con mi checkout FSBO."
            : "I agree to receive Leonix promotions and updates related to my FSBO checkout.",
      });

      const checkout = await startRevenueCategoryCheckout({
        ...BIENES_RAICES_FSBO_CHECKOUT,
        packageKey: BIENES_RAICES_FSBO_PACKAGE_KEY,
        listingId: pending.listingId,
        leonixAdId: pending.leonixAdId,
        locale: lang,
        customerEmail: d.seller.correo,
        promoCode: ctx.promoCode,
      });

      if (checkout.ok) {
        suspendExitClearRef.current = true;
        clearBienesRaicesPrivadoDraft();
        redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
        return;
      }

      setPublishBusy(false);
      setPublishErr(checkout.userMessage);
    },
    [lang, routeLang, savePendingFsboListing],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await loadBienesRaicesPrivadoDraft();
      if (cancelled) return;
      setDraft(d);
      setPhase(d ? "ready" : "recovery");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Keep `?propiedad=` aligned with draft category whenever both are known (survives remounts and query changes). */
  useEffect(() => {
    if (phase !== "ready" || !draft) return;
    if (draft.categoriaPropiedad !== urlCategoria) {
      router.replace(`${BR_PREVIEW_PRIVADO}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}&lang=${routeLang}`);
    }
  }, [phase, draft, urlCategoria, router, routeLang]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F9F6F1] px-4 text-sm text-[#5C5346]">
        {lang === "en" ? "Loading preview…" : "Cargando vista previa…"}
      </div>
    );
  }

  if (phase === "recovery" || !draft) {
    const editHrefRecovery = `${BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(urlCategoria)}`;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 overflow-x-hidden bg-[#F9F6F1] px-4 py-8 text-center text-[#2C2416]">
        <p className="max-w-md text-sm leading-relaxed text-[#5C5346] [text-wrap:balance]">
          {lang === "en"
            ? "We couldn't find a BR Privado draft in this session. Publish or keep editing to generate the preview."
            : "No encontramos un borrador de BR Privado en esta sesión. Publica o continúa editando para generar la vista previa."}
        </p>
        <Link
          href={editHrefRecovery}
          className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-full bg-[#B8954A] px-6 text-sm font-bold text-[#1E1810] transition hover:brightness-95"
        >
          {lang === "en" ? "Go to publish — Private" : "Ir a publicar — Privado"}
        </Link>
      </div>
    );
  }

  const vm = mapBienesRaicesPrivadoStateToPreviewVm(draft, lang);
  const editHref = `${BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY}?${BR_NEGOCIO_Q_PROPIEDAD}=${encodeURIComponent(draft.categoriaPropiedad)}`;
  const checkpointConfig = bienesRaicesFsboPreviewCheckpointConfig(lang);

  // Globalization Package A Gate 4 — the guard P3 documented as required "the moment any link
  // ever points a real listing at this route": when the URL carries a listing-bound context
  // (the registry's previewRoute shape: source=dashboard + listingId, or preview=listing),
  // this is an already-identified — typically already-paid — listing, and the base-plan
  // checkout must never render again (same rule as BR Negocio/Servicios/Rentas). No live href
  // targets this route with those params today, so live behavior is unchanged; this closes
  // the latent unguarded branch.
  const listingBoundPreview =
    (searchParams?.get("preview") ?? "") === "listing" ||
    ((searchParams?.get("source") ?? "") === "dashboard" && Boolean((searchParams?.get("listingId") ?? "").trim()));
  const previewMode = resolvePreviewMode({ listingBound: listingBoundPreview });
  const suppressCheckout = previewModeSuppressesBasePlanCheckout(previewMode);

  return (
    // Item 208 — listing identity/property content must come first; checkout no longer renders
    // in the shell's sticky top header (publishSlot), it renders as a normal block after the ad
    // canvas instead, so the page still opens on the property, not on a pricing card.
    <LeonixPreviewPageShell editHref={editHref}>
      <BrPrivadoPreviewResultCardSection listing={buildBrResultCardPreviewListing(vm)} lang={lang} />
      <BienesRaicesPrivadoPreviewView vm={vm} lang={lang} />
      {suppressCheckout ? null : (
        <div className="mx-auto mt-6 w-full max-w-[420px] px-4">
          <PublishCheckoutCheckpoint
            config={checkpointConfig}
            lang={lang}
            busy={publishBusy}
            errorMessage={publishErr}
            onPromoApply={(code) => applyBienesRaicesFsboPreviewPromoCode({ code, lang })}
            onCheckout={(ctx) => void onStartFsboCheckout(ctx)}
            rulesModal={BIENES_RAICES_FSBO_PREVIEW_RULES_MODAL}
            className="w-full max-w-[420px]"
          />
        </div>
      )}
    </LeonixPreviewPageShell>
  );
}
