import type { NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/_lib/bearerUser";

/** Require authenticated publisher for Ofertas Locales asset upload. */
export async function ofertasLocalesOwnerIdFromBearer(req: NextRequest): Promise<string | null> {
  return getBearerUserId(req);
}
