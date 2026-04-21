import type { NextRequest } from "next/server";

import { getBearerUserId } from "@/app/api/_lib/bearerUser";

export async function viajesGetUserIdFromBearer(req: NextRequest): Promise<string | null> {
  return getBearerUserId(req);
}
