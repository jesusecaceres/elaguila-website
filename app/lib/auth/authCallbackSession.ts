import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";
import { waitForBrowserSession } from "@/app/lib/supabase/browser";

export type AuthCallbackParams = {
  query: URLSearchParams;
  hash: URLSearchParams;
};

export function readAuthCallbackParams(): AuthCallbackParams {
  if (typeof window === "undefined") {
    return { query: new URLSearchParams(), hash: new URLSearchParams() };
  }
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(
    window.location.hash.replace(/^#/, "")
  );
  return { query, hash };
}

export function isRecoveryDestination(redirectPath: string | null | undefined): boolean {
  return Boolean(redirectPath?.includes("recovery=1"));
}

export function isRecoveryAuthCallback(
  query: URLSearchParams,
  hash: URLSearchParams,
  redirectPath?: string | null
): boolean {
  if (isRecoveryDestination(redirectPath)) return true;
  const type = hash.get("type") ?? query.get("type");
  return type === "recovery";
}

function getMergedParam(
  query: URLSearchParams,
  hash: URLSearchParams,
  key: string
): string | null {
  return query.get(key) ?? hash.get(key);
}

export function stripAuthTokensFromUrl() {
  try {
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.delete("code");
    url.searchParams.delete("token_hash");
    url.searchParams.delete("type");
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    url.searchParams.delete("error_code");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  } catch {
    // ignore
  }
}

function hasPkceCodeVerifierInStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.endsWith("-code-verifier")) {
        const value = window.localStorage.getItem(key);
        if (value?.trim()) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

function normalizeOtpType(raw: string | null): EmailOtpType | null {
  if (
    raw === "recovery" ||
    raw === "signup" ||
    raw === "invite" ||
    raw === "magiclink" ||
    raw === "email_change" ||
    raw === "email"
  ) {
    return raw;
  }
  return null;
}

async function requireSessionAfterHandoff(
  supabase: SupabaseClient,
  failureMessage: string
) {
  const { user } = await waitForBrowserSession(supabase, 8000);
  if (!user) throw new Error(failureMessage);
}

/**
 * Establishes a Supabase session from /auth/callback URL params (OAuth PKCE, magic link,
 * password recovery hash, or token_hash verify).
 */
export async function establishSessionFromAuthCallback(
  supabase: SupabaseClient,
  redirectPath?: string | null
): Promise<void> {
  const { query, hash } = readAuthCallbackParams();
  const recovery = isRecoveryAuthCallback(query, hash, redirectPath);

  const oauthError = getMergedParam(query, hash, "error");
  const oauthErrorDescription = getMergedParam(query, hash, "error_description");
  if (oauthError) {
    throw new Error(
      oauthErrorDescription?.trim() ||
        oauthError ||
        "Authentication was cancelled or denied."
    );
  }

  const tokenHash = getMergedParam(query, hash, "token_hash");
  const otpType = normalizeOtpType(getMergedParam(query, hash, "type"));
  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) throw error;
    await requireSessionAfterHandoff(
      supabase,
      "Session was not established after email verification."
    );
    return;
  }

  const access_token = hash.get("access_token") ?? query.get("access_token");
  const refresh_token = hash.get("refresh_token") ?? query.get("refresh_token");

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    await requireSessionAfterHandoff(
      supabase,
      "Session was not established after token handoff."
    );
    return;
  }

  const code = query.get("code");
  if (code) {
    if (recovery && !hasPkceCodeVerifierInStorage()) {
      throw new Error("recovery_link_invalid_or_expired");
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    await requireSessionAfterHandoff(
      supabase,
      "Session was not established after code exchange."
    );
    return;
  }

  const { user } = await waitForBrowserSession(supabase, 1500);
  if (user) return;

  if (recovery) {
    throw new Error("recovery_link_invalid_or_expired");
  }
}

export function recoveryCallbackErrorMessage(lang: "es" | "en"): string {
  return lang === "es"
    ? "No pudimos abrir el enlace de recuperación. Solicita uno nuevo."
    : "We couldn't open your recovery link. Please request a new one.";
}

export function genericCallbackErrorMessage(
  lang: "es" | "en",
  raw?: string
): string {
  if (raw === "auth_timeout") {
    return lang === "es"
      ? "El servicio tardó demasiado. Intenta de nuevo."
      : "Service took too long. Please try again.";
  }
  if (raw === "recovery_link_invalid_or_expired") {
    return recoveryCallbackErrorMessage(lang);
  }
  return raw ?? (lang === "es" ? "No pudimos completar el inicio de sesión." : "We couldn't complete sign-in.");
}
