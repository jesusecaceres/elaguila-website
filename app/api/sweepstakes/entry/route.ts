import { NextResponse } from "next/server";

// TEMPORARY IN-MEMORY DATABASE (replace with real DB later)
let entries: any[] = [];

export async function POST(req: Request) {
  try {
    const {
      email,
      phone,
      videoId,
      advertiserId,
      packageType, // "coupon-only" or "combo"
    } = await req.json();

    if (!email || !phone || !videoId || !advertiserId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // ❌ If advertiser only paid for coupons — NO sweepstakes entry
    if (packageType === "coupon-only") {
      return NextResponse.json({
        message: "Video watched but this advertiser only includes coupons.",
        sweepstakesEligible: false,
      });
    }

    // Prevent duplicate entries (same user, same video)
    const alreadyEntered = entries.some(
      (e) => e.email === email && e.videoId === videoId
    );

    if (alreadyEntered) {
      return NextResponse.json({
        message: "Entry already recorded.",
        sweepstakesEligible: true,
      });
    }

    // Determine week number
    const now = new Date();
    const oneJan = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((now.getTime() - oneJan.getTime()) / 86400000 +
        oneJan.getDay() +
        1) /
        7
    );

    // Save entry
    const newEntry = {
      email,
      phone,
      videoId,
      advertiserId,
      date: now.toISOString(),
      week,
    };

    entries.push(newEntry);

    return NextResponse.json({
      message: "Entry recorded successfully.",
      sweepstakesEligible: true,
      entry: newEntry,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
