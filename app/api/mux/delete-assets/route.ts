import { NextResponse } from "next/server";
import { deleteMuxAssetsBestEffort } from "@/app/lib/mux/server";

type Body = { assetIds?: unknown };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const raw = Array.isArray(body.assetIds) ? body.assetIds : [];
    const assetIds = raw
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .slice(0, 16);
    if (!assetIds.length) {
      return NextResponse.json({ ok: true, deleted: 0 });
    }
    await deleteMuxAssetsBestEffort(assetIds);
    return NextResponse.json({ ok: true, deleted: assetIds.length });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "delete failed" },
      { status: 500 }
    );
  }
}
