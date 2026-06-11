import { escapeHtml } from "./escapeHtml";
import {
  leonixAdminLeadInboxUrl,
  leonixAdminNewsletterInboxUrl,
} from "./leonixInternalNotificationUrls";
import { inquiryTypeLabel, type InquiryType } from "@/app/lib/leonix/inquiryTypes";
import { normalizeLang } from "@/app/lib/language";

export type ContactInquiryEmailFields = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  inquiryType: InquiryType;
  preferredContactMethod: string;
  cityArea: string;
  websiteOrSocial: string;
  businessCategory: string;
  message: string;
  sourcePage: string;
  sourceCta: string;
  lang: string;
  wantsLaunchUpdates: boolean;
  submittedAt: string;
  leadId?: string | null;
};

function line(label: string, value: string): string {
  return value ? `${label}: ${value}` : `${label}: (not provided)`;
}

function leadNotificationSubject(inquiryType: InquiryType, lang: string): string {
  const en = lang === "en";
  switch (inquiryType) {
    case "mediaKit":
      return en ? "New Leonix Media Kit interest" : "Nuevo interés en Media Kit de Leonix";
    case "promotionalProducts":
      return en
        ? "New promotional products / print quote request"
        : "Nueva cotización de productos promocionales";
    case "advertising":
    case "general":
    case "businessListing":
    case "partnership":
    case "launch":
    default:
      return en ? "New Leonix Media lead" : "Nuevo lead de Leonix Media";
  }
}

