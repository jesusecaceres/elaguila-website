/**
 * Gate I.11A — Anonymous draft-upload session scoping.
 *
 * This is NOT an authentication or authorization mechanism. It grants no permissions and is
 * never checked against any protected resource — it exists solely so that one anonymous
 * drafting session's pre-publish media uploads land under a single unguessable, server-issued
 * path segment instead of a client-supplied value (draft id, timestamp) that an attacker could
 * predict or enumerate. Authenticated uploads never use this — they use the real, server-verified
 * user id from `getBearerUserId`.
 */
import { randomUUID } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ANON_UPLOAD_SESSION_COOKIE = "lx_anon_upload_session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AnonUploadSession = {
  id: string;
  /** True when no valid existing cookie was found and a new id was minted. */
  isNew: boolean;
};

/** Reads the existing anonymous session cookie, or mints a fresh crypto-random one. Never throws. */
export function resolveAnonUploadSessionId(req: NextRequest): AnonUploadSession {
  const existing = req.cookies.get(ANON_UPLOAD_SESSION_COOKIE)?.value?.trim();
  if (existing && UUID_RE.test(existing)) {
    return { id: existing, isNew: false };
  }
  return { id: randomUUID(), isNew: true };
}

/** Sets the session cookie on the outgoing response. Call only when `isNew` is true. */
export function applyAnonUploadSessionCookie(res: NextResponse, id: string): void {
  res.cookies.set(ANON_UPLOAD_SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Sanitized `anon-<sessionId>` path segment — never derived from client-supplied input. */
export function anonUploadPathSegment(sessionId: string): string {
  return `anon-${sessionId.replace(/[^a-zA-Z0-9-]+/g, "").slice(0, 40)}`;
}
