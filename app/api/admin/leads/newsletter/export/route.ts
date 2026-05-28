import { newsletterSubscribersToCsv } from "@/app/admin/_lib/leonixLeadsCsv";
import { assertAdminLeadExportAccess } from "@/app/admin/_lib/adminLeadExportAuth";
import { fetchAllNewsletterSubscribersForExport } from "@/app/admin/_lib/leonixLeadsData";

export const runtime = "nodejs";

export async function GET() {
  const denied = await assertAdminLeadExportAccess();
  if (denied) return denied;

  const result = await fetchAllNewsletterSubscribersForExport();
  if (result.dataUnavailable || result.error) {
    const message = result.dataUnavailableNote ?? result.error ?? "Could not export newsletter subscribers.";
    return new Response(message, { status: result.dataUnavailable ? 503 : 500 });
  }

  const csv = newsletterSubscribersToCsv(result.rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leonix-newsletter-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
