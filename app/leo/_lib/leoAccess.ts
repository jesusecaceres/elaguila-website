/**
 * LEO-1 owner-only server access boundary.
 *
 * Reuses Admin access context. Does not invent a second auth system.
 * LEO v1 is restricted to owner_admin with a valid admin cookie.
 */
import "server-only";

import {
  getCurrentAdminAccessContext,
  isOwnerAdminRole,
  type AdminAccessContext,
} from "@/app/admin/_lib/adminAccessControl";

export type LeoAccessDenialReason =
  | "unauthenticated"
  | "not_owner_admin"
  | "sales_rep"
  | "support_admin"
  | "other_staff_role";

export type LeoAccessContext = {
  allowed: true;
  /** Underlying Admin access context (owner_admin only when allowed). */
  admin: AdminAccessContext;
  role: "owner_admin";
};

export type LeoAccessDenied = {
  allowed: false;
  reason: LeoAccessDenialReason;
  /** Present when Admin cookie/session context was readable. */
  admin: AdminAccessContext | null;
};

export type LeoAccessResult = LeoAccessContext | LeoAccessDenied;

function denialReasonForRole(role: AdminAccessContext["normalizedRole"]): LeoAccessDenialReason {
  if (role === "sales_rep") return "sales_rep";
  if (role === "support_admin") return "support_admin";
  if (role === "owner_admin") return "not_owner_admin";
  return "other_staff_role";
}

/**
 * Resolve whether the current request may use LEO server helpers.
 * Requires admin cookie AND exact owner_admin role.
 * sales_rep / support / other staff roles do not qualify.
 */
export async function resolveLeoAccess(): Promise<LeoAccessResult> {
  const admin = await getCurrentAdminAccessContext();

  if (!admin.hasAdminCookie) {
    return { allowed: false, reason: "unauthenticated", admin };
  }

  if (!isOwnerAdminRole(admin.normalizedRole)) {
    return {
      allowed: false,
      reason: denialReasonForRole(admin.normalizedRole),
      admin,
    };
  }

  return {
    allowed: true,
    admin,
    role: "owner_admin",
  };
}

/**
 * Throws when the caller is not an authenticated owner_admin.
 * Prefer resolveLeoAccess() when a typed denial is needed.
 */
export async function requireLeoOwnerAccess(): Promise<LeoAccessContext> {
  const result = await resolveLeoAccess();
  if (!result.allowed) {
    throw new Error(`LEO access denied: ${result.reason}`);
  }
  return result;
}

/** Pure helper for tests/verifiers — does not touch cookies. */
export function isLeoOwnerAdminAccess(admin: Pick<AdminAccessContext, "hasAdminCookie" | "normalizedRole">): boolean {
  return admin.hasAdminCookie === true && isOwnerAdminRole(admin.normalizedRole);
}
