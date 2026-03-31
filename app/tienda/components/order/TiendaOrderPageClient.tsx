"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { assertTiendaOrderId } from "@/app/lib/tienda/tiendaBlobPrefix";
import { storeBusinessCardAssets } from "@/app/lib/tienda/storeBusinessCardAssets";
import { storePrintUploadAssets } from "@/app/lib/tienda/storePrintUploadAssets";
import type { Lang } from "../../types/tienda";
import type { TiendaFulfillmentPreference, TiendaOrderReviewSummary, TiendaOrderSource } from "../../types/orderHandoff";
import { emptyTiendaCustomerDetails, type TiendaCustomerDetails } from "../../types/orderHandoff";
import type { TiendaOrderSubmissionResult } from "../../types/orderSubmission";
import type { BusinessCardDocument } from "../../product-configurators/business-cards/types";
import { mapBusinessCardSessionToReview, readBusinessCardSessionRaw } from "../../order/mappers/businessCardDocumentToReview";
import {
  isPrintUploadSessionPayloadV1,
  mapPrintUploadSessionToReview,
  readPrintUploadSessionRaw,
} from "../../order/mappers/printUploadDocumentToReview";
import { buildTiendaOrderSubmissionPayload } from "../../order/buildTiendaOrderSubmissionPayload";
import { hydrateBusinessCardDocumentFromSession } from "../../order/hydrateBusinessCardDocumentFromSession";
import { BusinessCardPreview } from "../business-cards/BusinessCardPreview";
import {
  configurePathForSource,
  mergeBusinessNamePrefill,
  productPathForSlug,
  readPersistedOrderForm,
  writePersistedOrderForm,
} from "../../order/orderFormStorage";
import { readTiendaSubmittedMarker, writeTiendaSubmittedMarker, type TiendaSubmittedMarker } from "../../order/tiendaSubmissionSession";
import { withLang } from "../../utils/tiendaRouting";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";
import { subPick, orderSubmissionCopy } from "../../data/orderSubmissionCopy";
import { TiendaOrderShell } from "./TiendaOrderShell";
import { TiendaOrderSummary } from "./TiendaOrderSummary";
import { TiendaAssetSummary } from "./TiendaAssetSummary";
import { TiendaCustomerDetailsForm } from "./TiendaCustomerDetailsForm";
import { TiendaFulfillmentPanel } from "./TiendaFulfillmentPanel";
import { TiendaOrderReminderPanel } from "./TiendaOrderReminderPanel";
import { TiendaOrderCTA } from "./TiendaOrderCTA";
import { TiendaOrderInvalidState } from "./TiendaOrderInvalidState";
import { TiendaOrderError } from "./TiendaOrderError";
import { TiendaOrderAlreadySubmitted } from "./TiendaOrderAlreadySubmitted";

function loadReview(source: TiendaOrderSource, slug: string): TiendaOrderReviewSummary | null {
  if (source === "business-cards") {
    return mapBusinessCardSessionToReview(slug, readBusinessCardSessionRaw(slug));
  }
  return mapPrintUploadSessionToReview(slug, readPrintUploadSessionRaw(slug));
}

