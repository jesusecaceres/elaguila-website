/**
 * LEO-21D — Prove live access-token grant includes gmail.send (tokeninfo).
 * Never logs or returns the access token. CAPABILITY ≠ AUTHORITY.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import {
  LEO_GMAIL_SEND_SCOPE,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";

export type LeoGmailSendScopeProof =
  | { ok: true; hasGmailSend: true }
  | {
      ok: false;
      hasGmailSend: false;
      errorCode:
        | "GOOGLE_NOT_CONFIGURED"
        | "GOOGLE_TOKEN_UNAVAILABLE"
        | "GOOGLE_TOKENINFO_FAILED"
        | "GMAIL_SEND_SCOPE_ABSENT";
    };

/**
 * Inspect granted scopes via Google's tokeninfo endpoint.
 * Does not mutate Gmail. Does not send mail.
 */
export async function proveLeoGmailSendScopeGranted(): Promise<LeoGmailSendScopeProof> {
  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability === "NOT_CONFIGURED") {
    return { ok: false, hasGmailSend: false, errorCode: "GOOGLE_NOT_CONFIGURED" };
  }
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return { ok: false, hasGmailSend: false, errorCode: "GOOGLE_TOKEN_UNAVAILABLE" };
  }

  const accessToken = tokenResult.accessToken;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LEO_GOOGLE_BOUNDS.oauthTimeoutMs);

  try {
    const url = new URL("https://oauth2.googleapis.com/tokeninfo");
    url.searchParams.set("access_token", accessToken);
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, hasGmailSend: false, errorCode: "GOOGLE_TOKENINFO_FAILED" };
    }
    const json = (await res.json()) as { scope?: unknown };
    const scopeStr = typeof json.scope === "string" ? json.scope : "";
    const scopes = scopeStr.split(/\s+/).map((s) => s.trim()).filter(Boolean);
    if (scopes.includes(LEO_GMAIL_SEND_SCOPE)) {
      return { ok: true, hasGmailSend: true };
    }
    return { ok: false, hasGmailSend: false, errorCode: "GMAIL_SEND_SCOPE_ABSENT" };
  } catch {
    return { ok: false, hasGmailSend: false, errorCode: "GOOGLE_TOKENINFO_FAILED" };
  } finally {
    clearTimeout(timer);
  }
}
