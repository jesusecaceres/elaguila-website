import { StaffTeamNav } from "../../../_components/StaffTeamNav";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import { canAccessFullAdmin } from "@/app/admin/_lib/staffAdminAccess";
import PromoCodesWorkspacePage from "../../workspace/promo-codes/page";

export const dynamic = "force-dynamic";

export default async function StaffTeamPromoCodesPage(
  props: Parameters<typeof PromoCodesWorkspacePage>[0],
) {
  const access = await getCurrentAdminAccessContext();
  return (
    <>
      <StaffTeamNav showRosterLink={canAccessFullAdmin(access)} />
      <PromoCodesWorkspacePage {...props} />
    </>
  );
}
