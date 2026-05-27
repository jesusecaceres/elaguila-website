import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminWorkspaceNav } from "../../_components/AdminWorkspaceNav";
import {
  getAllowedWorkspaceNavHrefs,
  getCurrentAdminAccessContext,
  isSalesRepRole,
} from "../../_lib/adminAccessControl";

export default async function AdminWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAdminAccessContext();
  const allowedHrefs = getAllowedWorkspaceNavHrefs(access);
  const pathname = (await headers()).get("x-admin-pathname") ?? "";

  if (isSalesRepRole(access.normalizedRole) && pathname.startsWith("/admin/workspace")) {
    if (pathname === "/admin/workspace") {
      redirect("/admin/workspace/sales-tracker");
    }
    const allowed = allowedHrefs.some((h) => pathname === h || pathname.startsWith(`${h}/`));
    if (!allowed) {
      redirect("/admin/workspace/promo-codes?access_denied=1");
    }
  }

  return (
    <div>
      <AdminWorkspaceNav allowedHrefs={allowedHrefs} />
      {children}
    </div>
  );
}
