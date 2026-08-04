import "server-only";

import type { StrictSalesActor } from "./businessWorkspaceAccess";
import type { LivingBookActor } from "@/app/lib/business/livingBook/types";

/** Converts a verified StrictSalesActor into the Living Business Book's dual-actor shape. Never
 * constructed from any other source — every caller must have already passed requireSalesWorkspaceAccess(). */
export function staffActorToLivingBookActor(actor: StrictSalesActor): Extract<LivingBookActor, { type: "staff" }> {
  return { type: "staff", rosterId: actor.rosterId, authUserId: actor.authUserId, email: actor.email, role: actor.role };
}
