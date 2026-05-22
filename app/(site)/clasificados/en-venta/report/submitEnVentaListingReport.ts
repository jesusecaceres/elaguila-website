import { LEONIX_GLOBAL_EMAIL } from "@/app/data/leonixGlobalContact";
import { sendLeonixResendEmail } from "@/app/lib/email/sendLeonixResendEmail";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import {
  formatEnVentaReportReasonForStorage,
  isHighSeverityEnVentaReport,
  type EnVentaReportReasonCode,
} from "../moderation/enVentaPolicyCopy";

export type SubmitEnVentaListingReportInput = {
  listingId: string;
  reasonCode: EnVentaReportReasonCode;
  details?: string;
  reporterId: string | null;
  lang: "es" | "en";
};

export type SubmitEnVentaListingReportResult =
  | { ok: true; reportId: string; adminEmailSent: boolean }
  | { ok: false; error: string };

export async function submitEnVentaListingReport(
  input: SubmitEnVentaListingReportInput
): Promise<SubmitEnVentaListingReportResult> {
  const listingId = input.listingId.trim();
  if (!listingId) return { ok: false, error: "missing_listing_id" };

  const reason = formatEnVentaReportReasonForStorage(
    input.reasonCode,
    input.details ?? "",
    input.lang
  ).slice(0, 2000);

  const supabase = getAdminSupabase();
  const { data: inserted, error } = await supabase
    .from("listing_reports")
    .insert({
      listing_id: listingId,
      reporter_id: input.reporterId,
      reason,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  let adminEmailSent = false;
  if (isHighSeverityEnVentaReport(input.reasonCode)) {
    const { data: listing } = await supabase
      .from("listings")
      .select("id, title, leonix_ad_id, category")
      .eq("id", listingId)
      .maybeSingle();

    const alertTo =
      process.env.LEONIX_ADMIN_ALERT_EMAIL?.trim() ||
      process.env.LEONIX_REPORTS_ALERT_EMAIL?.trim() ||
      LEONIX_GLOBAL_EMAIL;

    const subject =
      input.lang === "es"
        ? `[Varios] Reporte de alta prioridad — ${listing?.title ?? listingId}`
        : `[For Sale] High-priority report — ${listing?.title ?? listingId}`;

    const text = [
      `Listing ID: ${listingId}`,
      listing?.leonix_ad_id ? `Leonix Ad ID: ${listing.leonix_ad_id}` : null,
      `Category: ${listing?.category ?? "en-venta"}`,
      `Reason: ${reason}`,
      input.reporterId ? `Reporter: ${input.reporterId}` : "Reporter: anonymous",
      `Admin queue: /admin/reportes`,
      `Recommended: review listing; hide pending review if policy requires.`,
    ]
      .filter(Boolean)
      .join("\n");

    const mail = await sendLeonixResendEmail({
      to: alertTo,
      subject,
      text,
      html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${text.replace(/</g, "&lt;")}</pre>`,
    });
    adminEmailSent = mail.ok;
  }

  return { ok: true, reportId: String(inserted?.id ?? ""), adminEmailSent };
}
