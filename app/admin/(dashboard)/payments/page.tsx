import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminBtnSecondary,
  adminInputClass,
  adminReadOnlyBadgeClass,
  adminStubBadgeClass,
} from "../../_components/adminTheme";
import { getAdminSupabase } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

const TIENDA_STATUSES = [
  "new",
  "reviewing",
  "ready_to_fulfill",
  "ordered",
  "completed",
  "needs_customer_followup",
  "failed_submission",
] as const;

type TiendaAgg = {
  unavailable: boolean;
  total: number;
  byStatus: Record<string, number>;
  unreadAdmin: number;
  emailDeliveryFailed: number;
  approvalIncomplete: number;
};

async function fetchTiendaOrderAggregates(): Promise<TiendaAgg> {
  try {
    const supabase = getAdminSupabase();
    const [statusResults, unreadRes, emailFailRes, approvalRes] = await Promise.all([
      Promise.all(
        TIENDA_STATUSES.map((status) =>
          supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("status", status)
        )
      ),
      supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("unread_admin", true),
      supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("email_delivery_status", "failed"),
      supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("approval_complete", false),
    ]);
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (let i = 0; i < TIENDA_STATUSES.length; i++) {
      const r = statusResults[i];
      if (r.error) {
        return {
          unavailable: true,
          total: 0,
          byStatus: {},
          unreadAdmin: 0,
          emailDeliveryFailed: 0,
          approvalIncomplete: 0,
        };
      }
      const c = typeof r.count === "number" ? r.count : 0;
      byStatus[TIENDA_STATUSES[i]] = c;
      total += c;
    }
    const count = (x: { count?: number | null; error?: unknown }) =>
      x.error ? null : typeof x.count === "number" ? x.count : 0;
    return {
      unavailable: false,
      total,
      byStatus,
      unreadAdmin: count(unreadRes) ?? 0,
      emailDeliveryFailed: count(emailFailRes) ?? 0,
      approvalIncomplete: count(approvalRes) ?? 0,
    };
  } catch {
    return {
      unavailable: true,
      total: 0,
      byStatus: {},
      unreadAdmin: 0,
      emailDeliveryFailed: 0,
      approvalIncomplete: 0,
    };
  }
}

export default async function AdminPaymentsPage() {
  const tienda = await fetchTiendaOrderAggregates();
  const pipeline =
    (tienda.byStatus.new ?? 0) +
    (tienda.byStatus.reviewing ?? 0) +
    (tienda.byStatus.ready_to_fulfill ?? 0) +
    (tienda.byStatus.ordered ?? 0);
  const stripeDashboardUrl = (process.env.STRIPE_DASHBOARD_URL ?? "").trim();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {tienda.unavailable ? (
          <span className={adminStubBadgeClass}>Tienda orders: no legible</span>
        ) : (
          <span className={adminReadOnlyBadgeClass}>Metadatos operativos (sin PCI)</span>
        )}
        <span className={adminStubBadgeClass}>PSP / Stripe API: no conectado</span>
      </div>
      <AdminPageHeader
        title="Payments"
        subtitle="Esta pantalla no procesa ni almacena tarjetas. Lo que ves aquí son proxies operativos desde pedidos Tienda en Supabase (estado de fulfillment) y enlaces a colas reales."
        helperText="Facturación con tarjeta / webhooks del procesador siguen fuera de Leonix hasta integración explícita. No pegues PAN, CVV ni datos magnéticos."
      />

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        <strong>Sin alcance PCI aquí:</strong> usa el dashboard del procesador para contracargos y métodos de pago. Leonix admin
        solo enlaza contexto operativo.
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Pedidos Tienda (filas)</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.unavailable ? "—" : tienda.total}</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            Tabla <code className="rounded bg-[#FAF7F2] px-1">tienda_orders</code> — refleja checkout interno, no ingresos contables
            del PSP.
          </p>
          <Link href="/admin/tienda/orders" className={`${adminBtnSecondary} mt-3 inline-flex text-xs`}>
            Abrir inbox Tienda →
          </Link>
        </div>
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">En pipeline (aprox.)</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.unavailable ? "—" : pipeline}</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            Suma de <span className="font-mono">new + reviewing + ready_to_fulfill + ordered</span> — trabajo operativo pendiente
            de cerrar.
          </p>
        </div>
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Atención / fallos</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">
            {tienda.unavailable
              ? "—"
              : (tienda.byStatus.needs_customer_followup ?? 0) + (tienda.byStatus.failed_submission ?? 0)}
          </p>
          <p className="mt-1 text-xs text-[#7A7164]">
            <span className="font-mono">needs_customer_followup</span> + <span className="font-mono">failed_submission</span>.
          </p>
        </div>
      </div>

      {!tienda.unavailable ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase text-[#7A7164]">Inbox sin leer (admin)</p>
            <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.unreadAdmin}</p>
            <p className="mt-1 text-xs text-[#7A7164]">
              Columna <span className="font-mono">unread_admin</span> — proxy de trabajo pendiente de revisar en Leonix.
            </p>
          </div>
          <div className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase text-[#7A7164]">Email de confirmación fallido</p>
            <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.emailDeliveryFailed}</p>
            <p className="mt-1 text-xs text-[#7A7164]">
              <span className="font-mono">email_delivery_status = failed</span> — revisar bandeja / logs, no es cobro PSP.
            </p>
          </div>
          <div className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase text-[#7A7164]">Aprobación incompleta</p>
            <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.approvalIncomplete}</p>
            <p className="mt-1 text-xs text-[#7A7164]">
              <span className="font-mono">approval_complete = false</span> — checklist interno del pedido antes de fulfillment.
            </p>
          </div>
        </div>
      ) : null}

      {!tienda.unavailable ? (
        <div className={`${adminCardBase} mb-8 mt-6 p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Desglose por estado</p>
          <ul className="mt-3 grid gap-1 text-sm text-[#5C5346] sm:grid-cols-2">
            {TIENDA_STATUSES.map((s) => (
              <li key={s}>
                <span className="font-mono text-xs">{s}</span>:{" "}
                <strong className="text-[#1E1810]">{tienda.byStatus[s] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Qué controlará esta sección en el futuro</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#7A7164]">
          <li>Enlaces firmados al Customer Portal / dashboard Stripe (solo URLs; sin secretos en el cliente admin).</li>
          <li>Resúmenes de webhooks (fallos de cobro, disputas) cuando exista tabla dedicada.</li>
          <li>Búsqueda por customer ref / subscription id alineada al modelo de facturación real.</li>
        </ul>
        <p className="mt-3 text-xs text-[#7A7164]">
          Hoy, la trazabilidad operativa de pedidos está en{" "}
          <Link href="/admin/tienda/orders" className="font-bold text-[#6B5B2E] underline">
            Tienda → pedidos
          </Link>
          .
        </p>
      </div>

      <div className={`${adminCardBase} mt-6 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Processor dashboard</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Opcional: define <code className="rounded bg-[#FAF7F2] px-1">STRIPE_DASHBOARD_URL</code> en el entorno del servidor
          (solo URL base del dashboard; sin claves).
        </p>
        {stripeDashboardUrl ? (
          <a
            href={stripeDashboardUrl}
            target="_blank"
            rel="noreferrer"
            className={`${adminBtnSecondary} mt-4 inline-flex`}
          >
            Abrir Stripe dashboard ↗
          </a>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input className={`${adminInputClass} max-w-md`} disabled placeholder="Configure STRIPE_DASHBOARD_URL" />
            <span className={`${adminStubBadgeClass} inline-flex`}>Sin URL configurada</span>
          </div>
        )}
      </div>
    </div>
  );
}
