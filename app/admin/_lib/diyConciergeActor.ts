import "server-only";

import type { StrictSalesActor } from "./businessWorkspaceAccess";
import type { DiyConciergeActor } from "@/app/lib/business/diyConcierge/types";

/** Converts a verified StrictSalesActor into the DIY Concierge's dual-actor shape. Never
 * constructed from any other source — every caller must have already passed
 * requireSalesWorkspaceAccess(). */
export function staffActorToDiyConciergeActor(actor: StrictSalesActor): Extract<DiyConciergeActor, { type: "staff" }> {
  return { type: "staff", rosterId: actor.rosterId, authUserId: actor.authUserId, email: actor.email, role: actor.role };
}
