"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { Lang } from "../../types/tienda";
import type { BusinessCardProductSlug } from "../../product-configurators/business-cards/types";
import type { PrintUploadFile } from "../../product-configurators/print-upload/types";
import { buildPrintUploadFile, isAcceptedMime } from "../../product-configurators/print-upload/fileHelpers";
import { PRINT_UPLOAD_INPUT_ACCEPT } from "../../product-configurators/print-upload/constants";
import {
  validateBusinessCardUploadMeta,
  bcUploadHasHardStops,
  BUSINESS_CARD_UPLOAD_MAX_MB,
} from "../../product-configurators/business-cards/uploadValidation";
import type { BusinessCardApprovalChecks } from "../../product-configurators/business-cards/types";
import { BC_UPLOAD_DRAFT_PREFIX } from "../../order/mappers/businessCardDocumentToReview";
import type { BusinessCardSessionPayloadV3Upload } from "../../order/mappers/businessCardDocumentToReview";
import { tiendaOrderPath, withLang } from "../../utils/tiendaRouting";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";
import { BusinessCardApprovalPanel } from "./BusinessCardApprovalPanel";
import { BusinessCardValidationPanel } from "./BusinessCardValidationPanel";
import type { BusinessCardValidationResult } from "../../product-configurators/business-cards/types";

const BC_DESIGN_PREFIX = "leonix-bc-draft-";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function uploadMetaForValidation(f: PrintUploadFile | null): NonNullable<Parameters<typeof validateBusinessCardUploadMeta>[0]["front"]> | null {
  if (!f?.file) return null;
  return {
    name: f.name,
    mime: f.mime,
    sizeBytes: f.sizeBytes,
    widthPx: f.widthPx,
    heightPx: f.heightPx,
    dataUrl: "ready",
  };
}

