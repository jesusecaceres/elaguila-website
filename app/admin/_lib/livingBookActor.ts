import "server-only";

import { isOwnerBootstrapActor, type StrictSalesActor } from "./businessWorkspaceAccess";
import type { LivingBookActor } from "@/app/lib/business/livingBook/types";

/** Converts a verified staff roster actor into the Living Business Book staff shape. Do not use
 * for owner_bootstrap — that must go through salesActorToLivingBookActor() so no empty roster id
 * is written as if it were a real admin_team_members row. */
export function staffActorToLivingBookActor(actor: StrictSalesActor): Extract<LivingBookActor, { type: "staff" }> {
  return { type: "staff", rosterId: actor.rosterId, authUserId: actor.authUserId, email: actor.email, role: actor.role };
}

/** Maps a verified Sales Workspace actor onto Living Book's staff|owner shape. Owner bootstrap
 * is type "owner" with no roster id — never a fabricated staff roster row. */
export function salesActorToLivingBookActor(actor: StrictSalesActor): LivingBookActor {
  if (isOwnerBootstrapActor(actor)) {
    return { type: "owner", authUserId: actor.authUserId, email: actor.email };
  }
  return staffActorToLivingBookActor(actor);
}
