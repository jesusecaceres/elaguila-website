/**
 * Program 4, Gate 4A — deterministic, pure Field Discovery logic. No AI, no network, no DB
 * access — matches app/lib/business/livingBook/logic.ts and app/admin/_lib/salesWorkspaceLogic.ts
 * convention exactly, so this file is unit-testable without a database.
 */
import type { SourceType } from "./types";

/** Same normalized-name convention as businesses.normalized_name (lowercase, collapsed whitespace). */
export function normalizeBusinessName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function normalizeEmail(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

/**
 * Bounded, non-throwing URL normalization for source links. Never mutates protocol beyond
 * lowercasing scheme/host, never resolves DNS, never follows redirects — this is a pure string
 * transform only. Returns null for anything that cannot be parsed as http(s).
 */
export function normalizeSourceUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    let normalized = `${url.protocol}//${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "")}${url.search}`;
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized || `${url.protocol}//${url.hostname.toLowerCase()}`;
  } catch {
    return null;
  }
}

/** Best-effort source-type guess from a normalized URL host — never authoritative, staff may override. */
export function guessSourceTypeFromUrl(normalizedUrl: string): SourceType {
  const host = (() => {
    try {
      return new URL(normalizedUrl).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();
  if (host.includes("google.com") || host.includes("g.page")) return "google_business";
  if (host.includes("facebook.com")) return "facebook";
  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("yelp.com")) return "yelp";
  if (host.includes("wa.me") || host.includes("whatsapp.com")) return "whatsapp";
  if (host) return "website";
  return "other";
}

export type CanvassFormValidationError = { field: string; messageEs: string; messageEn: string };

/**
 * Quick Visit minimum-viable validation — a business name is the only hard requirement; every
 * other field is genuinely optional so a rep can save partial progress ("Finish Later").
 */
export function validateCanvassIntake(input: { businessName: string; email: string | null }): CanvassFormValidationError[] {
  const errors: CanvassFormValidationError[] = [];
  if (!input.businessName || input.businessName.trim().length === 0) {
    errors.push({ field: "businessName", messageEs: "El nombre del negocio es obligatorio.", messageEn: "Business name is required." });
  }
  if (input.email && !normalizeEmail(input.email)) {
    errors.push({ field: "email", messageEs: "El correo electrónico no es válido.", messageEn: "Email address is not valid." });
  }
  return errors;
}

/** True only when every consent the requested action needs has an explicit `provided` record. */
export function hasRequiredConsent(records: readonly { consentType: string; consentState: string }[], required: string): boolean {
  const relevant = records.filter((r) => r.consentType === required);
  if (relevant.length === 0) return false;
  // Most recent append-only record wins (records are ordered by created_at desc at the query layer).
  return relevant[0].consentState === "provided";
}
