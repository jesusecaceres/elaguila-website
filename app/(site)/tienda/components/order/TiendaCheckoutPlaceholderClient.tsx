"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "../../types/tienda";
import type { TiendaOrderSource } from "../../types/orderHandoff";
import { mapBusinessCardSessionToReview, readBusinessCardOrderSession } from "../../order/mappers/businessCardDocumentToReview";
import { mapPrintUploadSessionToReview, readPrintUploadSessionRaw } from "../../order/mappers/printUploadDocumentToReview";
import { tiendaOrderPath, withLang } from "../../utils/tiendaRouting";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";
import { TiendaOrderShell } from "./TiendaOrderShell";

function loadTitle(source: TiendaOrderSource, slug: string, lang: Lang): string | null {
  if (source === "business-cards") {
    const r = mapBusinessCardSessionToReview(slug, readBusinessCardOrderSession(slug));
    return r ? (lang === "en" ? r.productTitle.en : r.productTitle.es) : null;
  }
  const r = mapPrintUploadSessionToReview(slug, readPrintUploadSessionRaw(slug));
  return r ? (lang === "en" ? r.productTitle.en : r.productTitle.es) : null;
}

export function TiendaCheckoutPlaceholderClient(props: { source: TiendaOrderSource; slug: string; lang: Lang }) {
  const { source, slug, lang } = props;
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    setTitle(loadTitle(source, slug, lang));
  }, [source, slug, lang]);

  return (
    <TiendaOrderShell>
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-[rgba(255,247,226,0.96)]">{ohPick(orderHandoffCopy.checkoutPageTitle, lang)}</h1>
        {title ? (
          <p className="text-sm text-[rgba(201,168,74,0.9)]">
            {lang === "en" ? "Order context:" : "Contexto del pedido:"} {title}
          </p>
        ) : null}
        <p className="text-sm text-[rgba(255,255,255,0.68)] max-w-2xl">{ohPick(orderHandoffCopy.checkoutPageBody, lang)}</p>
      </header>
      <Link
        href={withLang(tiendaOrderPath(source, slug), lang)}
        className="inline-flex rounded-full border border-[rgba(255,255,255,0.18)] px-6 py-3 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)] w-fit"
      >
        {ohPick(orderHandoffCopy.checkoutBack, lang)}
      </Link>
    </TiendaOrderShell>
  );
}
