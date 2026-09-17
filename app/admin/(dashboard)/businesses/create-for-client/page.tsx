import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnPrimary, adminBtnSecondary, adminCardBase } from "../../../_components/adminTheme";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../_lib/businessWorkspaceAccess";
import { buildConciergeInventoryHref } from "../../../_lib/conciergeIntent";
import { ADMIN_DASHBOARD_ROUTES } from "../../../_lib/adminDashboardRoutes";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import {
  PUBLICAR_GATEWAY_CATEGORY_KEYS,
  publicarGatewayCardCopy,
  publicarGatewayVisual,
  resolvePublicarGatewayDestination,
  type PublicarGatewayCategoryKey,
} from "@/app/(site)/publicar/publicarGatewayResolver";

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

/** Business-facing vs. personal-classified split of the SAME gateway catalog — no new category list. */
const BUSINESS_CATEGORY_KEYS: readonly PublicarGatewayCategoryKey[] = ["servicios", "restaurantes", "autos", "bienes-raices", "ofertas-locales", "comida-local", "travel"];
const CLASSIFIED_CATEGORY_KEYS: readonly PublicarGatewayCategoryKey[] = ["rentas", "en-venta", "empleos", "clases", "comunidad", "busco", "mascotas-y-perdidos"];

/** Categories whose existing draft store this build can pre-seed from Business Identity (Gate 07). */
const PREFILL_SUPPORTED: ReadonlySet<PublicarGatewayCategoryKey> = new Set(["servicios"]);

function categoryHref(key: PublicarGatewayCategoryKey, businessId: string | null, lang: "es" | "en"): { href: string; sameTab: boolean; prefill: boolean } {
  if (businessId && PREFILL_SUPPORTED.has(key)) {
    return {
      href: `/admin/businesses/create-for-client/handoff?businessId=${encodeURIComponent(businessId)}&category=${encodeURIComponent(key)}&lang=${lang}`,
      sameTab: true,
      prefill: true,
    };
  }
  return { href: resolvePublicarGatewayDestination(key, lang), sameTab: false, prefill: false };
}

