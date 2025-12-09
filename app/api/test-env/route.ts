import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    BASE_URL: process.env.BASE_URL || "NOT_FOUND",
    message: "Environment variable check working."
  });
}
