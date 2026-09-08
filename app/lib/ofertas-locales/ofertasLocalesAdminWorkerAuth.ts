import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { requireAdminCookie } from "@/app/lib/supabase/server";

import { authenticateOfertaLocalInternalWorker } from "./ofertasLocalesInternalWorkerAuth";

export type OfertaLocalAdminOrWorkerAuth =
  | { ok: true; source: "admin_cookie" | "worker" }
  | { ok: false; status: 401 | 503; code: "unauthorized" | "worker_secret_missing" | "worker_unauthorized" };

export async function authenticateOfertaLocalAdminOrWorker(
  req: NextRequest,
): Promise<OfertaLocalAdminOrWorkerAuth> {
  const worker = authenticateOfertaLocalInternalWorker(req);
  if (worker.ok) return { ok: true, source: "worker" };

  const cookieStore = await cookies();
  if (requireAdminCookie(cookieStore)) return { ok: true, source: "admin_cookie" };

  if (worker.code === "worker_secret_missing") {
    return { ok: false, status: 503, code: "worker_secret_missing" };
  }
  return { ok: false, status: 401, code: "unauthorized" };
}
