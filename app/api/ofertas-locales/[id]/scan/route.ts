import type { NextRequest } from "next/server";

import { handleOfertaLocalScanPost } from "@/app/lib/ofertas-locales/ofertasLocalesScanApiHandler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return handleOfertaLocalScanPost(req, id);
}
