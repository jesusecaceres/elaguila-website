import { NextResponse } from "next/server";
import { resolveHumanConnectionPublicOffer } from "@/app/lib/digitalContact/humanConnection/resolvePublicOffer";
import type { HumanConnectionSurface } from "@/app/lib/digitalContact/humanConnection/humanConnectionTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public-safe Human Connection offer flags for visitor UI.
 * Does not expose staff metadata, host credentials, or internal presence fields.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = String(url.searchParams.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const lang = url.searchParams.get("lang") === "en" ? "en" : "es";
  const surfaceRaw = String(url.searchParams.get("surface") ?? "virtual_front_desk");
  const surface: HumanConnectionSurface =
    surfaceRaw === "digital_contact" ? "digital_contact" : "virtual_front_desk";

  if (!slug || slug.length > 64) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  try {
    const offer = await resolveHumanConnectionPublicOffer({
      profileSlug: slug,
      lang,
      surface,
    });
    if (!offer) {
      return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      slug: offer.slug,
      offerVideo: offer.offerVideo,
      offerSchedule: offer.offerSchedule,
      videoReason: offer.videoReason,
      backupSlug: offer.backupSlug,
      backupDisplayName: offer.backupDisplayName,
      backupOfferVideo: offer.backupOfferVideo,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "offer_failed" }, { status: 500 });
  }
}
