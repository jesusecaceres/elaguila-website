"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardDesignIntake, BusinessCardProductSlug } from "../../product-configurators/business-cards/types";
import { createInitialBusinessCardDocument } from "../../product-configurators/business-cards/documentFactory";
import {
  businessCardBuilderReducer,
  type BusinessCardBuilderAction,
} from "../../product-configurators/business-cards/businessCardBuilderReducer";
import { validateBusinessCardDocument } from "../../product-configurators/business-cards/validation";
import { LOGO_MAX_MB } from "../../product-configurators/business-cards/constants";
import { businessCardConfigurePath, tiendaOrderPath, tiendaPublicContactPath, withLang } from "../../utils/tiendaRouting";
import {
  BC_UPLOAD_DRAFT_PREFIX,
  readBusinessCardSessionRaw,
  toBusinessCardSessionPayloadV3Design,
} from "../../order/mappers/businessCardDocumentToReview";
import { hydrateBusinessCardDocumentFromSession } from "../../order/hydrateBusinessCardDocumentFromSession";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { bcpPick, businessCardProductCopy } from "../../data/businessCardProductCopy";
import { BusinessCardPreview } from "./BusinessCardPreview";
import { BusinessCardEditorPanel } from "./BusinessCardEditorPanel";
import { BusinessCardSideTabs } from "./BusinessCardSideTabs";
import { BusinessCardValidationPanel } from "./BusinessCardValidationPanel";
import { BusinessCardApprovalPanel } from "./BusinessCardApprovalPanel";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function BusinessCardBuilderShell(props: {
  productSlug: BusinessCardProductSlug;
  lang: Lang;
  designEntry: BusinessCardDesignIntake;
}) {
  const { productSlug, lang, designEntry } = props;
  const router = useRouter();
  const [doc, dispatch] = useReducer(businessCardBuilderReducer, undefined, () => {
    if (typeof window !== "undefined") {
      const raw = readBusinessCardSessionRaw(productSlug);
      const hydrated = raw ? hydrateBusinessCardDocumentFromSession(productSlug, raw, lang) : null;
      if (hydrated) return hydrated;
    }
    return createInitialBusinessCardDocument(productSlug, lang, { designIntake: designEntry });
  });
  const [selectedTextBlockId, setSelectedTextBlockId] = useState<string | null>(null);
  const [logoInspectorActive, setLogoInspectorActive] = useState(false);

  const docRef = useRef(doc);
  docRef.current = doc;
  useEffect(() => {
    return () => {
      const d = docRef.current;
      [d.front.logo.previewUrl, d.back.logo.previewUrl].forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, []);

  useEffect(() => {
    const raw = readBusinessCardSessionRaw(productSlug);
    if (!raw) return;
    const next = hydrateBusinessCardDocumentFromSession(productSlug, raw, lang);
    if (next) dispatch({ type: "RESET", document: next });
  }, [productSlug, lang]);

  useEffect(() => {
    const sideState = doc.activeSide === "front" ? doc.front : doc.back;
    if (selectedTextBlockId && !sideState.textBlocks.some((b) => b.id === selectedTextBlockId)) {
      setSelectedTextBlockId(null);
    }
  }, [doc.activeSide, doc.front.textBlocks, doc.back.textBlocks, selectedTextBlockId]);

  const validation = useMemo(() => validateBusinessCardDocument(doc), [doc]);

  const applyLogo = useCallback(
    (file: File | null) => {
      const side = doc.activeSide;
      const cur = side === "front" ? doc.front.logo : doc.back.logo;
      if (cur.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(cur.previewUrl);
      }
      if (!file) {
        dispatch({ type: "CLEAR_LOGO", side });
        return;
      }
      if (file.size > LOGO_MAX_MB * 1024 * 1024) {
        window.alert(
          lang === "en"
            ? `Logo must be under ${LOGO_MAX_MB} MB.`
            : `El logo debe ser menor a ${LOGO_MAX_MB} MB.`
        );
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        dispatch({
          type: "SET_LOGO",
          side,
          payload: {
            file,
            previewUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          },
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        dispatch({ type: "CLEAR_LOGO", side });
      };
      img.src = previewUrl;
    },
    [doc.activeSide, doc.front.logo, doc.back.logo]
  );

  const persistDraftToSession = useCallback(async (): Promise<boolean> => {
    try {
      const frontLogo = doc.front.logo.file ? await readAsDataUrl(doc.front.logo.file) : doc.front.logo.previewUrl;
      const backLogo = doc.back.logo.file ? await readAsDataUrl(doc.back.logo.file) : doc.back.logo.previewUrl;
      const payload = toBusinessCardSessionPayloadV3Design(
        doc,
        { front: frontLogo, back: backLogo },
        new Date().toISOString()
      );
      sessionStorage.setItem(`leonix-bc-draft-${doc.productSlug}`, JSON.stringify(payload));
      sessionStorage.removeItem(`${BC_UPLOAD_DRAFT_PREFIX}${doc.productSlug}`);
      return true;
    } catch {
      return false;
    }
  }, [doc]);

  const continueToOrderDetails = useCallback(async () => {
    const ok = await persistDraftToSession();
    if (!ok) {
      window.alert(lang === "en" ? "Could not save draft." : "No se pudo guardar el borrador.");
      return;
    }
    router.push(withLang(tiendaOrderPath("business-cards", productSlug), lang));
  }, [persistDraftToSession, lang, router, productSlug]);

  const dispatchTyped = dispatch as (a: BusinessCardBuilderAction) => void;

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <Link
              href={withLang(`/tienda/p/${productSlug}`, lang)}
              className="text-sm font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)]"
            >
              {bcPick(businessCardBuilderCopy.backToProduct, lang)}
            </Link>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
              {bcPick(businessCardBuilderCopy.pageTitle, lang)}
            </h1>
            <p className="mt-1 text-sm text-[rgba(255,255,255,0.62)]">
              {lang === "en"
                ? "Premium 3.5″×2″ cards — Leonix prints what you approve."
                : "Tarjetas 3.5″×2″ premium — Leonix imprime lo que apruebas."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BusinessCardSideTabs
              doc={doc}
              lang={lang}
              active={doc.activeSide}
              onChange={(s) => {
                setSelectedTextBlockId(null);
                setLogoInspectorActive(false);
                dispatch({ type: "SET_ACTIVE_SIDE", side: s });
              }}
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_GUIDES" })}
              className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm font-medium"
            >
              {bcPick(businessCardBuilderCopy.guidesToggle, lang)}:{" "}
              {doc.guidesVisible ? (lang === "en" ? "On" : "Sí") : lang === "en" ? "Off" : "No"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-4 py-3 sm:px-5 sm:py-4 mb-2">
          <p className="text-sm text-[rgba(255,255,255,0.75)]">
            {doc.designIntake === "custom"
              ? bcpPick(businessCardProductCopy.designIntakeCustomHint, lang)
              : doc.designIntake === "leo"
                ? bcpPick(businessCardProductCopy.designIntakeLeoHint, lang)
                : bcpPick(businessCardProductCopy.designIntakeTemplateHint, lang)}
          </p>
          {doc.designIntake === "template" || doc.designIntake === "leo" ? (
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_DESIGN_INTAKE", designIntake: "custom" })}
              className="mt-3 text-sm font-semibold text-[rgba(201,168,74,0.95)] underline-offset-4 hover:underline"
            >
              {bcpPick(businessCardProductCopy.switchToCustomCta, lang)}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
          <div className="space-y-3 lg:space-y-4">
            <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.82)]">
              {bcPick(businessCardBuilderCopy.previewTitle, lang)}
            </h2>
            <BusinessCardPreview
              document={doc}
              side={doc.activeSide}
              lang={lang}
              editInteraction={{
                selectedTextBlockId,
                logoSelected: logoInspectorActive,
                onSelectTextBlock: (id) => {
                  setSelectedTextBlockId(id);
                  setLogoInspectorActive(false);
                },
                onDeselectCanvas: () => {
                  setSelectedTextBlockId(null);
                  setLogoInspectorActive(false);
                },
                onFocusLogo: () => {
                  setLogoInspectorActive(true);
                  setSelectedTextBlockId(null);
                },
                onMoveTextBlock: (id, xPct, yPct) =>
                  dispatchTyped({ type: "SET_TEXT_BLOCK", side: doc.activeSide, id, patch: { xPct, yPct } }),
                onMoveLogo: (xPct, yPct) =>
                  dispatchTyped({ type: "SET_LOGO_GEOM", side: doc.activeSide, patch: { xPct, yPct } }),
              }}
            />
          </div>
          <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 lg:-mr-1">
            <BusinessCardEditorPanel
              lang={lang}
              doc={doc}
              side={doc.activeSide}
              dispatch={dispatchTyped}
              onPickLogo={applyLogo}
              selectedTextBlockId={selectedTextBlockId}
              onSelectTextBlock={(id) => {
                setSelectedTextBlockId(id);
                setLogoInspectorActive(false);
              }}
              logoInspectorActive={logoInspectorActive}
            />
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <BusinessCardValidationPanel lang={lang} result={validation} />
          <BusinessCardApprovalPanel
            lang={lang}
            approval={doc.approval}
            onChange={(patch) => dispatch({ type: "SET_APPROVAL", patch })}
          />

          <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
            <h2 className="text-base font-semibold">{bcPick(businessCardBuilderCopy.nextTitle, lang)}</h2>
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)] max-w-2xl">
              {bcPick(businessCardBuilderCopy.nextBody, lang)}
            </p>
            {!validation.hasBlockingContentIssues && !validation.approvalComplete ? (
              <p className="mt-2 text-sm text-[rgba(201,168,74,0.85)]">
                {lang === "en"
                  ? "Complete the checklist above to enable save & continue."
                  : "Completa la lista de verificación para activar guardar y continuar."}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={!validation.canContinue}
                onClick={() => void continueToOrderDetails()}
                className={[
                  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition",
                  validation.canContinue
                    ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95 shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
                    : "bg-white/10 text-white/40 cursor-not-allowed",
                ].join(" ")}
              >
                {bcPick(businessCardBuilderCopy.saveContinue, lang)}
              </button>
              <Link
                href={withLang(`/tienda/p/${productSlug}`, lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-6 py-3 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)]"
              >
                {lang === "en" ? "Edit product options" : "Opciones del producto"}
              </Link>
              <Link
                href={withLang(tiendaPublicContactPath(), lang)}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(201,168,74,0.35)] px-6 py-3 text-sm font-semibold text-[rgba(255,247,226,0.88)]"
              >
                {lang === "en" ? "Order with Leonix" : "Pedir con Leonix"}
              </Link>
            </div>
          </section>

          <p className="text-[11px] text-[rgba(255,255,255,0.38)]">
            {lang === "en" ? "Builder URL:" : "URL del constructor:"}{" "}
            <span className="font-mono">{businessCardConfigurePath(productSlug)}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
