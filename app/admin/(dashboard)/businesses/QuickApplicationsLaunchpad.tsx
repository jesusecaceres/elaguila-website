"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { adminBtnPrimary, adminBtnSecondary } from "../../_components/adminTheme";
import { ADMIN_DASHBOARD_ROUTES } from "../../_lib/adminDashboardRoutes";
import { buildConciergeInventoryHref } from "../../_lib/conciergeIntent";
import { copyToClipboard, tryWebShare } from "@/app/components/cta/ctaLaunchers";
import { formatRevenuePriceLabel, getRevenuePackagePriceCents } from "@/app/lib/listingPlans/revenuePricingMatrix";
import {
  QUICK_CLASSIFIED_DEFINITIONS,
  QUICK_COMMUNITY_KEYS,
  QUICK_TIER1_KEYS,
} from "@/app/lib/quickClassifieds/quickClassifiedRegistry";
import {
  quickClassifiedCategoryPath,
  quickClassifiedMyAdPath,
  quickClassifiedShareUrl,
  quickClassifiedsChooserPath,
} from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import type { QuickClassifiedCategoryKey, QuickClassifiedDefinition } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import { listQuickBusinessDefinitions } from "@/app/lib/quickBusiness/quickBusinessRegistry";
import { quickBusinessCategoryPath, quickBusinessChooserPath, quickBusinessShareUrl } from "@/app/lib/quickBusiness/quickBusinessRoutes";
import type { QuickBusinessDefinition } from "@/app/lib/quickBusiness/quickBusinessTypes";
import { listQuickRemainingDefinitions } from "@/app/lib/quickRemaining/quickRemainingRegistry";
import type { QuickRemainingDefinition } from "@/app/lib/quickRemaining/quickRemainingRegistry";

/**
 * APLICACIONES RÁPIDAS / QUICK APPLICATIONS — the staff launchpad inside the ONE Business Concierge PWA.
 *
 * Additive only: sits directly under the Command Center header so a receptionist sees, within seconds, how to
 * CREATE a quick ad, SEND a quick link, MANAGE an ad, or open the FULL business profile / full Concierge.
 * Tier-1 lanes (En Venta, Rentas, Empleos, Autos — PM Control Master §22) come first and large; the community
 * family (already short canonical forms) shares its DIRECT canonical application link instead of a wrapper.
 * Every action is a link or a share of an EXISTING route. Staff never publish under their own identity here:
 * the customer signs in with their own account on the existing publish gate, so the ad stays in the customer's
 * name. Customers with a Business record keep using the existing Create-for-Client handoff (linked, unchanged).
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

function withLang(path: string, lang: LinkLang): string {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

/** Tier-1 → Quick intake route; community family → its existing short canonical application (direct link). */
function customerPath(def: QuickClassifiedDefinition, lang: LinkLang): string {
  const isCommunity = (QUICK_COMMUNITY_KEYS as readonly string[]).includes(def.key);
  if (isCommunity || def.status === "blocked") return withLang(def.standardApplicationPath, lang);
  return quickClassifiedCategoryPath(def.key, lang, "staff");
}

function customerUrl(def: QuickClassifiedDefinition | null, lang: LinkLang): string {
  if (!def) return quickClassifiedShareUrl(origin(), null, lang);
  return `${origin().replace(/\/+$/, "")}${customerPath(def, lang)}`;
}

const FSBO: QuickClassifiedCategoryKey = "bienes-raices";

/** Quick Business (Phase 2 core): monthly price badge from the server pricing authority. */
function businessPriceBadge(def: QuickBusinessDefinition): string {
  const { priceCents } = getRevenuePackagePriceCents({ category: def.pricing.category, packageKey: def.pricing.packageKey });
  return priceCents == null ? "" : `${formatRevenuePriceLabel(priceCents)}/mes · /month`;
}

/** Live business categories → Quick Business intake; a "direct" one (none since the Dealer + Bienes closeout) → the EXISTING application. */
function businessCustomerPath(def: QuickBusinessDefinition, lang: LinkLang): string {
  if (def.status === "direct") return withLang(def.standardApplicationPath, lang);
  return quickBusinessCategoryPath(def.key, lang, "staff");
}

function businessCustomerUrl(def: QuickBusinessDefinition | null, lang: LinkLang): string {
  if (!def) return quickBusinessShareUrl(origin(), null, lang);
  return `${origin().replace(/\/+$/, "")}${businessCustomerPath(def, lang)}`;
}

/** Lower-priority remaining families (Phase 3): `def.href` is already the technically correct
 * destination per family (a new Quick form, the existing application, or a pure content directory)
 * — never a wrapper. */
function remainingCustomerUrl(def: QuickRemainingDefinition, lang: LinkLang): string {
  return `${origin().replace(/\/+$/, "")}${withLang(def.href, lang)}`;
}

