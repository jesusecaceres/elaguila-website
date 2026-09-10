/**
 * LEO-13 Google OAuth refresh client — server-only, native fetch, no npm package.
 * Access token is returned only to server callers. Never logged, persisted, or UI-exposed.
 */
import "server-only";

import {
  getLeoGoogleClientId,
  getLeoGoogleClientSecret,
  getLeoGoogleRefreshToken,
  isLeoGoogleWorkspaceConfigured,
  LEO_GOOGLE_BOUNDS,
} from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import type { LeoGoogleOAuthResult } from "@/app/leo/_lib/leoTypes";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Exchange refresh token for a short-lived access token.
 * No retry loop. Timeout <= 12s. No persistence.
 */
export async function refreshLeoGoogleAccessToken(): Promise<LeoGoogleOAuthResult> {
  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      availability: "NOT_CONFIGURED",
      accessToken: null,
      expiresIn: null,
      errorCode: "GOOGLE_NOT_CONFIGURED",
    };
  }

  const clientId = getLeoGoogleClientId();
  const clientSecret = getLeoGoogleClientSecret();
  const refreshToken = getLeoGoogleRefreshToken();
  if (!clientId || !clientSecret || !refreshToken) {
    return {
      availability: "NOT_CONFIGURED",
      accessToken: null,
      expiresIn: null,
      errorCode: "GOOGLE_NOT_CONFIGURED",
    };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LEO_GOOGLE_BOUNDS.oauthTimeoutMs);

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
      signal: ctrl.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      // Do not surface Google error bodies — may contain sensitive detail.
      return {
        availability: res.status === 401 || res.status === 403 ? "UNAVAILABLE" : "FAILED",
        accessToken: null,
        expiresIn: null,
        errorCode:
          res.status === 401 || res.status === 403
            ? "GOOGLE_TOKEN_UNAUTHORIZED"
            : "GOOGLE_TOKEN_EXCHANGE_FAILED",
      };
    }

    const json = (await res.json()) as {
      access_token?: unknown;
      expires_in?: unknown;
    };

    const accessToken =
      typeof json.access_token === "string" && json.access_token.trim()
        ? json.access_token.trim()
        : null;
    const expiresIn =
      typeof json.expires_in === "number" && Number.isFinite(json.expires_in)
        ? json.expires_in
        : null;

    if (!accessToken) {
      return {
        availability: "FAILED",
        accessToken: null,
        expiresIn: null,
        errorCode: "GOOGLE_TOKEN_MISSING",
      };
    }

    return {
      availability: "AVAILABLE",
      accessToken,
      expiresIn,
      errorCode: null,
    };
  } catch {
    return {
      availability: "FAILED",
      accessToken: null,
      expiresIn: null,
      errorCode: "GOOGLE_TOKEN_NETWORK_OR_TIMEOUT",
    };
  } finally {
    clearTimeout(timer);
  }
}
