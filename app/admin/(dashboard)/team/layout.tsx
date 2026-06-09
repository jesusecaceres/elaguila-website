import { StaffTeamNav } from "../../_components/StaffTeamNav";
import {
  getCurrentAdminAccessContext,
} from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";

export default async function StaffTeamLayout({ children }: { children: React.ReactNode }) {
  const access = await getCurrentAdminAccessContext();
  void canAccessFullAdmin(access);
  return <div className="min-w-0">{children}</div>;
}
