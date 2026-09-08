import "server-only";

import type { StrictSalesActor } from "./businessWorkspaceAccess";
import type { FieldDiscoveryActor } from "@/app/lib/business/fieldDiscovery/types";

/** Converts a verified StrictSalesActor into Program 4's dual-actor shape. Mirrors
 * livingBookActor.ts / healthMapActor.ts / diyConciergeActor.ts / stewardshipActor.ts exactly —
 * never constructed from any other source; every caller must have already passed
 * requireSalesWorkspaceAccess(). */
export function staffActorToFieldDiscoveryActor(actor: StrictSalesActor): Extract<FieldDiscoveryActor, { type: "staff" }> {
  return { type: "staff", rosterId: actor.rosterId, authUserId: actor.authUserId, email: actor.email, role: actor.role };
}