export default async function CreateForClientPage({ searchParams }: { searchParams?: Promise<{ businessId?: string; lang?: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_list")) {
    redirect("/admin/team?access_denied=1");
  }

  const sp = (await searchParams) ?? {};
  const lang: "es" | "en" = sp.lang === "en" ? "en" : "es";
  const businessId = (sp.businessId ?? "").trim() || null;
  const business = businessId ? await getBusinessByIdForCurrentUser(getAdminSupabase(), businessId) : null;
  // A supplied but unknown id must never silently fall through to "personal" mode.
  const missingBusiness = Boolean(businessId && !business);

  const verifyCategoryKeys = new Set<string>(PUBLICAR_GATEWAY_CATEGORY_KEYS);

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/businesses" className="text-xs font-semibold text-[#7A1E2C] underline">
        ← Business Concierge
      </Link>
      <AdminPageHeader
        eyebrow="Business Concierge"
        title="Crear para el cliente / Create for Client"
        subtitle="Abre la aplicación REAL de la categoría en nombre del cliente. Sin formularios duplicados. / Opens the REAL category application on the client's behalf. No duplicate forms."
      />

      {/* WHO ARE WE HELPING? */}
      <section className={`${adminCardBase} p-4 sm:p-5`}>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">¿A quién ayudamos? / Who are we helping?</h2>
        {business ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-sm text-emerald-900">
              <span className="font-semibold">{business.publicName || business.displayName}</span>
              <span className="text-xs text-emerald-800"> · negocio existente / existing business</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/businesses/${business.id}`} className="text-xs font-semibold text-[#7A1E2C] underline">Abrir negocio / Open business</Link>
              <Link href={buildConciergeInventoryHref("create_listing")} className="text-xs font-semibold text-[#7A1E2C] underline">Cambiar / Change</Link>
            </div>
          </div>
        ) : (
          <>
            {missingBusiness ? <p role="alert" className="mt-2 text-xs text-red-700">Negocio no encontrado. / Business not found.</p> : null}
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Link href={buildConciergeInventoryHref("create_listing")} className={`${adminBtnPrimary} min-h-[56px] flex-col gap-0.5 py-2`}>
                <span>Negocio existente / Existing business</span>
                <span className="text-[10px] font-normal text-white/80">Buscar y seleccionar. / Search and select.</span>
              </Link>
              <Link href="/admin/businesses/canvass?intent=create_listing" className={`${adminBtnSecondary} min-h-[56px] flex-col gap-0.5 py-2`}>
                <span>Negocio nuevo / New business</span>
                <span className="text-[10px] font-normal text-[#7A7164]">Crea el registro canónico primero. / Creates the canonical record first.</span>
              </Link>
              <Link href={`${ADMIN_DASHBOARD_ROUTES.customerOps}`} className={`${adminBtnSecondary} min-h-[56px] flex-col gap-0.5 py-2`}>
                <span>Buscar cuenta del cliente / Find client account</span>
                <span className="text-[10px] font-normal text-[#7A7164]">Búsqueda unificada existente. / Existing unified search.</span>
              </Link>
              <div className={`${adminBtnSecondary} min-h-[56px] cursor-default flex-col gap-0.5 py-2 opacity-90`}>
                <span>Cliente personal / Personal client</span>
                <span className="text-[10px] font-normal text-[#7A7164]">Sin registro de negocio — elige la categoría abajo. / No business record — pick a category below.</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* WHAT ARE WE CREATING? */}
      <section className={`${adminCardBase} p-4 sm:p-5`}>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">¿Qué creamos? / What are we creating?</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Cada tarjeta abre la aplicación real de Leonix. / Each card opens the real Leonix application.
          {business ? " Prefill desde Identidad del Negocio: Servicios y Perfil de Negocio. / Business Identity prefill: Servicios and Business Profile." : ""}
        </p>

        <h3 className="mt-4 text-xs font-bold text-[#3D3428]">Negocio / Business</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {business ? (
            <Link href={`/admin/businesses/${business.id}#business-profile`} className="rounded-xl border border-[#C9A84A]/70 bg-[#FFFDF7] p-3 text-left hover:bg-[#FAF6EE]">
              <span className="block text-sm font-semibold text-[#1E1810]">🏢 Perfil de Negocio / Business Profile</span>
              <span className="mt-0.5 block text-[11px] text-[#7A7164]">Prefill ✓ · vista previa privada / private preview</span>
            </Link>
          ) : (
            <Link href={buildConciergeInventoryHref("business_profile")} className="rounded-xl border border-dashed border-[#C9A84A]/70 bg-[#FFFDF7] p-3 text-left hover:bg-[#FAF6EE]">
              <span className="block text-sm font-semibold text-[#1E1810]">🏢 Perfil de Negocio / Business Profile</span>
              <span className="mt-0.5 block text-[11px] text-[#7A7164]">Requiere un negocio — selecciona uno. / Needs a business — select one.</span>
            </Link>
          )}
          {BUSINESS_CATEGORY_KEYS.filter((k) => verifyCategoryKeys.has(k)).map((key) => {
            const copy = publicarGatewayCardCopy(key, lang);
            const visual = publicarGatewayVisual(key);
            const target = categoryHref(key, business?.id ?? null, lang);
            return (
              <Link key={key} href={target.href} target={target.sameTab ? undefined : "_blank"} rel={target.sameTab ? undefined : "noreferrer"} className={`rounded-xl border ${visual.border} bg-gradient-to-br ${visual.tint} p-3 text-left hover:opacity-90`}>
                <span className="block text-sm font-semibold text-[#1E1810]">{visual.emoji} {copy.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#7A7164]">{target.prefill ? "Prefill ✓ · " : ""}{copy.description}</span>
              </Link>
            );
          })}
        </div>

        <h3 className="mt-5 text-xs font-bold text-[#3D3428]">Clasificado personal / Personal classified</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CLASSIFIED_CATEGORY_KEYS.filter((k) => verifyCategoryKeys.has(k)).map((key) => {
            const copy = publicarGatewayCardCopy(key, lang);
            const visual = publicarGatewayVisual(key);
            const target = categoryHref(key, business?.id ?? null, lang);
            return (
              <Link key={key} href={target.href} target="_blank" rel="noreferrer" className={`rounded-xl border ${visual.border} bg-gradient-to-br ${visual.tint} p-3 text-left hover:opacity-90`}>
                <span className="block text-sm font-semibold text-[#1E1810]">{visual.emoji} {copy.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#7A7164]">{copy.description}</span>
              </Link>
            );
          })}
        </div>

        <p className="mt-4 rounded-xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/70 p-3 text-[11px] text-[#7A7164]">
          Importante: las aplicaciones de categoría guardan y publican con la cuenta del SITIO Leonix conectada en este dispositivo (no con tu sesión de Admin), y esa cuenta queda como dueña técnica del anuncio. Qué cuenta de custodia usa Leonix para anuncios gestionados es una decisión del dueño — no publiques para un cliente desde una cuenta personal. El Perfil de Negocio no tiene esta limitación: se guarda con tu sesión de staff. / Important: category applications save and publish under the Leonix SITE account signed in on this device (not your Admin session), and that account becomes the listing&apos;s technical owner. Which custody account Leonix uses for managed listings is an owner decision — do not publish for a client from a personal account. Business Profile has no such limitation: it saves under your staff session.
        </p>
      </section>

      <section className={`${adminCardBase} p-4 sm:p-5`}>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">Atajos comerciales / Commercial shortcuts</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href={ADMIN_DASHBOARD_ROUTES.promoCodes} className={`${adminBtnSecondary} min-h-[40px] text-xs`}>Código promo / Promo code</Link>
          <Link href={ADMIN_DASHBOARD_ROUTES.paymentTracker} className={`${adminBtnSecondary} min-h-[40px] text-xs`}>Rastreador de pagos / Payment tracker</Link>
          <Link href={`${ADMIN_DASHBOARD_ROUTES.paymentTracker}/manual-payment`} className={`${adminBtnSecondary} min-h-[40px] text-xs`}>Pago manual (efectivo/cheque/Zelle) / Manual payment</Link>
          <Link href={ADMIN_DASHBOARD_ROUTES.packageEntitlements} className={`${adminBtnSecondary} min-h-[40px] text-xs`}>Paquetes / Package entitlements</Link>
        </div>
      </section>
    </div>
  );
}
