import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleTranslateWebsitesModeUrl,
  resolveTranslateSiteLang,
} from "@/app/lib/googleTranslateWebsite";

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = resolveTranslateSiteLang(
    searchParams.get("lang"),
    searchParams.get("target"),
  );

  const googleUrl = buildGoogleTranslateWebsitesModeUrl(lang);

  return NextResponse.redirect(googleUrl);
}
