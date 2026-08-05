import { NextResponse } from "next/server";
import { getDigitalContactProfile } from "@/app/lib/digitalContact/digitalContactRegistry";
import { buildDigitalContactVCardText, digitalContactVCardFileName } from "@/app/lib/digitalContact/digitalContactVCard";
import { digitalContactCanonicalUrl } from "@/app/lib/digitalContact/digitalContactSeo";
import { insertDigitalContactAnalyticsEvent } from "@/app/lib/digitalContact/digitalContactOpsTablesServer";

export const runtime = "nodejs";

/** Standards-compliant vCard download — works identically on Android, iPhone, and desktop. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const profile = getDigitalContactProfile(slug);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "profile_not_found" }, { status: 404 });
  }

  const canonicalUrl = digitalContactCanonicalUrl(profile.slug);
  const vcard = buildDigitalContactVCardText(profile, canonicalUrl);
  const fileName = digitalContactVCardFileName(profile);

  void insertDigitalContactAnalyticsEvent({ profileSlug: profile.slug, eventType: "vcf_download", meta: {} });

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
