/**
 * LEO-22D — Honest Google Workspace capability truth.
 * Never exposes tokens. Does not enable write. Does not send mail.
 */
import "server-only";

import { getLeoGmailReplyExecutionCapability } from "@/app/leo/_lib/leoGmailReplyExecutionCapability";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import type { LeoCockpitHealthState } from "@/app/leo/_lib/leoCockpitHealth";

export type LeoGoogleWorkspaceCapabilityTruth = {
  workspaceConfigured: boolean;
  gmailReadConfigured: boolean;
  calendarReadConfigured: boolean;
  gmailSendScopeProven: boolean | null;
  gmailSendScopeHealth: LeoCockpitHealthState;
  writeFlagEnabled: boolean;
  gmailReplyExecutionAvailable: boolean;
  summary: string;
};

export async function getLeoGoogleWorkspaceCapabilityTruth(): Promise<LeoGoogleWorkspaceCapabilityTruth> {
  const workspaceConfigured = isLeoGoogleWorkspaceConfigured();
  const writeCap = await getLeoGmailReplyExecutionCapability();
  const gmailSendScopeHealth: LeoCockpitHealthState = !workspaceConfigured
    ? "NOT_CONFIGURED"
    : writeCap.gmailSendScopeProven
      ? "HEALTHY"
      : "UNPROVEN";

  const summary = !workspaceConfigured
    ? "Google Workspace is not configured (credentials missing)."
    : writeCap.gmailReplyExecutionAvailable
      ? "Workspace configured. Gmail reply execution is available (flag on and send scope proven)."
      : `Workspace configured for reads. Gmail send scope ${writeCap.gmailSendScopeProven ? "proven" : "not proven"}. Write flag ${writeCap.writeFlagEnabled ? "on" : "off"}. Reply execution unavailable.`;

  return {
    workspaceConfigured,
    gmailReadConfigured: workspaceConfigured,
    calendarReadConfigured: workspaceConfigured,
    gmailSendScopeProven: workspaceConfigured ? writeCap.gmailSendScopeProven : false,
    gmailSendScopeHealth,
    writeFlagEnabled: writeCap.writeFlagEnabled,
    gmailReplyExecutionAvailable: writeCap.gmailReplyExecutionAvailable,
    summary,
  };
}
