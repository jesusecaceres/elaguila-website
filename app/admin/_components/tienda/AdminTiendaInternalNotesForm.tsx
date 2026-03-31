import { updateTiendaOrderAdminNotesAction } from "@/app/admin/tiendaOrderActions";
import { adminBtnPrimary, adminInputClass } from "../adminTheme";

export function AdminTiendaInternalNotesForm(props: { orderId: string; initialNotes: string }) {
  const { orderId, initialNotes } = props;

  return (
    <form action={updateTiendaOrderAdminNotesAction.bind(null, orderId)} className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346]" htmlFor={`admin-notes-${orderId}`}>
        Internal notes (staff only)
      </label>
      <p className="text-[11px] text-[#7A7164]">
        Not visible to customers. Use for production handoff, vendor calls, or follow-ups.
      </p>
      <textarea
        id={`admin-notes-${orderId}`}
        name="admin_internal_notes"
        rows={4}
        defaultValue={initialNotes}
        maxLength={8000}
        className={`${adminInputClass} min-h-[100px] resize-y font-sans text-sm`}
        placeholder="e.g. Reprint v2, match Pantone 873 C, customer will pick up Friday…"
      />
      <button type="submit" className={adminBtnPrimary}>
        Save notes
      </button>
    </form>
  );
}
