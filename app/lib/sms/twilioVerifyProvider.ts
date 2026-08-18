/**
 * Package C Build 2 (C4) — Twilio Verify concrete implementation.
 *
 * Twilio Verify generates, stores, and checks the OTP itself — Leonix never receives, stores,
 * or logs a raw code, which trivially satisfies "no raw OTP storage" and "no OTP in logs."
 * Fails closed (NOT_CONFIGURED) when credentials are absent — never fabricates a successful
 * verification. Env vars are presence-checked only; values are never logged or exposed.
 */

import "server-only";
import Twilio from "twilio";
import type { SmsVerificationProvider } from "./smsVerificationProvider";

type TwilioConfig = { accountSid: string; authToken: string; verifyServiceSid: string };

function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
  if (!accountSid || !authToken || !verifyServiceSid) return null;
  return { accountSid, authToken, verifyServiceSid };
}

export function isTwilioVerifyConfigured(): boolean {
  return getTwilioConfig() != null;
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Twilio error";
}

export const twilioVerifyProvider: SmsVerificationProvider = {
  async requestVerification({ phoneE164, channel }) {
    const cfg = getTwilioConfig();
    if (!cfg) return { ok: false, code: "NOT_CONFIGURED", message: "SMS verification is not configured." };
    const client = Twilio(cfg.accountSid, cfg.authToken);
    try {
      const verification = await client.verify.v2
        .services(cfg.verifyServiceSid)
        .verifications.create({ to: phoneE164, channel });
      return { ok: true, providerVerificationSid: verification.sid };
    } catch (e) {
      const code = (e as { code?: number } | null)?.code;
      if (code === 60200) return { ok: false, code: "INVALID_PHONE", message: "Invalid phone number." };
      if (code === 60203 || code === 60212 || code === 60410) {
        return { ok: false, code: "RATE_LIMITED_UPSTREAM", message: "Too many verification attempts. Try again later." };
      }
      return { ok: false, code: "PROVIDER_ERROR", message: errorMessage(e) };
    }
  },

  async checkVerification({ phoneE164, code }) {
    const cfg = getTwilioConfig();
    if (!cfg) return { ok: false, code: "NOT_CONFIGURED", message: "SMS verification is not configured." };
    const client = Twilio(cfg.accountSid, cfg.authToken);
    try {
      const check = await client.verify.v2
        .services(cfg.verifyServiceSid)
        .verificationChecks.create({ to: phoneE164, code });
      return { ok: true, approved: check.status === "approved" };
    } catch (e) {
      const twilioCode = (e as { code?: number } | null)?.code;
      if (twilioCode === 20404) {
        return { ok: false, code: "EXPIRED_OR_NOT_FOUND", message: "Verification expired or not found." };
      }
      return { ok: false, code: "PROVIDER_ERROR", message: errorMessage(e) };
    }
  },
};
