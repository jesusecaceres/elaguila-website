import type { TiendaOrderOpsStatus } from "@/app/lib/tienda/tiendaOrderOperations";
import { tiendaOrderStatusLabel } from "@/app/lib/tienda/tiendaOrderOperations";

const ACCENT: Record<TiendaOrderOpsStatus, string> = {
  new: "bg-sky-100 text-sky-900 border-sky-200",
  reviewing: "bg-amber-100 text-amber-950 border-amber-200",
  ready_to_fulfill: "bg-emerald-100 text-emerald-950 border-emerald-200",
  ordered: "bg-violet-100 text-violet-950 border-violet-200",
  completed: "bg-stone-200 text-stone-900 border-stone-300",
  needs_customer_followup: "bg-orange-100 text-orange-950 border-orange-200",
  failed_submission: "bg-rose-100 text-rose-950 border-rose-200",
};

export function AdminTiendaOrderStatusBadge(props: { status: TiendaOrderOpsStatus }) {
  const { status } = props;
  const cls = ACCENT[status] ?? "bg-stone-100 text-stone-800 border-stone-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}
    >
      {tiendaOrderStatusLabel(status)}
    </span>
  );
}
