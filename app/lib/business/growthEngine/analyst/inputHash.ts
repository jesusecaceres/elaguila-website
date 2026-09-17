/**
 * Business Development Analyst — deterministic input hash for caching (MD <caching>). Never
 * depends on an unstable timestamp alone: cockpitBriefing.generatedAt is deliberately excluded
 * (it changes on every compile even when nothing underneath it changed), and every array is
 * hashed by its actual content, not its fetch time. Deliberately has no "server-only" marker —
 * pure hashing over already-compiled data, no secret, no network/database call.
 */
import { createHash } from "node:crypto";
import type { GrowthAnalystInputPacket } from "./inputPacket";

/**
 * A stable, order-independent-enough revision of everything that should trigger a re-analysis if
 * it changes: business identity, roadmap type, every truth-class item, health/recommendation
 * summary, research evidence, opportunities, follow-up, campaigns, and outcomes. generatedAt is
 * excluded on purpose (see file doc comment).
 */
export function computeGrowthAnalystInputHash(packet: GrowthAnalystInputPacket): string {
  const { cockpitBriefing, ...rest } = packet;
  const { generatedAt: _generatedAt, ...stableBriefing } = cockpitBriefing;
  void _generatedAt;

  const normalized = JSON.stringify({ ...rest, cockpitBriefing: stableBriefing });
  return createHash("sha256").update(normalized).digest("hex");
}
