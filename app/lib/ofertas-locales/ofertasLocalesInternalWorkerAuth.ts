import "server-only";

import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export type OfertaLocalWorkerAuthResult =
  | { ok: true; source: "worker" }
  | { ok: false; status: 401 | 503; code: "worker_secret_missing" | "worker_unauthorized" };

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function authenticateOfertaLocalInternalWorker(req: NextRequest): OfertaLocalWorkerAuthResult {
  const configured = String(process.env.OFERTAS_INTERNAL_WORKER_SECRET ?? "").trim();
  if (!configured) return { ok: false, status: 503, code: "worker_secret_missing" };

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (!token || !safeEqual(token, configured)) {
    return { ok: false, status: 401, code: "worker_unauthorized" };
  }
  return { ok: true, source: "worker" };
}
