import { processLeonixLeadPost } from "@/app/lib/leonix/processLeonixLeadPost";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return processLeonixLeadPost(req);
}
