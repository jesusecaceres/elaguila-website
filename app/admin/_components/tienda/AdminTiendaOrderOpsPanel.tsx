import { updateTiendaOrderStatusAction, setTiendaOrderUnreadAction } from "@/app/admin/tiendaOrderActions";
import { TIENDA_ORDER_OPS_STATUSES, type TiendaOrderOpsStatus } from "@/app/lib/tienda/tiendaOrderOperations";
import { adminBtnSecondary, adminBtnDark } from "../adminTheme";

const QUICK: TiendaOrderOpsStatus[] = [
  "reviewing",
  "ready_to_fulfill",
  "ordered",
  "completed",
  "needs_customer_followup",
];

export function AdminTiendaOrderOpsPanel(props: {
  orderId: string;
  currentStatus: TiendaOrderOpsStatus;
  unread: boolean;
}) {
  const { orderId, currentStatus, unread } = props;

  return (
    <div className={`rounded-3xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-5 space-y-4`}>
      <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Operations</h2>
      <p className="text-xs text-[#7A7164]">
        Status workflow is administrative — customers are not notified automatically from these buttons yet.
      </p>
      <p className="text-[11px] text-[#5C5346] leading-relaxed">
        Suggested path: <strong>new</strong> → review assets → <strong>reviewing</strong> → when production-ready{" "}
        <strong>ready_to_fulfill</strong> → <strong>ordered</strong> / vendor → <strong>completed</strong>. Use{" "}
        <strong>needs_customer_followup</strong> if artwork is unclear.
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK.map((status) => (
          <form key={status} action={updateTiendaOrderStatusAction.bind(null, orderId, status)}>
            <button
              type="submit"
              disabled={status === currentStatus}
              className={
                status === currentStatus
                  ? `${adminBtnSecondary} opacity-50 cursor-not-allowed`
                  : adminBtnSecondary
              }
              title={`Establecer estado operativo «${status}» en tienda_orders (sin email automático al cliente)`}
              aria-label={`Cambiar estado del pedido a ${status}`}
            >
              Set: {status.replace(/_/g, " ")}
            </button>
          </form>
        ))}
      </div>
      <details className="rounded-2xl border border-[#E8DFD0]/80 bg-white/80 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-semibold text-[#2C2416]">All statuses</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIENDA_ORDER_OPS_STATUSES.map((status) => (
            <form key={status} action={updateTiendaOrderStatusAction.bind(null, orderId, status)}>
              <button
                type="submit"
                disabled={status === currentStatus}
                className={`text-xs font-semibold rounded-xl border px-2 py-1 border-[#E8DFD0] ${
                  status === currentStatus ? "opacity-40" : "hover:bg-[#FAF7F2]"
                }`}
                title={`Estado ${status} en base (staff)`}
              >
                {status}
              </button>
            </form>
          ))}
        </div>
      </details>
      <form action={setTiendaOrderUnreadAction.bind(null, orderId, !unread)}>
        <button
          type="submit"
          className={adminBtnDark}
          title={
            unread
              ? "Marca el pedido como leído en la bandeja del equipo"
              : "Marca como no leído para volver a destacarlo en la bandeja"
          }
        >
          {unread ? "Marcar leído" : "Marcar no leído"}
        </button>
      </form>
    </div>
  );
}
