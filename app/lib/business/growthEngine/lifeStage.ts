/**
 * Business Development & Growth Engine, Section H — life-stage classification.
 *
 * Deliberately NOT a new database column. The existing businesses.business_stage enum
 * (app/lib/business/types.ts's BusinessStage, enforced by businesses_business_stage_chk) already
 * distinguishes a pre-launch/newly-opened business from an operating one — that is the safest
 * existing canonical field the Growth Engine MD (Section H) asks to reuse. This is a pure
 * classification function, not a second business-identity representation.
 */
import type { BusinessStage } from "../types";
import type { GrowthRoadmapType } from "./types";

/**
 * planning_prelaunch / newly_opened -> the Startup/Idea roadmap track (MD §13.2).
 * operating / growing / established_mature / paused_restructuring -> the Established roadmap
 * track (MD §13.1) — a paused/restructuring business is still an established one that needs the
 * "understand/verify/diagnose" track, not the "idea/business model" track.
 */
export function growthRoadmapTypeForBusinessStage(stage: BusinessStage): GrowthRoadmapType {
  return stage === "planning_prelaunch" || stage === "newly_opened" ? "startup" : "established";
}
