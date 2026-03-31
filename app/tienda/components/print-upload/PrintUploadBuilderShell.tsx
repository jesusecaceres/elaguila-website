"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { Lang } from "../../types/tienda";
import type { PrintUploadProductSlug } from "../../product-configurators/print-upload/types";
import { createInitialPrintUploadDocument } from "../../product-configurators/print-upload/documentFactory";
import { buildPrintUploadFile, fileExceedsMaxBytes, isAcceptedMime } from "../../product-configurators/print-upload/fileHelpers";
import { DEFAULT_MAX_FILE_MB } from "../../product-configurators/print-upload/constants";
import {
  printUploadReducer,
  type PrintUploadAction,
} from "../../product-configurators/print-upload/printUploadReducer";
import { validatePrintUploadDocument } from "../../product-configurators/print-upload/validation";
import {
  getPrintUploadConfig,
  needsSeparateBackFile,
} from "../../product-configurators/print-upload/productConfigs";
import { getProductFamilyBySlug } from "../../data/tiendaRegistry";
import { printUploadConfigurePath, withLang } from "../../utils/tiendaRouting";
import { puPick, printUploadBuilderCopy } from "../../data/printUploadBuilderCopy";
import { PrintUploadSpecPanel } from "./PrintUploadSpecPanel";
import { PrintUploadDropzone } from "./PrintUploadDropzone";
import { PrintUploadFileSummary } from "./PrintUploadFileSummary";
import { PrintUploadValidationPanel } from "./PrintUploadValidationPanel";
import { PrintUploadApprovalPanel } from "./PrintUploadApprovalPanel";
import { PrintUploadSupportPanel } from "./PrintUploadSupportPanel";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function PrintUploadBuilderShell(props: { productSlug: PrintUploadProductSlug; lang: Lang }) {
  const { productSlug, lang } = props;
  const cfg = getPrintUploadConfig(productSlug)!;
  const productMeta = getProductFamilyBySlug(productSlug);

  const [doc, dispatch] = useReducer(
    printUploadReducer,
    undefined,
    () => createInitialPrintUploadDocument(productSlug)
  );

  const dispatchTyped = dispatch as (a: PrintUploadAction) => void;

  const docRef = useRef(doc);
  docRef.current = doc;
  useEffect(() => {
    return () => {
      const d = docRef.current;
      [d.frontFile?.previewUrl, d.backFile?.previewUrl].forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
  }, []);

  useEffect(() => {
    const d = docRef.current;
    if (!needsSeparateBackFile(cfg, d.specs) && d.backFile) {
      const u = d.backFile.previewUrl;
      if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      dispatch({ type: "SET_BACK_FILE", file: null });
    }
  }, [cfg, doc.specs.sidesId, dispatch]);

  const validation = useMemo(() => validatePrintUploadDocument(doc), [doc]);

  const applySlot = useCallback(
    async (slot: "front" | "back", file: File | null) => {
      const d = docRef.current;
      const cur = slot === "front" ? d.frontFile : d.backFile;
      if (cur?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(cur.previewUrl);

      if (!file) {
        dispatchTyped({ type: slot === "front" ? "SET_FRONT_FILE" : "SET_BACK_FILE", file: null });
        return;
      }

      if (fileExceedsMaxBytes(file)) {
        window.alert(
          lang === "en"
            ? `File must be under ${DEFAULT_MAX_FILE_MB} MB.`
            : `El archivo debe ser menor a ${DEFAULT_MAX_FILE_MB} MB.`
        );
        return;
      }

      if (!isAcceptedMime(file.type)) {
        window.alert(
          lang === "en" ? "Unsupported file type." : "Tipo de archivo no admitido."
        );
        return;
      }

      try {
        const built = await buildPrintUploadFile(file, slot);
        dispatchTyped({ type: slot === "front" ? "SET_FRONT_FILE" : "SET_BACK_FILE", file: built });
      } catch {
        window.alert(lang === "en" ? "Could not read that file." : "No se pudo leer el archivo.");
      }
    },
    [dispatchTyped, lang]
  );

  const saveDraft = useCallback(async () => {
    try {
      const frontData = doc.frontFile?.file ? await readAsDataUrl(doc.frontFile.file) : null;
      const backData = doc.backFile?.file ? await readAsDataUrl(doc.backFile.file) : null;
      const payload = {
       v: 1,
        savedAt: new Date().toISOString(),
        productSlug: doc.productSlug,
        specs: doc.specs,
        approval: doc.approval,
        frontMeta: doc.frontFile
          ? {
              name: doc.frontFile.name,
              mime: doc.frontFile.mime,
              sizeBytes: doc.frontFile.sizeBytes,
              widthPx: doc.frontFile.widthPx,
              heightPx: doc.frontFile.heightPx,
              dataUrl: frontData,
            }
          : null,
        backMeta: doc.backFile
          ? {
              name: doc.backFile.name,
              mime: doc.backFile.mime,
              sizeBytes: doc.backFile.sizeBytes,
              widthPx: doc.backFile.widthPx,
              heightPx: doc.backFile.heightPx,
              dataUrl: backData,
            }
          : null,
      };
      sessionStorage.setItem(`leonix-pu-draft-${doc.productSlug}`, JSON.stringify(payload));
      window.alert(puPick(printUploadBuilderCopy.savedToast, lang));
    } catch {
      window.alert(lang === "en" ? "Could not save draft." : "No se pudo guardar el borrador.");
    }
  }, [doc, lang]);

  const wantBack = needsSeparateBackFile(cfg, doc.specs);
  const title = productMeta
    ? lang === "en"
      ? productMeta.title.en
      : productMeta.title.es
    : productSlug;

  return (
    <main className="min-h-screen bg-[#070708] text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-16 space-y-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={withLang(`/tienda/p/${productSlug}`, lang)}
              className="text-sm font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)]"
            >
              {puPick(printUploadBuilderCopy.backToProduct, lang)}
            </Link>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">{puPick(printUploadBuilderCopy.pageTitle, lang)}</h1>
            <p className="mt-1 text-sm text-[rgba(255,255,255,0.62)]">{title}</p>
          </div>
        </header>

        <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5">
          <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.85)]">
            {puPick(printUploadBuilderCopy.productSummary, lang)}
          </h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)]">
            {lang === "en"
              ? "Upload the exact file you want printed. Preview shows image thumbnails or a PDF summary card."
              : "Sube el archivo exacto que deseas imprimir. La vista previa muestra miniaturas o un resumen para PDF."}
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <PrintUploadSpecPanel lang={lang} cfg={cfg} doc={doc} dispatch={dispatchTyped} />
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[rgba(255,247,226,0.85)]">{puPick(printUploadBuilderCopy.uploadTitle, lang)}</h2>
            <PrintUploadDropzone
              lang={lang}
              label={puPick(printUploadBuilderCopy.uploadFront, lang)}
              file={doc.frontFile}
              onFile={(f) => void applySlot("front", f)}
            />
            {wantBack ? (
              <PrintUploadDropzone
                lang={lang}
                label={puPick(printUploadBuilderCopy.uploadBack, lang)}
                file={doc.backFile}
                onFile={(f) => void applySlot("back", f)}
              />
            ) : null}
          </div>
        </div>

        <PrintUploadFileSummary lang={lang} doc={doc} cfg={cfg} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PrintUploadValidationPanel lang={lang} result={validation} />
          <PrintUploadSupportPanel lang={lang} />
        </div>

        <PrintUploadApprovalPanel
          lang={lang}
          approval={doc.approval}
          onChange={(patch) => dispatchTyped({ type: "SET_APPROVAL", patch })}
        />

        <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] p-5 sm:p-6">
          <h2 className="text-base font-semibold">{puPick(printUploadBuilderCopy.nextTitle, lang)}</h2>
          <p className="mt-2 text-sm text-[rgba(255,255,255,0.72)] max-w-2xl">
            {puPick(printUploadBuilderCopy.nextBody, lang)}
          </p>
          {!validation.hasBlockingIssues && !validation.approvalComplete ? (
            <p className="mt-2 text-sm text-[rgba(201,168,74,0.85)]">
              {lang === "en"
                ? "Fix required items and confirm all checkboxes to save."
                : "Corrige lo requerido y marca todas las casillas para guardar."}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!validation.canContinue}
              onClick={() => void saveDraft()}
              className={[
                "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition",
                validation.canContinue
                  ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95 shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
                  : "bg-white/10 text-white/40 cursor-not-allowed",
              ].join(" ")}
            >
              {puPick(printUploadBuilderCopy.saveContinue, lang)}
            </button>
            <Link
              href={withLang(`/tienda/p/${productSlug}`, lang)}
              className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-6 py-3 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)]"
            >
              {lang === "en" ? "Product page" : "Página del producto"}
            </Link>
          </div>
        </section>

        <p className="text-[11px] text-[rgba(255,255,255,0.38)] font-mono">
          {printUploadConfigurePath(productSlug)}
        </p>
      </div>
    </main>
  );
}
