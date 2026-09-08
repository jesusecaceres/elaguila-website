/** Paths a sales_rep may hit under /admin (dashboard layout guard). */
export function isStaffSalesAllowedAdminPath(pathname: string): boolean {
  if (pathname === "/admin" || pathname.startsWith("/admin/team")) return true;
  if (pathname.startsWith("/admin/support")) return true;
  // Gate BCO-4A — the Sales Team Business Workspace is the whole point of the sales_rep role;
  // without this it would be unreachable by its actual target users.
  if (pathname.startsWith("/admin/businesses")) return true;
  // Gate 01 — Field Agent is a Business Concierge mode, not a separate admin product.
  if (pathname === "/admin/field" || pathname.startsWith("/admin/field/")) return true;
  return false;
}
