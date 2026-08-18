import "server-only";

import { sanitizeDigitalContactFileNameBase } from "./digitalContactFileName";
import type { DigitalContactProfile } from "./digitalContactTypes";

/** Escapes text per RFC 6350 (vCard 3.0/4.0): backslash, comma, semicolon, then newlines. */
function escapeVCardText(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

function vcardNameParts(fullName: string): { family: string; given: string } {
  const cleaned = fullName.replace(/["“”]/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { family: "", given: cleaned };
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
}

/**
 * Builds a standards-compliant vCard 3.0 text body — broadly compatible with iOS, Android,
 * and desktop mail/contacts clients (vCard 3.0 has the widest cross-platform support).
 */
export function buildDigitalContactVCardText(profile: DigitalContactProfile, canonicalUrl: string): string {
  const { family, given } = vcardNameParts(profile.fullName);
  const addr = profile.address;
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardText(family)};${escapeVCardText(given)};;;`,
    `FN:${escapeVCardText(profile.fullName)}`,
    `ORG:${escapeVCardText(profile.company)}`,
    `TITLE:${escapeVCardText(profile.title)}`,
    `TEL;TYPE=WORK,VOICE:+${profile.phoneDigits}`,
    `EMAIL;TYPE=WORK:${escapeVCardText(profile.email)}`,
    `URL:${escapeVCardText(profile.website)}`,
    `ADR;TYPE=WORK:;;${escapeVCardText(addr.line1 + (addr.line2 ? ` ${addr.line2}` : ""))};${escapeVCardText(addr.city)};${escapeVCardText(addr.state)};${escapeVCardText(addr.postalCode)};${escapeVCardText(addr.country ?? "US")}`,
    `NOTE:${escapeVCardText(profile.legalEntity)} — ${escapeVCardText(canonicalUrl)}`,
    "END:VCARD",
  ];
  return lines.join("\r\n") + "\r\n";
}

export function digitalContactVCardFileName(profile: DigitalContactProfile): string {
  return `${sanitizeDigitalContactFileNameBase(profile.fullName, profile.slug)}.vcf`;
}
