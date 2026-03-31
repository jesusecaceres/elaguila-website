"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lang } from "../../types/tienda";
import type { TiendaOrderAssetReference } from "../../types/tiendaStoredAssets";
import { subPick, orderSubmissionCopy } from "../../data/orderSubmissionCopy";
import { withLang } from "../../utils/tiendaRouting";
import { TiendaOrderShell } from "./TiendaOrderShell";

const REF_RE = /^LX-TND-[A-Z0-9]+-[A-F0-9]{8}$/i;

export function TiendaOrderCompleteClient(props: { orderRef: string; lang: Lang }) {
  const { orderRef, lang } = props;
  const valid = REF_RE.test(orderRef.trim());
  const [staffAssets, setStaffAssets] = useState<TiendaOrderAssetReference[] | null>(null);
  const [emailWarn, setEmailWarn] = useState(false);

  useEffect(() => {
    if (!valid) return;
    const id = orderRef.trim().toUpperCase();
    try {
      const raw = sessionStorage.getItem(`tienda-order-complete-${id}`);
      if (!raw) {
        setStaffAssets(null);
      } else {
        const parsed = JSON.parse(raw) as { assets?: TiendaOrderAssetReference[]; emailDelivered?: boolean };
        setStaffAssets(Array.isArray(parsed.assets) ? parsed.assets : null);
      }
      setEmailWarn(sessionStorage.getItem(`tienda-email-warn-${id}`) === "1");
    } catch {
      setStaffAssets(null);
      setEmailWarn(false);
    }
  }, [orderRef, valid]);

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

        {emailWarn ? (
          <p className="rounded-2xl border border-[rgba(220,160,90,0.45)] bg-[rgba(220,160,90,0.12)] px-4 py-3 text-sm text-[rgba(255,230,200,0.95)]">
            {subPick(orderSubmissionCopy.warnEmailNotSent, lang)}
          </p>
        ) : null}

        {staffAssets && staffAssets.length > 0 ? (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.25)] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[rgba(201,168,74,0.95)]">
              {subPick(orderSubmissionCopy.staffDownloadsHeading, lang)}
            </h2>
            <p className="text-xs text-[rgba(255,255,255,0.62)]">{subPick(orderSubmissionCopy.staffDownloadsHint, lang)}</p>
            <ul className="space-y-2 text-sm">
              {staffAssets
                .slice()
                .sort((a, b) => a.role.localeCompare(b.role))
                .map((a) => (
                  <li key={`${a.role}-${a.storagePath}`} className="rounded-lg bg-[rgba(255,255,255,0.04)] px-3 py-2">
                    <div className="font-mono text-xs text-[rgba(201,168,74,0.9)]">{a.role}</div>
                    <div className="text-[rgba(255,247,226,0.88)] break-all">{a.originalFilename}</div>
                    <a
                      href={a.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1 text-xs text-[rgba(120,180,255,0.95)] hover:underline"
                    >
                      {lang === "en" ? "Open / download" : "Abrir / descargar"}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

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
