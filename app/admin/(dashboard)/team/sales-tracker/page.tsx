import { StaffTeamNav } from "../../../_components/StaffTeamNav";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";
import SalesTrackerWorkspacePage from "../../workspace/sales-tracker/page";

export default async function StaffTeamSalesTrackerPage(
  props: Parameters<typeof SalesTrackerWorkspacePage>[0],
) {
  const access = await getCurrentAdminAccessContext();
  return (
    <>
      <StaffTeamNav showRosterLink={canAccessFullAdmin(access)} />
      <SalesTrackerWorkspacePage {...props} />
    </>
  );
}
