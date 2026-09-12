/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — "Create Campaign" bridge for Media/Exposure
 * Campaign blueprints (MD <campaign_execution_bridge>). Reuses the canonical Growth Engine Campaign
 * domain exactly (createGrowthCampaign/addGrowthCampaignChannel) — never a second campaign system.
 *
 * Every requested channel is validated against the LIVE channel catalog before being attached —
 * mirroring the existing Campaign Builder route's own validation — so a channel the client merely
 * expressed interest in during discovery is never silently treated as confirmed/sold inventory.
 * Radio (and any other partner channel) is only ever attached as a REQUEST; its own
 * availability_state stays whatever the live catalog says (available_partner_terms_required).
 *
 * Idempotent: a double-click for the SAME approved blueprint version returns the already-created
 * campaign rather than a duplicate (application-layer check backed by the migration's own partial
 * unique index on business_growth_campaigns.source_project_blueprint_id).
 */
import "server-only";

import { addGrowthCampaignChannel, createGrowthCampaign, getGrowthCampaignByBlueprintId, listGrowthMediaChannels } from "@/app/lib/business/growthEngine/repository";
import type { GrowthCampaign, GrowthEngineActor } from "@/app/lib/business/growthEngine/types";
import { setBlueprintHandoff, type BusinessProjectBlueprint } from "./blueprintRepository";
import type { MediaCampaignBlueprintPacket } from "./specializedBlueprintEngine";

function findRow(rows: readonly { fieldKey: string; displayValue: string }[], fieldKey: string): string | null {
  const row = rows.find((r) => r.fieldKey === fieldKey);
  return row?.displayValue.trim() || null;
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function matchChannelKey(token: string, channels: readonly { channelKey: string; labelEs: string; labelEn: string }[]): string | null {
  const normalized = normalizeToken(token);
  const byKey = channels.find((c) => c.channelKey === normalized);
  if (byKey) return byKey.channelKey;
  const byLabel = channels.find((c) => normalizeToken(c.labelEs) === normalized || normalizeToken(c.labelEn) === normalized);
  return byLabel?.channelKey ?? null;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Gate 8 <campaign_dates> — campaign_start/campaign_end are real Postgres `date` columns, but
 * discovery captures them as free-text display strings (a client might say "next month"). Rather
 * than let a malformed value hit the database as a raw constraint/type error, or silently become
 * null, reject strictly here so the bridge can fail humanly before any write occurs.
 */
function parseStrictIsoDate(raw: string | null): { ok: true; value: string | null } | { ok: false } {
  if (!raw) return { ok: true, value: null };
  if (!ISO_DATE_RE.test(raw)) return { ok: false };
  const [y, m, day] = raw.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) return { ok: false };
  return { ok: true, value: raw };
}

export type GrowthCampaignBridgeResult =
  | { ok: true; campaign: GrowthCampaign; alreadyExisted: boolean; unmatchedChannelTokens: readonly string[] }
  | { ok: false; reason: "not_approved" | "campaign_create_failed" }
  | { ok: false; reason: "invalid_campaign_dates"; invalidFields: readonly string[] };

export async function createGrowthCampaignFromBlueprint(
  businessId: string,
  blueprint: BusinessProjectBlueprint<MediaCampaignBlueprintPacket>,
  actor: GrowthEngineActor,
): Promise<GrowthCampaignBridgeResult> {
  if (blueprint.status !== "approved_for_build") return { ok: false, reason: "not_approved" };

  const existing = await getGrowthCampaignByBlueprintId(businessId, blueprint.id);
  if (existing) return { ok: true, campaign: existing, alreadyExisted: true, unmatchedChannelTokens: [] };

  const packet = blueprint.packet;
  const objectiveEs = findRow(packet.objective, "campaign_objective") ?? "Campaña / Campaign";
  const audienceEs = findRow(packet.audience, "primary_customer");
  const offerEs = findRow(packet.offerMessage, "campaign_primary_message");
  const ctaEs = findRow(packet.cta, "campaign_cta");
  const startDateRaw = findRow(packet.timing, "campaign_start_date");
  const endDateRaw = findRow(packet.timing, "campaign_end_date");
  const startParsed = parseStrictIsoDate(startDateRaw);
  const endParsed = parseStrictIsoDate(endDateRaw);
  if (!startParsed.ok || !endParsed.ok) {
    return {
      ok: false,
      reason: "invalid_campaign_dates",
      invalidFields: [...(!startParsed.ok ? ["campaign_start_date"] : []), ...(!endParsed.ok ? ["campaign_end_date"] : [])],
    };
  }

  const campaign = await createGrowthCampaign(
    {
      businessId,
      sourceProjectBlueprintId: blueprint.id,
      objectiveEs,
      objectiveEn: objectiveEs,
      targetAudienceEs: audienceEs,
      targetAudienceEn: audienceEs,
      offerEs,
      offerEn: offerEs,
      primaryCtaEs: ctaEs,
      primaryCtaEn: ctaEs,
      campaignStart: startParsed.value,
      campaignEnd: endParsed.value,
    },
    actor,
  );
  if (!campaign) return { ok: false, reason: "campaign_create_failed" };

  const desiredChannelsText = findRow(packet.channels, "campaign_desired_channels");
  const requestedTokens = desiredChannelsText ? desiredChannelsText.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const liveChannels = await listGrowthMediaChannels();
  const unmatchedChannelTokens: string[] = [];
  for (const token of requestedTokens) {
    const channelKey = matchChannelKey(token, liveChannels);
    const channel = channelKey ? liveChannels.find((c) => c.channelKey === channelKey) : null;
    if (!channel) {
      unmatchedChannelTokens.push(token);
      continue;
    }
    await addGrowthCampaignChannel(businessId, campaign.id, channel.id, null);
  }

  // Campaign is durable (never rolled back) — a handoff-write failure never loses the already-
  // created campaign; retrying "Create Campaign" finds it via getGrowthCampaignByBlueprintId.
  await setBlueprintHandoff(businessId, blueprint.id, {
    handoffStatus: "assigned",
    handoffNotes: `Growth Campaign ${campaign.id}`,
  }).catch(() => undefined);

  return { ok: true, campaign, alreadyExisted: false, unmatchedChannelTokens };
}
