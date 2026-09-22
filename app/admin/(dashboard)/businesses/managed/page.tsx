import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase } from "../../../_components/adminTheme";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../_lib/businessWorkspaceAccess";
import { ADMIN_DASHBOARD_ROUTES } from "../../../_lib/adminDashboardRoutes";
import { listLeonixManagedRows, managedRowMatchesFilter, normalizeManagedFilter, MANAGED_FILTERS, type ManagedFilter } from "../../../_lib/leonixManagedInventory";
import { BROAD_BUSINESS_TYPES } from "@/app/lib/business/constants";
import { buildQuickSalesHref } from "@/app/lib/sales/quickSalesRoutes";

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

const FILTER_LABEL: Record<ManagedFilter, string> = {
  all: "Todos / All",
  draft: "Borrador / Draft",
  published: "Publicado / Published",
  not_released: "No entregado / Not released",
  claim_pending: "Reclamo pendiente / Claim pending",
  claimed: "Reclamado / Claimed",
  not_eligible: "Esperando pago / Awaiting payment",
  eligible: "Listo para publicar / Ready to publish",
};

const COMMERCIAL_LABEL: Record<string, string> = {
  not_purchased: "No comprado / Not purchased",
  active: "Activo / Active",
  complimentary: "Cortesía / Complimentary",
  expired: "Expirado / Expired",
};

function badge(text: string, tone: "muted" | "amber" | "emerald" | "sky") {
  const cls = tone === "emerald" ? "bg-emerald-100 text-emerald-800" : tone === "amber" ? "bg-amber-100 text-amber-900" : tone === "sky" ? "bg-sky-100 text-sky-800" : "bg-[#EDE6D6] text-[#7A7164]";
  return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{text}</span>;
}

export default async function LeonixManagedPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_list")) {
    redirect("/admin/team?access_denied=1");
  }

  const sp = (await searchParams) ?? {};
  const filter = normalizeManagedFilter(sp.filter);
  const { rows, truncated } = await listLeonixManagedRows();
  const visible = rows.filter((r) => managedRowMatchesFilter(r, filter));
  const typeLabel = (v: string) => BROAD_BUSINESS_TYPES.find((o) => o.value === v)?.en ?? v;

  return (
    <div className="max-w-6xl space-y-6">
      <Link href="/admin/businesses" className="text-xs font-semibold text-[#7A1E2C] underline">← Business Concierge</Link>
      <AdminPageHeader
        eyebrow="Business Concierge"
        title="Gestionado por Leonix / Leonix Managed"
        subtitle="Negocios que Leonix está preparando: perfil, estado comercial y entrega al cliente — de la misma verdad canónica. / Businesses Leonix is preparing: profile, commercial state and client handoff — from the same canonical truth."
      />

      <div className="flex flex-wrap gap-2">
        {MANAGED_FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/businesses/managed" : `/admin/businesses/managed?filter=${f}`}
            className={`inline-flex min-h-[36px] items-center rounded-full border px-3 py-1 text-xs font-semibold ${filter === f ? "border-[#7A1E2C] bg-[#7A1E2C] text-white" : "border-[#E8DFD0] bg-white text-[#3D3428]"}`}
          >
            {FILTER_LABEL[f]}
          </Link>
        ))}
      </div>

      <p className="text-xs text-[#7A7164]">
        {visible.length} de / of {rows.length}{truncated ? "+" : ""} negocios asistidos por staff / staff-assisted businesses.
      </p>

      {visible.length === 0 ? (
        <p className={`${adminCardBase} p-6 text-center text-sm text-[#7A7164]`}>Nada aquí todavía. / Nothing here yet.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.businessId} className={`${adminCardBase} p-4`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <Link href={`/admin/businesses/${r.businessId}`} className="text-sm font-bold text-[#1E1810] hover:underline">
                    {r.publicName || r.displayName}
                  </Link>
                  <p className="text-xs text-[#7A7164]">{typeLabel(r.broadBusinessType)} · {r.linkedListingCount} anuncio(s) vinculado(s) / linked listing(s)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {badge(r.profileStatus === "published" ? "Perfil publicado / Profile published" : r.profileStatus === "draft" ? "Perfil borrador / Profile draft" : "Sin perfil / No profile", r.profileStatus === "published" ? "emerald" : r.profileStatus === "draft" ? "amber" : "muted")}
                    {badge(COMMERCIAL_LABEL[r.commercial] ?? r.commercial, r.commercialEligible ? (r.commercial === "complimentary" ? "sky" : "emerald") : r.commercial === "expired" ? "amber" : "muted")}
                    {badge(r.ownership === "claimed" ? "Reclamado / Claimed" : r.ownership === "claim_pending" ? "Reclamo pendiente / Claim pending" : "No entregado / Not released", r.ownership === "claimed" ? "emerald" : r.ownership === "claim_pending" ? "amber" : "muted")}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-[#7A1E2C]">→ {r.nextAction}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-[46%] lg:justify-end">
                  <Link href={`/admin/businesses/${r.businessId}#business-profile`} className={`${adminBtnSecondary} min-h-[36px] text-xs`}>Editar perfil / Edit profile</Link>
                  {r.profileStatus !== "none" ? (
                    <Link href={`/admin/businesses/${r.businessId}/profile/preview`} target="_blank" rel="noreferrer" className={`${adminBtnSecondary} min-h-[36px] text-xs`}>Vista previa / Preview</Link>
                  ) : null}
                  <Link href={buildQuickSalesHref({ businessId: r.businessId })} data-quick-sales-entry="managed" className={`${adminBtnSecondary} min-h-[36px] text-xs`}>⚡ Crear anuncio gestionado / Create managed ad</Link>
                  <Link href={`${ADMIN_DASHBOARD_ROUTES.paymentTracker}/manual-payment`} className={`${adminBtnSecondary} min-h-[36px] text-xs`}>Registrar pago / Record payment</Link>
                  <Link href={ADMIN_DASHBOARD_ROUTES.promoCodes} className={`${adminBtnSecondary} min-h-[36px] text-xs`}>Promo</Link>
                  {r.profileStatus !== "none" && r.ownership === "not_released" ? (
                    <Link href={`/admin/businesses/${r.businessId}#business-profile`} className={`${adminBtnSecondary} min-h-[36px] border-[#C9A84A]/70 text-xs text-[#7A1E2C]`}>Entregar al cliente / Release to client</Link>
                  ) : null}
                  {r.ownership !== "not_released" ? (
                    <Link href={`/admin/businesses/${r.businessId}#ownership-claim`} className={`${adminBtnSecondary} min-h-[36px] text-xs`}>Reclamo / Claim</Link>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="rounded-xl border border-dashed border-[#D6C7AD] bg-[#FAF7F2]/70 p-3 text-[11px] text-[#7A7164]">
        Nota: los borradores de aplicaciones de categoría (Servicios, Rentas, En Venta, etc.) viven en el navegador del operador hasta que se publican, por lo que no aparecen aquí; los perfiles de negocio y los anuncios vinculados sí. / Note: category application drafts (Servicios, Rentas, En Venta, etc.) live in the operator&apos;s browser until published, so they do not appear here; Business Profiles and linked listings do.
      </p>
    </div>
  );
}
