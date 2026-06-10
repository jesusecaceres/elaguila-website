import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleTranslateWebsiteUrl,
  buildLeonixSiteUrlForTranslate,
  resolveTranslateSiteLang,
} from "@/app/lib/googleTranslateWebsite";

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = resolveTranslateSiteLang(
    searchParams.get("lang"),
    searchParams.get("target"),
  );

  const returnTo = searchParams.get("returnTo");
  const siteUrl = buildLeonixSiteUrlForTranslate(lang, returnTo);
  const googleUrl = buildGoogleTranslateWebsiteUrl({
    targetLang: lang,
    siteUrl,
  });

  return NextResponse.redirect(googleUrl);
}
