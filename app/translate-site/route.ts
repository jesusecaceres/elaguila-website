import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleTranslateWebsiteUrl,
  buildLeonixSiteUrlForTranslate,
  resolveTranslateSiteLang,
  sanitizeTranslateReturnTo,
} from "@/app/lib/googleTranslateWebsite";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lang = resolveTranslateSiteLang(
    searchParams.get("lang"),
    searchParams.get("target"),
  );
  const returnTo = sanitizeTranslateReturnTo(searchParams.get("returnTo"));
  const siteUrl = buildLeonixSiteUrlForTranslate(lang, returnTo);
  const redirectUrl = buildGoogleTranslateWebsiteUrl({ targetLang: lang, siteUrl });
  return NextResponse.redirect(redirectUrl, 302);
}
