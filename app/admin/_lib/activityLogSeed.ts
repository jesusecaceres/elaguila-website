/**
 * TEMPORARY: seeded activity rows until `admin_audit_log` (or similar) exists in Supabase.
 * Recommended schema (comment-only):
 * - id uuid, created_at timestamptz, actor_email text, action text,
 *   target_type text, target_id text, summary text, meta jsonb
 *
 * Tienda: `tiendaOrderActions.updateTiendaOrderStatusAction` has a TODO to push
 * `tienda_order.status` changes here once `admin_audit_log` exists.
 */
export type AdminActivityRow = {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
};

export function getTemporaryActivitySeed(): AdminActivityRow[] {
  return [
    {
      id: "seed-1",
      createdAt: new Date().toISOString(),
      actor: "admin@leonix",
      action: "dashboard.view",
      targetType: "system",
      targetId: "—",
      summary: "Opened Leonix admin dashboard (stub row).",
    },
  ];
}