function remainingPriceBadge(def: QuickRemainingDefinition): string {
  if (!def.pricing) return "";
  const { priceCents } = getRevenuePackagePriceCents({ category: def.pricing.category, packageKey: def.pricing.packageKey });
  return priceCents == null ? "" : `${formatRevenuePriceLabel(priceCents)}/mes · /month`;
}

/** Truthful verb per action kind — never "Crear" when nothing is created. */
function remainingCtaLabel(def: QuickRemainingDefinition): string {
  if (def.action === "quick_form") return "Crear con el cliente / Create with customer";
  if (def.action === "direct_link") return "Abrir formulario / Open application";
  return "Abrir directorio / Open directory";
}

export function QuickApplicationsLaunchpad() {
  const [linkLang, setLinkLang] = useState<LinkLang>("es");
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyLink = useCallback(
    async (def: QuickClassifiedDefinition | null) => {
      const ok = await copyToClipboard(customerUrl(def, linkLang));
      flash(ok ? "Enlace copiado / Link copied" : "No se pudo copiar / Could not copy");
    },
    [flash, linkLang],
  );

  const shareLink = useCallback(
    async (def: QuickClassifiedDefinition | null) => {
      const url = customerUrl(def, linkLang);
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

  const copyBusinessLink = useCallback(
    async (def: QuickBusinessDefinition | null) => {
      const ok = await copyToClipboard(businessCustomerUrl(def, linkLang));
      flash(ok ? "Enlace copiado / Link copied" : "No se pudo copiar / Could not copy");
    },
    [flash, linkLang],
  );

  const shareBusinessLink = useCallback(
    async (def: QuickBusinessDefinition | null) => {
      const url = businessCustomerUrl(def, linkLang);
      const label = def ? (linkLang === "en" ? def.label.en : def.label.es) : linkLang === "en" ? "Leonix quick business" : "Negocio rápido Leonix";
      const text = linkLang === "en" ? `Publish your business on Leonix in minutes: ${label}` : `Publica tu negocio en Leonix en minutos: ${label}`;
      const outcome = await tryWebShare({ title: label, text, url });
      if (outcome === "unsupported") {
        const ok = await copyToClipboard(url);
        flash(ok ? "Enlace copiado / Link copied" : "No se pudo compartir / Could not share");
      }
    },
    [flash, linkLang],
  );

  const copyRemainingLink = useCallback(
    async (def: QuickRemainingDefinition) => {
      const ok = await copyToClipboard(remainingCustomerUrl(def, linkLang));
      flash(ok ? "Enlace copiado / Link copied" : "No se pudo copiar / Could not copy");
    },
    [flash, linkLang],
  );

  const shareRemainingLink = useCallback(
    async (def: QuickRemainingDefinition) => {
      const url = remainingCustomerUrl(def, linkLang);
      const label = linkLang === "en" ? def.label.en : def.label.es;
      const text = linkLang === "en" ? `Leonix: ${label}` : `Leonix: ${label}`;
      const outcome = await tryWebShare({ title: label, text, url });
      if (outcome === "unsupported") {
        const ok = await copyToClipboard(url);
        flash(ok ? "Enlace copiado / Link copied" : "No se pudo compartir / Could not share");
      }
    },
    [flash, linkLang],
  );

  const business = listQuickBusinessDefinitions();
  const remaining = listQuickRemainingDefinitions();

  const tier1 = QUICK_TIER1_KEYS.map((k) => QUICK_CLASSIFIED_DEFINITIONS[k]);
  const fsbo = QUICK_CLASSIFIED_DEFINITIONS[FSBO];
  const community = QUICK_COMMUNITY_KEYS.map((k) => QUICK_CLASSIFIED_DEFINITIONS[k]);

  const renderCard = (def: QuickClassifiedDefinition, size: "large" | "compact") => {
    const blocked = def.status === "blocked";
    const badge = priceBadge(def);
    const openHref = customerPath(def, linkLang);
    const isCommunity = (QUICK_COMMUNITY_KEYS as readonly string[]).includes(def.key);
    return (
      <li key={def.key} className={`flex flex-col rounded-2xl border bg-white ${size === "large" ? "border-[#C9A84A]/80 p-4" : "border-[#D6C7AD] p-3"}`}>
        <div className="flex items-start gap-2">
          <span className={size === "large" ? "text-3xl leading-none" : "text-2xl leading-none"} aria-hidden="true">{def.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className={`${size === "large" ? "text-base" : "text-sm"} font-bold text-[#1E1810]`}>
              {def.label.es} / {def.label.en}
            </p>
            <p className="mt-0.5 text-[11px] text-[#7A7164]">
              {blocked ? "Aplicación estándar / Standard application" : isCommunity ? "Formulario corto existente / Existing short form" : `${badge}${def.essentialQuestionCount ? ` · ≈ ${def.essentialQuestionCount} preguntas / questions` : ""}`}
            </p>
            {blocked && def.blocker ? <p className="mt-1 text-[11px] text-[#7A1E2C]">{def.blocker.reason.es} / {def.blocker.reason.en}</p> : null}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          <Link
            href={openHref}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 text-xs font-bold ${size === "large" ? "bg-[#7A1E2C] text-white" : "border border-[#7A1E2C]/40 bg-[#7A1E2C]/5 text-[#7A1E2C]"}`}
          >
            {blocked ? "Abrir aplicación estándar / Open standard application" : "Abrir con el cliente / Open with customer"}
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void copyLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
              🔗 Copiar / Copy
            </button>
            <button type="button" onClick={() => void shareLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
              📤 Compartir / Share
            </button>
          </div>
        </div>
      </li>
    );
  };

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
            El cliente inicia sesión con su correo y el anuncio queda a su nombre. / The customer signs in with their email and the ad stays in their name.
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

      {/* The four verbs a receptionist needs — nothing else to understand first. */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <a href="#quick-tier1" className={`${adminBtnPrimary} min-h-[56px] flex-col gap-0.5 py-2`}>
          <span>➕ Crear anuncio rápido / Create quick ad</span>
          <span className="text-[10px] font-normal text-white/80">Elige la categoría abajo. / Pick the category below.</span>
        </a>
        <button type="button" onClick={() => void shareLink(null)} className={`${adminBtnSecondary} min-h-[56px] flex-col gap-0.5 border-[#C9A84A]/70 py-2`}>
          <span>📤 Enviar enlace rápido / Send quick link</span>
          <span className="text-[10px] font-normal text-[#7A7164]">Compartir o copiar el selector. / Share or copy the chooser.</span>
        </button>
        <Link href={ADMIN_DASHBOARD_ROUTES.classifiedsQueue} className={`${adminBtnSecondary} min-h-[56px] flex-col gap-0.5 border-[#C9A84A]/70 py-2`}>
          <span>🗂️ Administrar anuncio / Manage ad</span>
          <span className="text-[10px] font-normal text-[#7A7164]">Cola de clasificados existente. / Existing classifieds queue.</span>
        </Link>
        <Link href={buildConciergeInventoryHref("business_profile")} className={`${adminBtnSecondary} min-h-[56px] flex-col gap-0.5 border-[#C9A84A]/70 py-2`}>
          <span>🏢 Perfil de Negocio completo / Full Business Profile</span>
          <span className="text-[10px] font-normal text-[#7A7164]">Business Concierge completo abajo. / Full Concierge below.</span>
        </Link>
      </div>

      <h3 id="quick-tier1" className="mt-5 scroll-mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
        Prioridad / Priority
      </h3>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{tier1.map((def) => renderCard(def, "large"))}</ul>

      <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
        Más categorías / More categories
      </h3>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {renderCard(fsbo, "compact")}
        {community.map((def) => renderCard(def, "compact"))}
      </ul>

      {/* Quick Business Core (Phase 2): clearly separated business section — same PWA, same launchpad, existing products. */}
      <div id="quick-business" className="mt-6 scroll-mt-4 rounded-2xl border border-[#7A1E2C]/25 bg-white/70 p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Negocios Rápidos / Quick Business</h3>
            <p className="mt-1 text-xs text-[#5C5346]">
              Perfil de negocio en minutos con el paquete mensual existente. / Business profile in minutes on the existing monthly package.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2">
            <button type="button" onClick={() => void shareBusinessLink(null)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
              📤 Enviar enlace de negocio / Send business link
            </button>
            <Link href={ADMIN_DASHBOARD_ROUTES.classifiedsQueue} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
              🗂️ Administrar negocio / Manage business
            </Link>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {business.map((def) => {
            const direct = def.status === "direct";
            const openHref = businessCustomerPath(def, linkLang);
            return (
              <li key={def.key} className="flex flex-col rounded-2xl border border-[#D6C7AD] bg-white p-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl leading-none" aria-hidden="true">{def.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1E1810]">
                      {def.label.es} / {def.label.en}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7A7164]">
                      {direct ? "Aplicación completa / Full application" : `${businessPriceBadge(def)} · ≈ ${def.essentialQuestionCount} preguntas / questions`}
                    </p>
                    {direct && def.directReason ? <p className="mt-1 text-[11px] text-[#7A1E2C]">{def.directReason.reason.es} / {def.directReason.reason.en}</p> : null}
                    {def.staff.publishForClientSupported ? (
                      <p className="mt-1 text-[11px] text-[#2F6B3A]">{def.staff.note.es} / {def.staff.note.en}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#7A5C1E]">{def.staff.note.es} / {def.staff.note.en}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <Link
                    href={openHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#7A1E2C]/40 bg-[#7A1E2C]/5 px-3 text-xs font-bold text-[#7A1E2C]"
                  >
                    {direct ? "Abrir aplicación completa / Open full application" : "Crear negocio rápido con el cliente / Create quick business with customer"}
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => void copyBusinessLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
                      🔗 Copiar / Copy
                    </button>
                    <button type="button" onClick={() => void shareBusinessLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
                      📤 Compartir / Share
                    </button>
                  </div>
                  {!direct ? (
                    // The EXISTING full application stays one tap away (dealer inventory drawer, agent second-agent / broker blocks, etc.).
                    <Link
                      href={withLang(def.standardApplicationPath, linkLang)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center text-[11px] font-semibold text-[#7A1E2C] underline"
                    >
                      Aplicación completa / Full application
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-[11px] text-[#7A7164]">
          Perfil de Negocio completo: usa el botón de arriba. / Full Business Profile: use the button above.{" "}
          <Link href={quickBusinessChooserPath(linkLang, "staff")} target="_blank" rel="noreferrer" className="font-semibold text-[#7A1E2C] underline">
            Selector de negocio rápido / Quick business chooser
          </Link>
        </p>
      </div>

      {/* Más Opciones (Phase 3, lower priority): Comida Local, Ofertas Locales, Negocios Locales, Viajes,
          Iglesias, Recursos. Each card performs the correct canonical action for its REAL current product —
          a new Quick form only for Comida Local; the existing application for Ofertas/Viajes/Iglesias; a
          directory open+share for Negocios Locales/Recursos. Never "Crear" wording where nothing is created. */}
      <div id="quick-more-options" className="mt-6 scroll-mt-4 rounded-2xl border border-[#D6C7AD] bg-white/70 p-3 sm:p-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Más Opciones / More Options</h3>
        <p className="mt-1 text-xs text-[#5C5346]">
          Categorías de menor prioridad — cada una usa su destino existente correcto. / Lower-priority categories — each one uses its correct existing destination.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {remaining.map((def) => {
            const badge = remainingPriceBadge(def);
            const openHref = withLang(def.href, linkLang);
            return (
              <li key={def.key} className="flex flex-col rounded-2xl border border-[#D6C7AD] bg-white p-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl leading-none" aria-hidden="true">{def.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1E1810]">
                      {def.label.es} / {def.label.en}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7A7164]">
                      {def.action === "quick_form"
                        ? `${badge} · ≈ ${def.essentialQuestionCount ?? ""} preguntas / questions`
                        : def.action === "direct_link"
                          ? "Aplicación existente / Existing application"
                          : "Directorio / Directory"}
                    </p>
                    <p className="mt-1 text-[11px] text-[#7A7164]">{def.note.es} / {def.note.en}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <Link
                    href={openHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#7A1E2C]/40 bg-[#7A1E2C]/5 px-3 text-xs font-bold text-[#7A1E2C]"
                  >
                    {remainingCtaLabel(def)}
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => void copyRemainingLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
                      🔗 Copiar / Copy
                    </button>
                    <button type="button" onClick={() => void shareRemainingLink(def)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
                      📤 Compartir / Share
                    </button>
                  </div>
                  {def.manageHref ? (
                    <Link href={withLang(def.manageHref, linkLang)} target="_blank" rel="noreferrer" className="text-center text-[11px] font-semibold text-[#7A1E2C] underline">
                      Administrar / Manage
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-2 text-[11px] text-[#7A7164] sm:flex-row sm:items-center sm:justify-between">
        <p>
          ¿El cliente tiene un negocio registrado? Usa el flujo existente. / Does the customer have a Business record? Use the existing flow.{" "}
          <Link href="/admin/businesses/create-for-client" className="font-semibold text-[#7A1E2C] underline">
            Crear para el cliente / Create for Client
          </Link>
        </p>
        <span className="flex flex-wrap gap-3">
          <Link href={quickClassifiedMyAdPath(linkLang)} target="_blank" rel="noreferrer" className="font-semibold text-[#7A1E2C] underline">
            Mi anuncio (cliente) / Customer My-Ad page
          </Link>
          <Link href={quickClassifiedsChooserPath(linkLang, "staff")} target="_blank" rel="noreferrer" className="font-semibold text-[#7A1E2C] underline">
            Selector rápido / Quick chooser
          </Link>
          <a href="#businesses-inventory" className="font-semibold text-[#7A1E2C] underline">
            Concierge completo / Full Concierge
          </a>
        </span>
      </div>

      {toast ? (
        <p role="status" aria-live="polite" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
          {toast}
        </p>
      ) : null}
    </section>
  );
}
