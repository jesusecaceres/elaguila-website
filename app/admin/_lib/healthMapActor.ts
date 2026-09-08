import "server-only";

import type { StrictSalesActor } from "./businessWorkspaceAccess";
import type { HealthMapActor } from "@/app/lib/business/healthMap/types";

/** Converts a verified StrictSalesActor into the Health Map's dual-actor shape. Never constructed
 * from any other source — every caller must have already passed requireSalesWorkspaceAccess(). */
export function staffActorToHealthMapActor(actor: StrictSalesActor): Extract<HealthMapActor, { type: "staff" }> {
  return { type: "staff", rosterId: actor.rosterId, authUserId: actor.authUserId, email: actor.email, role: actor.role };
}