export function buildContactInquiryEmail(fields: ContactInquiryEmailFields): {
  subject: string;
  text: string;
  html: string;
} {
  const lang = normalizeLang(fields.lang);
  const topicText = inquiryTypeLabel(fields.inquiryType, lang);
  const subject = leadNotificationSubject(fields.inquiryType, lang);
  const adminInbox = leonixAdminLeadInboxUrl();

  const text = [
    "Leonix internal lead notification",
    `Submitted (UTC): ${fields.submittedAt}`,
    fields.leadId ? `Lead ID: ${fields.leadId}` : "",
    "",
    "Review in admin:",
    adminInbox,
    "",
    line("Language", lang),
    line("Inquiry type", `${fields.inquiryType} (${topicText})`),
    line("Source page", fields.sourcePage),
    line("Source CTA", fields.sourceCta || "(not provided)"),
    line("Wants launch updates", fields.wantsLaunchUpdates ? "yes" : "no"),
    "",
    line("Full name", fields.fullName),
    line("Email", fields.email),
    line("Phone", fields.phone),
    line("Business", fields.businessName),
    line("Preferred contact", fields.preferredContactMethod),
    line("City / area", fields.cityArea),
    line("Website / social", fields.websiteOrSocial),
    line("Business category", fields.businessCategory),
    "",
    "Message:",
    fields.message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
  <h2 style="margin:0 0 12px;">Leonix internal lead notification</h2>
  <p><strong>Submitted (UTC):</strong> ${escapeHtml(fields.submittedAt)}</p>
  ${fields.leadId ? `<p><strong>Lead ID:</strong> ${escapeHtml(fields.leadId)}</p>` : ""}
  <p><strong>Admin inbox:</strong> <a href="${escapeHtml(adminInbox)}">${escapeHtml(adminInbox)}</a></p>
  <p><strong>Language:</strong> ${escapeHtml(lang)}</p>
  <p><strong>Inquiry type:</strong> ${escapeHtml(fields.inquiryType)} — ${escapeHtml(topicText)}</p>
  <p><strong>Source page:</strong> ${escapeHtml(fields.sourcePage)}</p>
  <p><strong>Source CTA:</strong> ${escapeHtml(fields.sourceCta || "(not provided)")}</p>
  <p><strong>Wants launch updates:</strong> ${fields.wantsLaunchUpdates ? "yes" : "no"}</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
  <p><strong>Full name:</strong> ${escapeHtml(fields.fullName)}</p>
  <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
  <p><strong>Phone:</strong> ${fields.phone ? escapeHtml(fields.phone) : "<em>not provided</em>"}</p>
  <p><strong>Business:</strong> ${fields.businessName ? escapeHtml(fields.businessName) : "<em>not provided</em>"}</p>
  <p><strong>Preferred contact:</strong> ${escapeHtml(fields.preferredContactMethod)}</p>
  <p><strong>City / area:</strong> ${fields.cityArea ? escapeHtml(fields.cityArea) : "<em>not provided</em>"}</p>
  <p><strong>Website / social:</strong> ${fields.websiteOrSocial ? escapeHtml(fields.websiteOrSocial) : "<em>not provided</em>"}</p>
  <p><strong>Business category:</strong> ${fields.businessCategory ? escapeHtml(fields.businessCategory) : "<em>not provided</em>"}</p>
  <h3 style="margin:20px 0 8px;">Message</h3>
  <pre style="white-space:pre-wrap;font-family:inherit;background:#f7f7f7;padding:12px;border-radius:8px;">${escapeHtml(fields.message)}</pre>
</body></html>`;

  return { subject, text, html };
}

export function buildLaunchSignupEmail(fields: {
  email: string;
  name: string;
  businessName: string;
  city: string;
  zipCode: string;
  preferredLanguage: string;
  interests: string;
  source: string;
  sourceCta: string;
  status: string;
  lang: string;
  wantsLaunchUpdates: boolean;
  submittedAt: string;
  subscriberId?: string | null;
  updated?: boolean;
}): { subject: string; text: string; html: string } {
  const lang = normalizeLang(fields.lang);
  const subject =
    lang === "en" ? "New Leonix launch signup" : "Nuevo registro de lanzamiento Leonix";
  const adminInbox = leonixAdminNewsletterInboxUrl();

  const text = [
    "Leonix internal launch / newsletter signup notification",
    `Submitted (UTC): ${fields.submittedAt}`,
    fields.subscriberId ? `Subscriber ID: ${fields.subscriberId}` : "",
    fields.updated ? "Record: updated existing subscriber" : "Record: new subscriber",
    "",
    "Review in admin:",
    adminInbox,
    "",
    line("Language", lang),
    line("Source", fields.source),
    line("Source CTA", fields.sourceCta || "(not provided)"),
    line("Status", fields.status),
    line("Consent timestamp (UTC)", fields.submittedAt),
    "",
    line("Email", fields.email),
    line("Name", fields.name),
    line("Business", fields.businessName),
    line("City", fields.city),
    line("ZIP code", fields.zipCode),
    line("Preferred language", fields.preferredLanguage),
    line("Interests", fields.interests),
    line("Audience type", fields.interests.includes("audience:") ? fields.interests : "(see interests)"),
    line("Wants launch updates", fields.wantsLaunchUpdates ? "yes" : "no"),
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
  <h2 style="margin:0 0 12px;">Leonix launch / newsletter signup</h2>
  <p><strong>Submitted (UTC):</strong> ${escapeHtml(fields.submittedAt)}</p>
  ${fields.subscriberId ? `<p><strong>Subscriber ID:</strong> ${escapeHtml(fields.subscriberId)}</p>` : ""}
  <p><strong>Record:</strong> ${fields.updated ? "updated existing subscriber" : "new subscriber"}</p>
  <p><strong>Admin subscribers:</strong> <a href="${escapeHtml(adminInbox)}">${escapeHtml(adminInbox)}</a></p>
  <p><strong>Language:</strong> ${escapeHtml(lang)}</p>
  <p><strong>Source:</strong> ${escapeHtml(fields.source)}</p>
  <p><strong>Source CTA:</strong> ${escapeHtml(fields.sourceCta || "(not provided)")}</p>
  <p><strong>Status:</strong> ${escapeHtml(fields.status)}</p>
  <p><strong>Consent timestamp (UTC):</strong> ${escapeHtml(fields.submittedAt)}</p>
  <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
  <p><strong>Name:</strong> ${fields.name ? escapeHtml(fields.name) : "<em>not provided</em>"}</p>
  <p><strong>Business:</strong> ${fields.businessName ? escapeHtml(fields.businessName) : "<em>not provided</em>"}</p>
  <p><strong>City:</strong> ${fields.city ? escapeHtml(fields.city) : "<em>not provided</em>"}</p>
  <p><strong>ZIP code:</strong> ${fields.zipCode ? escapeHtml(fields.zipCode) : "<em>not provided</em>"}</p>
  <p><strong>Preferred language:</strong> ${fields.preferredLanguage ? escapeHtml(fields.preferredLanguage) : "<em>not provided</em>"}</p>
  <p><strong>Interests:</strong> ${fields.interests ? escapeHtml(fields.interests) : "<em>not provided</em>"}</p>
  <p><strong>Wants launch updates:</strong> ${fields.wantsLaunchUpdates ? "yes" : "no"}</p>
</body></html>`;

  return { subject, text, html };
}
