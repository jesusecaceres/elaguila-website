import { NextResponse } from "next/server";
import { getRoughDistanceMiles } from "@/app/lib/distance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewer = searchParams.get("viewer") ?? "";
  const listing = searchParams.get("listing") ?? "";
  const miles = getRoughDistanceMiles(viewer, listing);
  return NextResponse.json({ miles: miles ?? null });
}
