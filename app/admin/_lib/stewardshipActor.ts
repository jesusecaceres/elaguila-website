import "server-only";

import type { StrictSalesActor } from "./businessWorkspaceAccess";
import type { StewardshipStaffActor } from "@/app/lib/business/stewardship/types";

/** Converts a verified StrictSalesActor into the Stewardship Engine's staff-only actor shape.
 * Never constructed from any other source — every caller must have already passed
 * requireSalesWorkspaceAccess(). Overrides and approvals only ever accept this staff shape. */
export function staffActorToStewardshipActor(actor: StrictSalesActor): StewardshipStaffActor {
  return { type: "staff", rosterId: actor.rosterId, authUserId: actor.authUserId, email: actor.email, role: actor.role };
}
