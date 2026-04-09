import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";

/** Fire-and-forget audit row for admin mutations (same pattern as setUserDisabledAction). */
export function auditAdminWrite(
  action: string,
  targetType: string,
  targetId: string,
  meta?: Record<string, unknown>
): void {
  void appendAdminAuditLog({
    action,
    targetType,
    targetId,
    meta: { ...meta, source: "leonix_admin" },
  });
}
