/**
 * Program 6, Gate 6W — QR Registry Connection.
 * No dedicated QR system exists in repo yet. Models provider-ready QR tracking.
 * Preferred: Leonix-controlled redirect path.
 */
import type { PrintFormatKey } from "./printSpecs";
import { QR_MIN_SIZE_INCHES, QR_PREFERRED_MIN_INCHES, validateQrSize } from "./productionRules";

export interface QrRecord {
  id: string;
  businessId: string;
  destinationUrl: string;
  isHttps: boolean;
  status: "pending" | "active" | "tested_print" | "tested_mobile" | "failed";
  lastTestedAt: string | null;
  printTestStatus: "untested" | "passed" | "failed" | null;
  mobileTestStatus: "untested" | "passed" | "failed" | null;
  analyticsTrackingId: string | null;
  isLeonixControlledRedirect: boolean;
  createdAt: string;
}

export interface QrReadinessResult {
  ready: boolean;
  violations: readonly string[];
}

export function checkQrReadiness(
  qr: QrRecord | null,
  format: PrintFormatKey,
  sizeInches: number,
  qrRequired: boolean,
): QrReadinessResult {
  const violations: string[] = [];

  if (!qr) {
    if (qrRequired) {
      violations.push("QR is required for this format but no QR record exists.");
    }
    return { ready: !qrRequired, violations };
  }

  if (!qr.isHttps) {
    violations.push("QR destination is not HTTPS.");
  }

  if (qr.status === "failed") {
    violations.push("QR status is failed.");
  }

  if (qr.printTestStatus !== "passed") {
    violations.push("QR print test has not passed.");
  }

  const sizeResult = validateQrSize(sizeInches);
  if (sizeResult.status === "FAIL") {
    violations.push(sizeResult.message);
  }

  return { ready: violations.length === 0, violations };
}

export function isQrRequiredForFormat(_format: PrintFormatKey): boolean {
  // All magazine ad formats require QR
  return true;
}

export const QR_MIN_SIZE = QR_MIN_SIZE_INCHES;
export const QR_PREFERRED_MIN = QR_PREFERRED_MIN_INCHES;
