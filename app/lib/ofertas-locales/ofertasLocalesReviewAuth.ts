import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";

export type OfertasLocalesReviewAuth = {
  actorUserId: string;
  isAdmin: boolean;
};

/** Owner bearer session or admin workspace cookie. */
export async function resolveOfertasLocalesOwnerOrAdminAuth(
  req: NextRequest
): Promise<OfertasLocalesReviewAuth | null> {
  const cookieStore = await cookies();
  if (await isVerifiedAdminSession(cookieStore)) {
    const bearerId = await getBearerUserId(req);
    return { actorUserId: bearerId ?? "admin", isAdmin: true };
  }

  const ownerId = await getBearerUserId(req);
  if (!ownerId) return null;
  return { actorUserId: ownerId, isAdmin: false };
}
