"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { adminBtnPrimary, adminBtnSecondary } from "../../_components/adminTheme";
import { ADMIN_DASHBOARD_ROUTES } from "../../_lib/adminDashboardRoutes";
import { buildConciergeInventoryHref } from "../../_lib/conciergeIntent";
import { copyToClipboard, tryWebShare } from "@/app/components/cta/ctaLaunchers";
import { quickClassifiedShareUrl } from "@/app/lib/quickClassifieds/quickClassifiedRoutes";
import { buildQuickSalesHref } from "@/app/lib/sales/quickSalesRoutes";
import {
  STAFF_MASTER_LAUNCHER_ITEMS,
  staffCustomerQuickLinkItems,
} from "@/app/lib/sales/staffMasterLauncher";

/**
 * ENLACES PARA EL CLIENTE / CUSTOMER SELF-SERVICE LINKS — the launchpad inside the Business Concierge PWA.
 *
 * QUICK SALES ENTRY CONSOLIDATION — this component is now ONLY about links the CUSTOMER opens on
 * the customer's own device: copy or share a category's self-service application, where the customer
 * signs in with their own email and the ad stays in their name. It no longer renders any "open with
 * the customer" / "create with the customer" button, because every one of those opened a PUBLIC
 * application on the STAFF member's browser — the exact path that ended at a customer login prompt,
 * or worse, saved the ad under whatever site account that browser happened to hold.
 *
 * Creating a Leonix-MANAGED ad (staff builds it, Leonix holds custody, customer never logs in) has
 * exactly one entry: the Quick Sales cockpit (`/admin/workspace/quick-sales`). The four paid
 * business cards link there with the category preselected; the top verb links there directly.
 *
 * Every URL below is an EXISTING public route; nothing is wrapped or duplicated.
 */

type LinkLang = "es" | "en";

function origin(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function withLang(path: string, lang: LinkLang): string {
  return path.includes("?") ? `${path}&lang=${lang}` : `${path}?lang=${lang}`;
}

export function QuickApplicationsLaunchpad() {
  const [linkLang, setLinkLang] = useState<LinkLang>("es");
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyUrl = useCallback(
    async (url: string) => {
      const ok = await copyToClipboard(url);
      flash(ok ? "Enlace copiado / Link copied" : "No se pudo copiar / Could not copy");
    },
    [flash],
  );

  const shareUrl = useCallback(
    async (url: string, label: string, text: string) => {
      const outcome = await tryWebShare({ title: label, text, url });
      if (outcome === "unsupported") {
        const ok = await copyToClipboard(url);
        flash(ok ? "Enlace copiado / Link copied" : "No se pudo compartir / Could not share");
      }
    },
    [flash],
  );

  const shareChooser = useCallback(() => {
    const label = linkLang === "en" ? "Leonix application" : "Solicitud Leonix";
    const url = quickClassifiedShareUrl(origin(), null, linkLang);
    return shareUrl(url, label, label);
  }, [linkLang, shareUrl]);

  const copyShare = (url: string, onShare: () => Promise<void>) => (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => void copyUrl(url)} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
        🔗 Copiar / Copy
      </button>
      <button type="button" onClick={() => void onShare()} className={`${adminBtnSecondary} min-h-[44px] text-xs`}>
        📤 Compartir / Share
      </button>
    </div>
  );

  return (
    <section
      id="quick-applications"
      aria-labelledby="quick-applications-title"
      className="mt-4 scroll-mt-4 rounded-2xl border-2 border-[#C9A84A]/80 bg-gradient-to-br from-[#FFF6E7] via-[#FFFDF7] to-[#FAF6EE] p-4 shadow-[0_14px_36px_-18px_rgba(122,30,44,0.35)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Enlaces de solicitud del cliente / Customer application links</p>
          <h2 id="quick-applications-title" className="mt-1 font-serif text-2xl font-bold leading-tight text-[#1E1810] sm:text-3xl">
            Enviar solicitud al cliente / Send customer application
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]">
            El cliente abre el enlace en SU teléfono. No es un enlace de admin. / The customer opens the link on THEIR phone. This is not an admin link.
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

      {/* The four verbs a receptionist needs. The ONLY create verb goes to the Quick Sales cockpit. */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={buildQuickSalesHref({ lang: linkLang })} data-quick-sales-entry="launchpad" className={`${adminBtnPrimary} min-h-[56px] flex-col gap-0.5 py-2`}>
          <span>Crear anuncio gestionado / Create managed ad</span>
          <span className="text-[10px] font-normal text-white/80">Todas las categorías. / Every category.</span>
        </Link>
        <button type="button" onClick={() => void shareChooser()} className={`${adminBtnSecondary} min-h-[56px] flex-col gap-0.5 border-[#C9A84A]/70 py-2`}>
          <span>Enviar solicitud al cliente / Send customer application</span>
          <span className="text-[10px] font-normal text-[#7A7164]">Copia o comparte el enlace. / Copy or share the link.</span>
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
        Ocho solicitudes Quick / Eight Quick applications
      </h3>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {staffCustomerQuickLinkItems().map((row) => {
          const href = row.customerCheckpointHref || row.customerHref;
          if (!href) return null;
          const url = `${origin().replace(/\/+$/, "")}${withLang(href, linkLang)}`;
          return (
            <li key={row.id} data-customer-quick-link={row.id} className="flex flex-col rounded-2xl border border-[#C9A84A]/80 bg-white p-4">
              <p className="text-sm font-bold text-[#1E1810]">{row.labelEs} / {row.labelEn}</p>
              <p className="mt-1 text-[11px] text-[#7A7164]">{href}</p>
              <div className="mt-3">{copyShare(url, () => shareUrl(url, row.labelEs, row.labelEn))}</div>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
        Otras solicitudes del cliente / Other customer applications
      </h3>
      <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STAFF_MASTER_LAUNCHER_ITEMS.filter((row) => !row.customerQuickLink && row.customerHref).map((row) => {
          const href = row.customerCheckpointHref || row.customerHref;
          if (!href) return null;
          const url = `${origin().replace(/\/+$/, "")}${withLang(href, linkLang)}`;
          return (
            <li key={row.id} data-customer-other-link={row.id} className="flex flex-col rounded-2xl border border-[#D6C7AD] bg-white p-3">
              <p className="text-sm font-bold text-[#1E1810]">{row.labelEs} / {row.labelEn}</p>
              <div className="mt-3">{copyShare(url, () => shareUrl(url, row.labelEs, row.labelEn))}</div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-2 text-[11px] text-[#7A7164] sm:flex-row sm:items-center sm:justify-between">
        <p>
          ¿Anuncio gestionado por Leonix para un negocio existente? / Leonix-managed ad for an existing business?{" "}
          <Link href="/admin/businesses/create-for-client" className="font-semibold text-[#7A1E2C] underline">
            Crear para el cliente / Create for Client
          </Link>
        </p>
        <span className="flex flex-wrap gap-3">
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
