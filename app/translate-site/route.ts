import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleTranslateWebsiteUrl,
  buildLeonixSiteUrlForTranslate,
  LEONIX_TRANSLATE_SITE_ORIGIN,
  resolveTranslateSiteLang,
} from "@/app/lib/googleTranslateWebsite";

export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lang = resolveTranslateSiteLang(
    searchParams.get("lang"),
    searchParams.get("target"),
  );

  const returnTo = searchParams.get("returnTo");
  const siteUrl = returnTo
    ? buildLeonixSiteUrlForTranslate(lang, returnTo)
    : LEONIX_TRANSLATE_SITE_ORIGIN;
  const googleUrl = buildGoogleTranslateWebsiteUrl({
    targetLang: lang,
    siteUrl,
  });

  return NextResponse.redirect(googleUrl);
}