export function TiendaOrderPageClient(props: { source: TiendaOrderSource; slug: string; lang: Lang }) {
  const { source, slug, lang } = props;
  const router = useRouter();
  const [review, setReview] = useState<TiendaOrderReviewSummary | null | undefined>(undefined);
  const [existingSubmit, setExistingSubmit] = useState<TiendaSubmittedMarker | null>(null);
  const [customer, setCustomer] = useState<TiendaCustomerDetails>(() => emptyTiendaCustomerDetails());
  const [fulfillment, setFulfillment] = useState<TiendaFulfillmentPreference | "">("");
  const [fulfillmentTouched, setFulfillmentTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitBusyLabel, setSubmitBusyLabel] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bcExportDoc, setBcExportDoc] = useState<BusinessCardDocument | null>(null);

  useEffect(() => {
    setExistingSubmit(readTiendaSubmittedMarker(source, slug));
    const r = loadReview(source, slug);
    setReview(r);
    if (!r) return;
    const persisted = readPersistedOrderForm(source, slug);
    const base = persisted?.customer ?? emptyTiendaCustomerDetails();
    setCustomer(mergeBusinessNamePrefill(base, r.prefillBusinessName ?? null));
    setFulfillment(persisted?.fulfillment ?? "");
    setFulfillmentTouched(false);
  }, [source, slug]);

  useEffect(() => {
    if (review == null) return;
    writePersistedOrderForm(source, slug, customer, fulfillment);
  }, [customer, fulfillment, source, slug, review]);

  if (review === undefined) {
    return (
      <TiendaOrderShell>
        <p className="text-sm text-[rgba(255,255,255,0.55)]">{lang === "en" ? "Loading…" : "Cargando…"}</p>
      </TiendaOrderShell>
    );
  }

  if (existingSubmit) {
    return <TiendaOrderAlreadySubmitted lang={lang} orderId={existingSubmit.orderId} />;
  }

  if (!review) {
    return <TiendaOrderInvalidState source={source} slug={slug} lang={lang} />;
  }

  const showFulfillmentError = fulfillmentTouched && !fulfillment;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFulfillmentTouched(true);
    if (!fulfillment) return;
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    setSubmitBusyLabel(subPick(orderSubmissionCopy.uploadingAssets, lang));

    try {
      const prepRes = await fetch("/api/tienda/orders/prepare", { method: "POST" });
      const prepJson = (await prepRes.json()) as { orderId?: string };
      const orderId = String(prepJson.orderId ?? "").trim();
      if (!prepRes.ok || !assertTiendaOrderId(orderId)) {
        setSubmitError(subPick(orderSubmissionCopy.errorGeneric, lang));
        return;
      }

      const payload = buildTiendaOrderSubmissionPayload({
        orderId,
        review,
        customer,
        fulfillment,
        source,
        slug,
        lang,
      });
      if (!payload) {
        setSubmitError(
          lang === "en"
            ? "Session is out of sync. Open the configurator again and save before submitting."
            : "La sesión no coincide. Abre el configurador de nuevo y guarda antes de enviar."
        );
        return;
      }

      if (source === "business-cards") {
        const raw = readBusinessCardSessionRaw(slug);
        const doc = hydrateBusinessCardDocumentFromSession(slug, raw);
        if (!doc || raw == null) {
          setSubmitError(
            lang === "en"
              ? "Could not load business card session for export. Open the configurator again and save."
              : "No se pudo cargar la sesión de tarjetas para exportar. Abre el configurador y guarda."
          );
          return;
        }
        flushSync(() => setBcExportDoc(doc));
        try {
          const up = await storeBusinessCardAssets({
            orderId,
            productSlug: slug,
            document: doc,
            sessionJson: raw,
            getExportRoot: (side) =>
              document.querySelector(`[data-bc-export-mount="${side}"] [data-tienda-bc-export-root]`) as HTMLElement | null,
          });
          if (!up.ok) {
            const msg =
              up.code === "BLOB_NOT_CONFIGURED"
                ? subPick(orderSubmissionCopy.errorBlobConfig, lang)
                : subPick(orderSubmissionCopy.errorAssetUpload, lang);
            setSubmitError(up.error || msg);
            return;
          }
        } finally {
          flushSync(() => setBcExportDoc(null));
        }
      } else {
        const rawPu = readPrintUploadSessionRaw(slug);
        if (!isPrintUploadSessionPayloadV1(rawPu)) {
          setSubmitError(
            lang === "en"
              ? "Print session missing or invalid. Open the configurator again and save."
              : "Falta la sesión de impresión o no es válida. Abre el configurador y guarda."
          );
          return;
        }
        const up = await storePrintUploadAssets({ orderId, productSlug: slug, session: rawPu });
        if (!up.ok) {
          const msg =
            up.code === "BLOB_NOT_CONFIGURED"
              ? subPick(orderSubmissionCopy.errorBlobConfig, lang)
              : subPick(orderSubmissionCopy.errorAssetUpload, lang);
          setSubmitError(up.error || msg);
          return;
        }
      }

      setSubmitBusyLabel(subPick(orderSubmissionCopy.submitting, lang));

      const res = await fetch("/api/tienda/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as TiendaOrderSubmissionResult;

      if (!data.ok) {
        const msg =
          data.code === "EMAIL_FAILED"
            ? subPick(orderSubmissionCopy.errorEmailConfig, lang)
            : data.code === "BLOB_NOT_CONFIGURED"
              ? subPick(orderSubmissionCopy.errorBlobConfig, lang)
              : data.code === "DB_NOT_CONFIGURED" || data.code === "DB_INSERT_FAILED" || data.code === "DB_ASSETS_FAILED"
                ? subPick(orderSubmissionCopy.errorDbConfig, lang)
              : data.code === "DUPLICATE_ORDER_REF"
                ? subPick(orderSubmissionCopy.errorDuplicateOrder, lang)
              : data.code === "ASSETS_MISSING" || data.code === "LIST_FAILED"
                ? subPick(orderSubmissionCopy.errorAssetsMissing, lang)
                : data.error || subPick(orderSubmissionCopy.errorOrderPersist, lang);
        setSubmitError(msg);
        return;
      }

      try {
        sessionStorage.setItem(
          `tienda-order-complete-${data.orderId.trim().toUpperCase()}`,
          JSON.stringify({ assets: data.durableAssets ?? [], emailDelivered: data.emailDelivered !== false })
        );
        if (data.emailDelivered === false) {
          sessionStorage.setItem(`tienda-email-warn-${data.orderId.trim().toUpperCase()}`, "1");
        }
      } catch {
        /* ignore quota / private mode */
      }

      writeTiendaSubmittedMarker(source, slug, data.orderId);
      writePersistedOrderForm(source, slug, customer, fulfillment);
      router.push(withLang(`/tienda/order/complete?ref=${encodeURIComponent(data.orderId)}`, lang));
    } catch {
      setSubmitError(subPick(orderSubmissionCopy.errorGeneric, lang));
    } finally {
      setSubmitBusyLabel(null);
      setIsSubmitting(false);
      flushSync(() => setBcExportDoc(null));
    }
  };

  return (
    <TiendaOrderShell>
      {bcExportDoc ? (
        <div className="pointer-events-none fixed top-0 left-[-14000px] opacity-0" aria-hidden>
          <div data-bc-export-mount="front" className="w-[420px]">
            <BusinessCardPreview document={bcExportDoc} side="front" lang={lang} />
          </div>
          <div data-bc-export-mount="back" className="w-[420px]">
            <BusinessCardPreview document={bcExportDoc} side="back" lang={lang} />
          </div>
        </div>
      ) : null}

      <header className="space-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link
            href={withLang(configurePathForSource(source, slug), lang)}
            className="font-medium text-[rgba(255,247,226,0.82)] hover:text-[rgba(201,168,74,0.95)]"
          >
            {ohPick(orderHandoffCopy.backToConfigurator, lang)}
          </Link>
          <Link
            href={withLang(productPathForSlug(slug), lang)}
            className="font-medium text-[rgba(255,255,255,0.5)] hover:text-[rgba(201,168,74,0.85)]"
          >
            {ohPick(orderHandoffCopy.backToProduct, lang)}
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[rgba(255,247,226,0.96)]">
          {ohPick(orderHandoffCopy.pageTitle, lang)}
        </h1>
        <p className="text-sm text-[rgba(255,255,255,0.66)] max-w-2xl">{ohPick(orderHandoffCopy.pageSubtitle, lang)}</p>
      </header>

      <TiendaOrderSummary review={review} lang={lang} />
      <TiendaAssetSummary review={review} lang={lang} />

      <section className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgba(201,168,74,0.95)]">
          {ohPick(orderHandoffCopy.approvalTitle, lang)}
        </h2>
        <p className="text-sm font-medium text-[rgba(255,247,226,0.88)]">
          {lang === "en" ? review.approvalStatus.en : review.approvalStatus.es}
        </p>
        <ul className="text-xs text-[rgba(255,255,255,0.68)] space-y-1 list-disc list-inside">
          {review.approvalDetails.map((d, i) => (
            <li key={i}>{lang === "en" ? d.en : d.es}</li>
          ))}
        </ul>
      </section>

      {review.warnings.length ? (
        <section className="rounded-2xl border border-[rgba(220,160,90,0.35)] bg-[rgba(220,160,90,0.08)] p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-[rgba(255,230,200,0.95)]">{ohPick(orderHandoffCopy.warningsTitle, lang)}</h2>
          <ul className="mt-2 space-y-1 text-sm text-[rgba(255,255,255,0.78)] list-disc list-inside">
            {review.warnings.map((w, i) => (
              <li key={i}>{lang === "en" ? w.en : w.es}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {submitError ? <TiendaOrderError lang={lang} message={submitError} /> : null}

      <form onSubmit={(ev) => void onSubmit(ev)} className="space-y-8">
        <TiendaCustomerDetailsForm lang={lang} value={customer} onChange={setCustomer} />
        <TiendaFulfillmentPanel
          lang={lang}
          value={fulfillment}
          onChange={(v) => {
            setFulfillment(v);
            setFulfillmentTouched(true);
          }}
          showError={showFulfillmentError}
        />
        <TiendaOrderReminderPanel lang={lang} />
        <TiendaOrderCTA lang={lang} isSubmitting={isSubmitting} submitDisabled={isSubmitting} busyLabel={submitBusyLabel ?? undefined} />
      </form>
    </TiendaOrderShell>
  );
}