export function BusinessCardUploadShell(props: { productSlug: BusinessCardProductSlug; lang: Lang }) {
  const { productSlug, lang } = props;
  const router = useRouter();
  const [frontFile, setFrontFile] = useState<PrintUploadFile | null>(null);
  const [backFile, setBackFile] = useState<PrintUploadFile | null>(null);
  const [approval, setApproval] = useState<BusinessCardApprovalChecks>({
    spellingReviewed: false,
    layoutReviewed: false,
    printAsApproved: false,
    noRedesignExpectation: false,
  });

  const sidedness = productSlug === "two-sided-business-cards" ? "two-sided" : "one-sided";

  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const docRef = useRef({ frontFile, backFile });
  docRef.current = { frontFile, backFile };

  const applySlot = useCallback(
    async (slot: "front" | "back", file: File | null) => {
      const cur = slot === "front" ? docRef.current.frontFile : docRef.current.backFile;
      if (cur?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(cur.previewUrl);

      if (!file) {
        if (slot === "front") setFrontFile(null);
        else setBackFile(null);
        return;
      }

      if (file.size > BUSINESS_CARD_UPLOAD_MAX_MB * 1024 * 1024) {
        window.alert(
          lang === "en"
            ? `File must be under ${BUSINESS_CARD_UPLOAD_MAX_MB} MB.`
            : `El archivo debe ser menor a ${BUSINESS_CARD_UPLOAD_MAX_MB} MB.`
        );
        return;
      }

      if (!isAcceptedMime(file.type)) {
        window.alert(lang === "en" ? "Unsupported file type." : "Tipo de archivo no admitido.");
        return;
      }

      try {
        const built = await buildPrintUploadFile(file, slot);
        if (slot === "front") setFrontFile(built);
        else setBackFile(built);
      } catch {
        window.alert(lang === "en" ? "Could not read that file." : "No se pudo leer el archivo.");
      }
    },
    [lang]
  );

  const onPick =
    (slot: "front" | "back") =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null;
      await applySlot(slot, f);
      e.target.value = "";
    };

  const validationItems = useMemo(() => {
    return validateBusinessCardUploadMeta({
      front: uploadMetaForValidation(frontFile),
      back: sidedness === "two-sided" ? uploadMetaForValidation(backFile) : null,
      sidedness,
    });
  }, [frontFile, backFile, sidedness]);

  const validation: BusinessCardValidationResult = useMemo(() => {
    const hardCount = validationItems.filter((i) => i.severity === "hard").length;
    const softCount = validationItems.filter((i) => i.severity === "soft").length;
    const items = validationItems.map((it, idx) => ({
      id: `${it.severity}-${idx}`,
      severity: it.severity,
      messageEs: it.messageEs,
      messageEn: it.messageEn,
    })) as BusinessCardValidationResult["items"];
    const hasBlockingContentIssues = bcUploadHasHardStops(validationItems);
    const approvalComplete =
      approval.spellingReviewed &&
      approval.layoutReviewed &&
      approval.printAsApproved &&
      approval.noRedesignExpectation;
    return {
      items,
      hardCount,
      softCount,
      hasBlockingContentIssues,
      approvalComplete,
      canContinue: !hasBlockingContentIssues && approvalComplete,
    };
  }, [validationItems, approval]);

  const persistDraftToSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!frontFile?.file) return false;
      const frontDataUrl = await readAsDataUrl(frontFile.file);
      let backDataUrl: string | null = null;
      if (sidedness === "two-sided") {
        if (!backFile?.file) return false;
        backDataUrl = await readAsDataUrl(backFile.file);
      }

      const payload: BusinessCardSessionPayloadV3Upload = {
        v: 3,
        mode: "upload-existing",
        savedAt: new Date().toISOString(),
        productSlug,
        sidedness,
        frontMeta: {
          name: frontFile.name,
          mime: frontFile.mime,
          sizeBytes: frontFile.sizeBytes,
          widthPx: frontFile.widthPx,
          heightPx: frontFile.heightPx,
          dataUrl: frontDataUrl,
        },
        backMeta:
          sidedness === "two-sided" && backFile?.file && backDataUrl
            ? {
                name: backFile.name,
                mime: backFile.mime,
                sizeBytes: backFile.sizeBytes,
                widthPx: backFile.widthPx,
                heightPx: backFile.heightPx,
                dataUrl: backDataUrl,
              }
            : null,
        approval,
        validationSnapshot: validationItems.map((i) => ({
          severity: i.severity,
          messageEs: i.messageEs,
          messageEn: i.messageEn,
        })),
      };

      sessionStorage.setItem(`${BC_UPLOAD_DRAFT_PREFIX}${productSlug}`, JSON.stringify(payload));
      sessionStorage.removeItem(`${BC_DESIGN_PREFIX}${productSlug}`);
      return true;
    } catch {
      return false;
    }
  }, [approval, backFile, frontFile, productSlug, sidedness, validationItems]);

  const continueToOrderDetails = useCallback(async () => {
    const ok = await persistDraftToSession();
    if (!ok) {
      window.alert(lang === "en" ? "Could not save draft." : "No se pudo guardar el borrador.");
      return;
    }
    router.push(withLang(tiendaOrderPath("business-cards", productSlug), lang));
  }, [persistDraftToSession, lang, router, productSlug]);

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-10">
        <header>
          <Link
            href={withLang(`/tienda/p/${productSlug}`, lang)}
            className="text-sm font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)]"
          >
            {bcPick(businessCardBuilderCopy.backToProduct, lang)}
          </Link>
          <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
            {lang === "en" ? "Upload business card artwork" : "Sube el arte de tu tarjeta"}
          </h1>
          <p className="mt-1 text-sm text-[rgba(255,255,255,0.62)] max-w-2xl">
            {lang === "en"
              ? "Use print-ready PDF or high-resolution image. Leonix stores your original file — no lossy conversion."
              : "Usa PDF listo o imagen en alta resolución. Leonix guarda tu archivo original, sin conversión con pérdida."}
          </p>
        </header>

        <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.85)]">
                {lang === "en" ? "Front (required)" : "Frente (obligatorio)"}
              </h2>
              <p className="mt-1 text-xs text-[rgba(255,255,255,0.5)]">
                PNG, JPG, TIFF, PDF · max {BUSINESS_CARD_UPLOAD_MAX_MB} MB
              </p>
              <input
                ref={frontRef}
                type="file"
                accept={PRINT_UPLOAD_INPUT_ACCEPT}
                className="hidden"
                onChange={(e) => void onPick("front")(e)}
              />
              <button
                type="button"
                onClick={() => frontRef.current?.click()}
                className="mt-3 w-full rounded-xl border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm font-medium hover:bg-[rgba(255,255,255,0.09)]"
              >
                {frontFile ? frontFile.name : lang === "en" ? "Choose front file" : "Elegir archivo del frente"}
              </button>
              {frontFile ? (
                <p className="mt-2 text-[11px] text-[rgba(255,255,255,0.45)]">
                  {frontFile.mime} · {(frontFile.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  {frontFile.widthPx != null ? ` · ${frontFile.widthPx}×${frontFile.heightPx} px` : ""}
                </p>
              ) : null}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.85)]">
                {sidedness === "two-sided"
                  ? lang === "en"
                    ? "Back (required)"
                    : "Reverso (obligatorio)"
                  : lang === "en"
                    ? "Back (not used)"
                    : "Reverso (no aplica)"}
              </h2>
              <input
                ref={backRef}
                type="file"
                accept={PRINT_UPLOAD_INPUT_ACCEPT}
                className="hidden"
                disabled={sidedness !== "two-sided"}
                onChange={(e) => void onPick("back")(e)}
              />
              <button
                type="button"
                disabled={sidedness !== "two-sided"}
                onClick={() => backRef.current?.click()}
                className={[
                  "mt-7 w-full rounded-xl border px-4 py-3 text-sm font-medium",
                  sidedness === "two-sided"
                    ? "border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.09)]"
                    : "border-white/10 bg-white/5 text-white/35 cursor-not-allowed",
                ].join(" ")}
              >
                {backFile ? backFile.name : lang === "en" ? "Choose back file" : "Elegir archivo del reverso"}
              </button>
              {backFile ? (
                <p className="mt-2 text-[11px] text-[rgba(255,255,255,0.45)]">
                  {backFile.mime} · {(backFile.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  {backFile.widthPx != null ? ` · ${backFile.widthPx}×${backFile.heightPx} px` : ""}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <BusinessCardValidationPanel lang={lang} result={validation} />

        <BusinessCardApprovalPanel lang={lang} approval={approval} onChange={(patch) => setApproval((a) => ({ ...a, ...patch }))} />

        <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
          <h2 className="text-base font-semibold">{bcPick(businessCardBuilderCopy.nextTitle, lang)}</h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)] max-w-2xl">
            {lang === "en"
              ? "You will confirm customer details and fulfillment on the next screen."
              : "Confirmarás datos y entrega en la siguiente pantalla."}
          </p>
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
          </div>
        </section>
      </div>
    </main>
  );
}
