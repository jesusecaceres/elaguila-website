/**
 * Package C Build 2 (C4) — provider-agnostic SMS/phone verification interface.
 * See twilioVerifyProvider.ts for the concrete Twilio Verify implementation.
 */

export type SmsVerificationRequestResult =
  | { ok: true; providerVerificationSid: string }
  | {
      ok: false;
      code: "NOT_CONFIGURED" | "RATE_LIMITED_UPSTREAM" | "INVALID_PHONE" | "PROVIDER_ERROR";
      message: string;
    };

export type SmsVerificationCheckResult =
  | { ok: true; approved: true }
  | { ok: true; approved: false }
  | { ok: false; code: "NOT_CONFIGURED" | "PROVIDER_ERROR" | "EXPIRED_OR_NOT_FOUND"; message: string };

export interface SmsVerificationProvider {
  requestVerification(input: {
    phoneE164: string;
    channel: "sms" | "call";
  }): Promise<SmsVerificationRequestResult>;
  checkVerification(input: {
    phoneE164: string;
    code: string;
  }): Promise<SmsVerificationCheckResult>;
}
