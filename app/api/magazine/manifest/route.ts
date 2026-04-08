import { NextResponse } from "next/server";
import { resolvePublicMagazineManifest } from "@/app/lib/magazine/magazineManifestServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public magazine hub + archive JSON; prefers `magazine_issues` when published rows exist. */
export async function GET() {
  try {
    const manifest = await resolvePublicMagazineManifest();
    return NextResponse.json(manifest, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "manifest_failed" },
      { status: 500 }
    );
  }
}
