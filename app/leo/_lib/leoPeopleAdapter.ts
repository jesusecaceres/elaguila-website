/**
 * LEO FINAL-02 Contacts adapter — server-only, read-only, bounded.
 * Google People API — contacts.readonly. Never invents a recipient email.
 */
import "server-only";

import { refreshLeoGoogleAccessToken } from "@/app/leo/_lib/leoGoogleOAuthClient";
import { isLeoGoogleWorkspaceConfigured } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import type { LeoContactResolutionResult, LeoResolvedContact } from "@/app/leo/_lib/leoTypes";

const MAX_CANDIDATES = 5;
const PEOPLE_TIMEOUT_MS = 12_000;

function boundName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 120) : null;
}

/** Loose but safe shape check — not full RFC 5322 validation. */
function isValidEmailShape(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

async function peopleGet(path: string, accessToken: string): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PEOPLE_TIMEOUT_MS);
  try {
    return await fetch(`https://people.googleapis.com/v1${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
}

function extractCandidates(rawResults: Record<string, unknown>[]): LeoResolvedContact[] {
  const out: LeoResolvedContact[] = [];
  for (const entry of rawResults) {
    const person = (entry.person ?? entry) as Record<string, unknown>;
    const emails = Array.isArray(person.emailAddresses) ? person.emailAddresses : [];
    const names = Array.isArray(person.names) ? person.names : [];
    const displayName = boundName(
      (names[0] as { displayName?: unknown } | undefined)?.displayName,
    );
    for (const e of emails) {
      const raw = (e as { value?: unknown }).value;
      const email = typeof raw === "string" ? raw.trim().toLowerCase() : null;
      if (email && isValidEmailShape(email)) {
        out.push({ email, displayName });
      }
    }
  }
  return out;
}

function dedupeByEmail(candidates: LeoResolvedContact[]): LeoResolvedContact[] {
  const seen = new Set<string>();
  const out: LeoResolvedContact[] = [];
  for (const c of candidates) {
    if (seen.has(c.email)) continue;
    seen.add(c.email);
    out.push(c);
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}

/**
 * Resolve a recipient by name and/or exact email against the owner's saved
 * Google Contacts.
 *
 * RESOLVED requires exactly one defensible email. AMBIGUOUS returns a bounded
 * candidate list for owner clarification. NOT_FOUND never invents an address.
 * A well-formed, literal email the owner already typed is trusted as-is
 * without a Contacts round-trip — LEO isn't inventing it, the owner supplied it.
 */
export async function resolveLeoContact(input: {
  query: string;
}): Promise<LeoContactResolutionResult> {
  const limitations = [
    "Contacts read-only — saved Google contacts only, no directory-wide lookup.",
    `Bounded to ${MAX_CANDIDATES} candidates.`,
  ];
  const query = input.query?.trim();
  if (!query) {
    return {
      state: "ERROR",
      resolved: null,
      candidates: [],
      errorCode: "QUERY_REQUIRED",
      limitations,
    };
  }

  if (isValidEmailShape(query)) {
    return {
      state: "RESOLVED",
      resolved: { email: query.toLowerCase(), displayName: null },
      candidates: [],
      errorCode: null,
      limitations: [...limitations, "Owner-supplied literal email — no Contacts lookup needed."],
    };
  }

  if (!isLeoGoogleWorkspaceConfigured()) {
    return {
      state: "UNAVAILABLE",
      resolved: null,
      candidates: [],
      errorCode: "GOOGLE_NOT_CONFIGURED",
      limitations: [...limitations, "Google Workspace is not configured."],
    };
  }

  const tokenResult = await refreshLeoGoogleAccessToken();
  if (tokenResult.availability !== "AVAILABLE" || !tokenResult.accessToken) {
    return {
      state: "UNAVAILABLE",
      resolved: null,
      candidates: [],
      errorCode: tokenResult.errorCode ?? "GOOGLE_TOKEN_UNAVAILABLE",
      limitations: [...limitations, "Contacts access token unavailable."],
    };
  }

  try {
    const params = new URLSearchParams({ query, readMask: "names,emailAddresses" });
    const res = await peopleGet(
      `/people:searchContacts?${params.toString()}`,
      tokenResult.accessToken,
    );
    if (!res.ok) {
      const errorCode =
        res.status === 401 || res.status === 403 ? "CONTACTS_FORBIDDEN" : "CONTACTS_REQUEST_FAILED";
      return {
        state: "ERROR",
        resolved: null,
        candidates: [],
        errorCode,
        limitations: [...limitations, "Contacts search request failed."],
      };
    }

    const json = (await res.json()) as { results?: Record<string, unknown>[] };
    const candidates = dedupeByEmail(extractCandidates(json.results ?? []));

    if (candidates.length === 0) {
      return {
        state: "NOT_FOUND",
        resolved: null,
        candidates: [],
        errorCode: null,
        limitations: [...limitations, "No saved contact matched — LEO will not invent an address."],
      };
    }
    if (candidates.length === 1) {
      return {
        state: "RESOLVED",
        resolved: candidates[0],
        candidates: [],
        errorCode: null,
        limitations,
      };
    }
    return {
      state: "AMBIGUOUS",
      resolved: null,
      candidates,
      errorCode: null,
      limitations: [...limitations, "Multiple contacts matched — owner clarification required."],
    };
  } catch {
    return {
      state: "ERROR",
      resolved: null,
      candidates: [],
      errorCode: "CONTACTS_NETWORK_OR_TIMEOUT",
      limitations: [...limitations, "Contacts network/timeout failure."],
    };
  }
}
