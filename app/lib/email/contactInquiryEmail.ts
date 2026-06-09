import { escapeHtml } from "./escapeHtml";
import { inquiryTypeLabel, type InquiryType } from "@/app/lib/leonix/inquiryTypes";

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
  lang: "es" | "en";
  wantsLaunchUpdates: boolean;
  submittedAt: string;
};

function line(label: string, value: string): string {
  return value ? `${label}: ${value}` : `${label}: (not provided)`;
}

export function buildContactInquiryEmail(fields: ContactInquiryEmailFields): {
  subject: string;
  text: string;
  html: string;
} {
  const topicText = inquiryTypeLabel(fields.inquiryType, fields.lang);
  const subject =
    fields.lang === "en"
      ? `New Leonix Media lead — ${fields.fullName}`
      : `Nuevo lead de Leonix Media — ${fields.fullName}`;

  const text = [
    "Source: Leonix contact inquiry form",
    `Submitted (UTC): ${fields.submittedAt}`,
    "",
    line("Language", fields.lang),
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
  ].join("\n");

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
  <h2 style="margin:0 0 12px;">Leonix contact inquiry</h2>
  <p><strong>Submitted (UTC):</strong> ${escapeHtml(fields.submittedAt)}</p>
  <p><strong>Language:</strong> ${escapeHtml(fields.lang)}</p>
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
  audienceType: string;
  source: string;
  lang: "es" | "en";
  wantsLaunchUpdates: boolean;
  submittedAt: string;
}): { subject: string; text: string; html: string } {
  const subject = `[Leonix — lanzamiento] ${fields.email} · ${fields.submittedAt.slice(0, 16).replace("T", " ")}`;

  const text = [
    "Source: Leonix launch signup",
    `Submitted (UTC): ${fields.submittedAt}`,
    "",
    line("Language", fields.lang),
    line("Source", fields.source),
    line("Email", fields.email),
    line("Name", fields.name),
    line("Business", fields.businessName),
    line("City", fields.city),
    line("Audience type", fields.audienceType),
    line("Wants launch updates", fields.wantsLaunchUpdates ? "yes" : "no"),
  ].join("\n");

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#222;">
  <h2 style="margin:0 0 12px;">Leonix launch signup</h2>
  <p><strong>Submitted (UTC):</strong> ${escapeHtml(fields.submittedAt)}</p>
  <p><strong>Language:</strong> ${escapeHtml(fields.lang)}</p>
  <p><strong>Source:</strong> ${escapeHtml(fields.source)}</p>
  <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
  <p><strong>Name:</strong> ${fields.name ? escapeHtml(fields.name) : "<em>not provided</em>"}</p>
  <p><strong>Business:</strong> ${fields.businessName ? escapeHtml(fields.businessName) : "<em>not provided</em>"}</p>
  <p><strong>City:</strong> ${fields.city ? escapeHtml(fields.city) : "<em>not provided</em>"}</p>
  <p><strong>Audience type:</strong> ${fields.audienceType ? escapeHtml(fields.audienceType) : "<em>not provided</em>"}</p>
  <p><strong>Wants launch updates:</strong> ${fields.wantsLaunchUpdates ? "yes" : "no"}</p>
</body></html>`;

  return { subject, text, html };
}
