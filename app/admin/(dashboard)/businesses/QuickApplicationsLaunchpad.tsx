"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { adminBtnSecondary } from "../../_components/adminTheme";
import { copyToClipboard, tryWebShare } from "@/app/components/cta/ctaLaunchers";
import { formatRevenuePriceLabel, getRevenuePackagePriceCents } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { listQuickClassifiedDefinitions } from "@/app/lib/quickClassifieds/quickClassifiedRegistry";
import {
  quickClassifiedCategoryPath,
  quickClassifiedMyAdPath,
  quickClassifiedShareUrl,
  quickClassifiedsChooserPath,
} from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import type { QuickClassifiedCategoryKey, QuickClassifiedDefinition } from "@/app/lib/quickClassifieds/quickClassifiedTypes";

/**
 * APLICACIONES RÁPIDAS / QUICK APPLICATIONS — the staff launchpad inside the ONE Business Concierge PWA.
 *
 * Additive only: sits directly under the Command Center header so staff never dig through notes, meetings,
 * research or Creative Studio to publish or help a customer. Every action is a link or a share of an EXISTING
 * public route (/publicar/rapido/*). Staff never publish under their own identity here: the customer signs in
 * with their own account on the existing publish gate, so the ad stays in the customer's name. Customers with a
 * Business record keep using the existing Create-for-Client handoff (linked below, unchanged).
 */

type LinkLang = "es" | "en";

function priceBadge(def: QuickClassifiedDefinition): string {
  if (def.pricing.kind === "free") return "Gratis / Free";
  const { priceCents } = getRevenuePackagePriceCents({ category: def.pricing.category, packageKey: def.pricing.packageKey });
  return priceCents == null ? "" : formatRevenuePriceLabel(priceCents);
}

function origin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

export function QuickApplicationsLaunchpad() {
  const [linkLang, setLinkLang] = useState<LinkLang>("es");
  const [toast, setToast] = useState<string | null>(null);
  const definitions = listQuickClassifiedDefinitions();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyLink = useCallback(
    async (category: QuickClassifiedCategoryKey | null) => {
      const ok = await copyToClipboard(quickClassifiedShareUrl(origin(), category, linkLang));
      flash(ok ? "Enlace copiado / Link copied" : "No se pudo copiar / Could not copy");
    },
    [flash, linkLang],
  );

  const shareLink = useCallback(
    async (def: QuickClassifiedDefinition | null) => {
      const url = quickClassifiedShareUrl(origin(), def?.key ?? null, linkLang);
      const label = def ? (linkLang === "en" ? def.label.en : def.label.es) : linkLang === "en" ? "Leonix quick publish" : "Publicación rápida Leonix";
      const text = linkLang === "en" ? `Publish your ad on Leonix in minutes: ${label}` : `Publica tu anuncio en Leonix en minutos: ${label}`;
      const outcome = await tryWebShare({ title: label, text, url });
      if (outcome === "unsupported") {
        const ok = await copyToClipboard(url);
        flash(ok ? "Enlace copiado / Link copied" : "No se pudo compartir / Could not share");
      }
    },
    [flash, linkLang],
  );

  return (
    <section
      id="quick-applications"
      aria-labelledby="quick-applications-title"
      className="mt-4 scroll-mt-4 rounded-2xl border-2 border-[#C9A84A]/80 bg-gradient-to-br from-[#FFF6E7] via-[#FFFDF7] to-[#FAF6EE] p-4 shadow-[0_14px_36px_-18px_rgba(122,30,44,0.35)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Publicar con el cliente / Publish with the customer</p>
          <h2 id="quick-applications-title" className="mt-1 font-serif text-2xl font-bold leading-tight text-[#1E1810] sm:text-3xl">
            ⚡ Aplicaciones Rápidas / Quick Applications
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]">
            Comparte el enlace o ábrelo con el cliente. El cliente inicia sesión con su correo y el anuncio queda a su nombre. /
            Share the link or open it with the customer. The customer signs in with their email and the ad stays in their name.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[#E8DFD0] bg-white p-1" role="group" aria-label="Idioma del enlace / Link language">
          {(["es", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={linkLang === l}
              onClick={() => setLinkLang(l)}
              className={`min-h-[44px] rounded-lg px-3 text-xs font-bold uppercase ${linkLang === l ? "bg-[#7A1E2C] text-white" : "text-[#7A7164]"}`}
            >
              {l === "es" ? "Español" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void copyLink(null)} className={`${adminBtnSecondary} min-h-[44px] border-[#C9A84A]/70 text-xs`}>
          🔗 Copiar enlace general / Copy general link
        </button>
        <button type="button" onClick={() => void shareLink(null)} className={`${adminBtnSecondary} min-h-[44px] border-[#C9A84A]/70 text-xs`}>
          📤 Compartir enlace general / Share general link
        </button>
        <Link href={quickClassifiedMyAdPath(linkLang)} target="_blank" rel="noreferrer" className={`${adminBtnSecondary} min-h-[44px] border-[#C9A84A]/70 text-xs`}>
          🗂️ Mi anuncio (cliente) / Customer My-Ad page
        </Link>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {definitions.map((def) => {
          const blocked = def.status === "blocked";
          const badge = priceBadge(def);
          const openHref = blocked ? `${def.standardApplicationPath}?lang=${linkLang}` : quickClassifiedCategoryPath(def.key, linkLang, "staff");
          return (
            <li key={def.key} className="flex flex-col rounded-2xl border border-[#D6C7AD] bg-white p-3">
              <div className="flex items-start gap-2">
                <span className="text-2xl leading-none" aria-hidden="true">{def.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#1E1810]">
                    {def.label.es} / {def.label.en}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#7A7164]">
                    {blocked ? "Aplicación estándar / Standard application" : `${badge}${def.essentialQuestionCount ? ` · ≈ ${def.essentialQuestionCount} preguntas / questions` : ""}`}
                  </p>
                  {blocked && def.blocker ? <p className="mt-1 text-[11px] text-[#7A1E2C]">{def.blocker.reason.es} / {def.blocker.reason.en}</p> : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <Link
                  href={openHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#7A1E2C] px-3 text-xs font-bold text-white"
                >
                  {blocked ? "Abrir aplicación estándar / Open standard application" : "Abrir con el cliente / Open with customer"}
                </Link>
                {blocked ? null : (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => void copyLink(def.key)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
                      🔗 Copiar / Copy
                    </button>
                    <button type="button" onClick={() => void shareLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
                      📤 Compartir / Share
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-2 text-[11px] text-[#7A7164] sm:flex-row sm:items-center sm:justify-between">
        <p>
          ¿El cliente tiene un negocio registrado? Usa el flujo existente. / Does the customer have a Business record? Use the existing flow.{" "}
          <Link href="/admin/businesses/create-for-client" className="font-semibold text-[#7A1E2C] underline">
            Crear para el cliente / Create for Client
          </Link>
        </p>
        <Link href={quickClassifiedsChooserPath(linkLang, "staff")} target="_blank" rel="noreferrer" className="font-semibold text-[#7A1E2C] underline">
          Ver el selector rápido / View the quick chooser
        </Link>
      </div>

      {toast ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
          {toast}
        </p>
      ) : null}
    </section>
  );
}
