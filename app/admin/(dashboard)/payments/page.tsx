import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminBtnSecondary, adminInputClass, adminStubBadgeClass } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

export default function AdminPaymentsPage() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminStubBadgeClass}>Próximamente</span>
        <span className={adminStubBadgeClass}>No persistido</span>
      </div>
      <AdminPageHeader
        title="Payments"
        subtitle="Billing health and references only. Card data is never stored or displayed in admin. Integrations are future Stripe/customer portal links."
        helperText="Ningún dato de facturación se lee ni escribe en Supabase desde esta pantalla todavía."
      />

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        <strong>No PCI scope here:</strong> do not paste full card numbers, CVV, or magnetic data. Use processor dashboards for
        disputes.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Overview</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">—</p>
          <p className="mt-1 text-xs text-[#7A7164]">Connect to billing provider for MRR / failed payments.</p>
        </div>
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Open invoices</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">—</p>
          <p className="mt-1 text-xs text-[#7A7164]">Future: query invoices by customer ref.</p>
        </div>
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Failed charges (24h)</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">—</p>
          <p className="mt-1 text-xs text-[#7A7164]">Wire webhook summaries when available.</p>
        </div>
      </div>

      <div className={`${adminCardBase} mt-8 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Search references</h2>
        <p className="mt-1 text-xs text-[#7A7164]">Lookup by invoice id, subscription id, or user email once billing tables exist.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input className={`${adminInputClass} max-w-md`} disabled placeholder="Invoice / subscription / email" />
          <span
            className={`${adminStubBadgeClass} inline-flex min-h-[44px] items-center sm:min-h-0`}
            title="Sin tablas de facturación conectadas"
          >
            Búsqueda desactivada
          </span>
        </div>
      </div>

      <div className={`${adminCardBase} mt-6 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Secure update method</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Send customers to hosted payment-method update (Stripe Customer Portal or equivalent). No raw card forms in Leonix
          admin.
        </p>
        <button type="button" disabled className={`${adminBtnSecondary} mt-4 cursor-not-allowed opacity-70`} title="Conecta Stripe u otro PSP en el futuro">
          Processor dashboard (no conectado)
        </button>
      </div>
    </div>
  );
}
