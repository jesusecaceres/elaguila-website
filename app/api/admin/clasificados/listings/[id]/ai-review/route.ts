import { isVerifiedAdminSession } from "@/app/admin/_lib/adminVerifiedSession";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { runListingAiReviewForId } from "@/app/admin/_lib/listingAiModerationService";

export const dynamic = "force-dynamic";

/** Admin-only: run AI moderation review for one generic listing. Does not change listing status. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!(await isVerifiedAdminSession(jar))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const outcome = await runListingAiReviewForId(id);

  revalidatePath("/admin/workspace/clasificados");

  return NextResponse.json({
    ok: outcome.ok,
    error: outcome.error,
    proofLabel: outcome.proofLabel,
    review: outcome.review,
    listingId: outcome.listingId,
    leonixAdId: outcome.leonixAdId,
  });
}
