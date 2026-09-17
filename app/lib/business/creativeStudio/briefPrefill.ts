/**
 * Gate 10B — new-brief prefill from the same compile used for generation-time packets.
 * Does not persist a snapshot. Does not overwrite a saved brief.
 */
import "server-only";

import { assembleResearchPacket } from "./researchPacketAssembler";
import { briefPrefillFromPacket, type NewBriefPrefill } from "./researchPacketLogic";

export type { NewBriefPrefill };

export async function buildNewBriefPrefill(businessId: string): Promise<NewBriefPrefill> {
  const packet = await assembleResearchPacket(businessId);
  return briefPrefillFromPacket(packet.categories);
}
