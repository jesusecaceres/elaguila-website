/**
 * LEO-21E.1 — Owner-safe Gmail reply execution capability (no secrets).
 * Two-key: write flag AND proven gmail.send. CAPABILITY ≠ AUTHORITY.
 */
import "server-only";

import { isLeoGmailReplyWriteFlagEnabled } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { proveLeoGmailSendScopeGranted } from "@/app/leo/_lib/leoGmailSendScopeProof";

export type LeoGmailReplyExecutionCapability = {
  writeFlagEnabled: boolean;
  gmailSendScopeProven: boolean;
  gmailReplyExecutionAvailable: boolean;
};

/**
 * Fail-closed capability snapshot for owner cockpit / eligibility.
 * Never returns tokens or raw Google responses.
 */
export async function getLeoGmailReplyExecutionCapability(): Promise<LeoGmailReplyExecutionCapability> {
  const writeFlagEnabled = isLeoGmailReplyWriteFlagEnabled();
  let gmailSendScopeProven = false;
  try {
    const proof = await proveLeoGmailSendScopeGranted();
    gmailSendScopeProven = proof.ok === true && proof.hasGmailSend === true;
  } catch {
    gmailSendScopeProven = false;
  }
  return {
    writeFlagEnabled,
    gmailSendScopeProven,
    gmailReplyExecutionAvailable: writeFlagEnabled && gmailSendScopeProven,
  };
}
