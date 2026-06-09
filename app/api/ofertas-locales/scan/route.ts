import type { NextRequest } from "next/server";

import { handleOfertaLocalScanPost } from "@/app/lib/ofertas-locales/ofertasLocalesScanApiHandler";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleOfertaLocalScanPost(req);
}
