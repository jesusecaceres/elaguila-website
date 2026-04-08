import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary, adminInputClass, adminReadOnlyBadgeClass, adminStubBadgeClass } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminSupportPage() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminReadOnlyBadgeClass}>Parcial</span>
        <span className={adminStubBadgeClass}>Tickets no modelados</span>
      </div>
      <AdminPageHeader
        title="Support"
        subtitle="Operator console for user assistance. Ticket ingestion is not modeled yet — use user search + Ads/Reports for live data."
        helperText="Usuarios: /admin/usuarios. Búsqueda cruzada (perfiles, anuncios, pedidos Tienda, reportes): /admin/ops. Las etiquetas de esta página no guardan."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form className={`${adminCardBase} p-6`} action="/admin/ops" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Unified records search</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            Cuenta + anuncios Clasificados + pedidos Tienda en una pasada (límite por sección).
          </p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-ops-q">
            Query
          </label>
          <input id="support-ops-q" name="q" className={`${adminInputClass} mt-1`} placeholder="UUID, email, listing id, order ref…" />
          <button type="submit" className={`${adminBtnSecondary} mt-3 w-full justify-center`}>
            Open Customer ops →
          </button>
        </form>

        <form className={`${adminCardBase} p-6`} action="/admin/usuarios" method="get">
          <h2 className="text-sm font-bold text-[#1E1810]">Quick user lookup</h2>
          <p className="mt-1 text-xs text-[#7A7164]">Solo perfiles — lista y detalle existentes.</p>
          <label className="mt-4 block text-xs font-semibold text-[#5C5346]" htmlFor="support-user-q">
            Query
          </label>
          <input id="support-user-q" name="q" className={`${adminInputClass} mt-1`} placeholder="Email, ref, name…" />
          <button type="submit" className={`${adminBtnSecondary} mt-3 w-full justify-center`}>
            Open in Users →
          </button>
        </form>

        <div className={`${adminCardBase} p-6 lg:col-span-2`}>
          <h2 className="text-sm font-bold text-[#1E1810]">Escalation tags</h2>
          <p className="mt-1 text-xs text-[#7A7164]">
            <span className="mr-2 inline-block rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
              Solo UI
            </span>
            For future ticket routing — chips are visual only.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Billing", "Technical", "Fraud", "Content"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-1 text-xs font-bold text-[#3D3428]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className={`${adminCardBase} mt-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Account actions (stubs)</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          <span className={adminStubBadgeClass + " mr-2"}>Próximamente</span>
          Password reset and unlock require Auth Admin APIs server-side — not exposed here.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled className={adminBtnSecondary}>
            Reset password (stub)
          </button>
          <button type="button" disabled className={adminBtnSecondary}>
            Unlock account (stub)
          </button>
          <button type="button" disabled className={adminBtnSecondary}>
            Replica mode (stub)
          </button>
        </div>
        <div className="mt-6">
          <label className="text-xs font-semibold text-[#5C5346]">Internal notes (local only — not saved)</label>
          <textarea
            className={`${adminInputClass} mt-1 min-h-[100px]`}
            disabled
            placeholder="Future: encrypted internal notes table with audit trail."
          />
        </div>
      </div>

      <div className="mt-6 text-sm">
        <Link href="/admin/reportes" className="font-bold text-[#6B5B2E] underline">
          Open reports queue →
        </Link>
      </div>
    </div>
  );
}
