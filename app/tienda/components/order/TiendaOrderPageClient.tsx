"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "../../types/tienda";
import type { TiendaFulfillmentPreference, TiendaOrderReviewSummary, TiendaOrderSource } from "../../types/orderHandoff";
import { emptyTiendaCustomerDetails, type TiendaCustomerDetails } from "../../types/orderHandoff";
import { mapBusinessCardSessionToReview, readBusinessCardSessionRaw } from "../../order/mappers/businessCardDocumentToReview";
import { mapPrintUploadSessionToReview, readPrintUploadSessionRaw } from "../../order/mappers/printUploadDocumentToReview";
import {
  configurePathForSource,
  mergeBusinessNamePrefill,
  productPathForSlug,
  readPersistedOrderForm,
  writePersistedOrderForm,
} from "../../order/orderFormStorage";
import { tiendaCheckoutPlaceholderPath, withLang } from "../../utils/tiendaRouting";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";
import { TiendaOrderShell } from "./TiendaOrderShell";
import { TiendaOrderSummary } from "./TiendaOrderSummary";
import { TiendaAssetSummary } from "./TiendaAssetSummary";
import { TiendaCustomerDetailsForm } from "./TiendaCustomerDetailsForm";
import { TiendaFulfillmentPanel } from "./TiendaFulfillmentPanel";
import { TiendaOrderReminderPanel } from "./TiendaOrderReminderPanel";
import { TiendaOrderCTA } from "./TiendaOrderCTA";
import { TiendaOrderInvalidState } from "./TiendaOrderInvalidState";

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
  const [customer, setCustomer] = useState<TiendaCustomerDetails>(() => emptyTiendaCustomerDetails());
  const [fulfillment, setFulfillment] = useState<TiendaFulfillmentPreference | "">("");
  const [fulfillmentTouched, setFulfillmentTouched] = useState(false);

  useEffect(() => {
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

  if (!review) {
    return <TiendaOrderInvalidState source={source} slug={slug} lang={lang} />;
  }

  const showFulfillmentError = fulfillmentTouched && !fulfillment;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFulfillmentTouched(true);
    if (!fulfillment) return;
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    writePersistedOrderForm(source, slug, customer, fulfillment);
    router.push(withLang(tiendaCheckoutPlaceholderPath(source, slug), lang));
  };

  return (
    <TiendaOrderShell>
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

      <form onSubmit={onSubmit} className="space-y-8">
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
        <TiendaOrderCTA lang={lang} />
      </form>
    </TiendaOrderShell>
  );
}
