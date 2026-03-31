"use client";

import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { subPick, orderSubmissionCopy } from "../../data/orderSubmissionCopy";
import { withLang } from "../../utils/tiendaRouting";
import { TiendaOrderShell } from "./TiendaOrderShell";

const REF_RE = /^LX-TND-[A-Z0-9]+-[A-F0-9]{8}$/i;

export function TiendaOrderCompleteClient(props: { orderRef: string; lang: Lang }) {
  const { orderRef, lang } = props;
  const valid = REF_RE.test(orderRef.trim());

  if (!valid) {
    return (
      <TiendaOrderShell>
        <p className="text-sm text-[rgba(255,200,180,0.9)]">{subPick(orderSubmissionCopy.completeInvalidRef, lang)}</p>
        <Link href={withLang("/tienda", lang)} className="mt-4 inline-block text-[rgba(201,168,74,0.95)] text-sm font-medium">
          {subPick(orderSubmissionCopy.successBackTienda, lang)}
        </Link>
      </TiendaOrderShell>
    );
  }

  const ref = orderRef.trim().toUpperCase();

  return (
    <TiendaOrderShell>
      <div className="max-w-xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-[rgba(201,168,74,0.9)]">
            {subPick(orderSubmissionCopy.successTitle, lang)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[rgba(255,247,226,0.96)]">
            {subPick(orderSubmissionCopy.successHeadline, lang)}
          </h1>
          <p className="text-sm text-[rgba(255,255,255,0.70)] leading-relaxed">
            {subPick(orderSubmissionCopy.successBody, lang)}
          </p>
        </header>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,247,226,0.06)] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(255,247,226,0.55)]">
            {subPick(orderSubmissionCopy.successRefLabel, lang)}
          </p>
          <p className="mt-2 text-lg font-mono font-semibold text-[rgba(201,168,74,0.98)]">{ref}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={withLang("/tienda", lang)}
            className="inline-flex justify-center rounded-full bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] px-6 py-3 text-sm font-semibold hover:brightness-95"
          >
            {subPick(orderSubmissionCopy.successBackTienda, lang)}
          </Link>
          <Link
            href={withLang("/contacto", lang)}
            className="inline-flex justify-center rounded-full border border-[rgba(255,255,255,0.18)] px-6 py-3 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)]"
          >
            {subPick(orderSubmissionCopy.successContact, lang)}
          </Link>
        </div>
      </div>
    </TiendaOrderShell>
  );
}
