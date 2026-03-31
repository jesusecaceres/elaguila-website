"use client";

import Link from "next/link";
import type { Lang } from "../../types/tienda";
import { ohPick, orderHandoffCopy } from "../../data/orderHandoffCopy";
import { withLang } from "../../utils/tiendaRouting";

export function TiendaOrderCTA(props: { lang: Lang }) {
  const { lang } = props;
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.35)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[rgba(255,247,226,0.88)]">{ohPick(orderHandoffCopy.ctaHelp, lang)}</p>
        <p className="mt-1 text-xs text-[rgba(255,255,255,0.55)]">{ohPick(orderHandoffCopy.ctaHelpHint, lang)}</p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row-reverse gap-3 w-full sm:w-auto sm:items-center">
        <button
          type="submit"
          className="inline-flex justify-center items-center rounded-full px-6 py-2.5 text-sm font-semibold bg-[color:var(--lx-gold)] text-[color:var(--lx-text)] hover:brightness-95 shadow-[0_12px_34px_rgba(201,168,74,0.22)]"
        >
          {ohPick(orderHandoffCopy.ctaContinue, lang)}
        </button>
        <Link
          href={withLang("/contacto", lang)}
          className="inline-flex justify-center items-center rounded-full border border-[rgba(255,255,255,0.18)] px-5 py-2.5 text-sm font-semibold hover:bg-[rgba(255,255,255,0.06)]"
        >
          {lang === "en" ? "Contact Leonix" : "Contactar Leonix"}
        </Link>
      </div>
    </div>
  );
}
