import { NextResponse } from "next/server";
import { hasMuxEnv } from "@/app/lib/mux/server";

export async function GET() {
  const env = hasMuxEnv();
  return NextResponse.json({
    ok: true,
    muxTokenIdExists: env.hasTokenId,
    muxTokenSecretExists: env.hasTokenSecret,
    isProduction: process.env.NODE_ENV === "production",
  });
}
