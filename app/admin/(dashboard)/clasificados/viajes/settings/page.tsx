import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";

const SECTIONS: { title: string; body: string; fields: string[] }[] = [
  {
    title: "Offer types",
    body: "Canonical list for Viajes cards (packages, cruises, hotel+drive, last-minute, etc.). Drives filters and admin validation.",
    fields: ["Package", "Cruise", "Hotel + air", "Activities bundle", "Ground transport add-on"],
  },
  {
    title: "Placement rules",
    body: "How many affiliate vs business slots can share a rail, and when seasonal campaigns override defaults.",
    fields: ["Max featured per partner", "Homepage rail cap", "Results interleaving order"],
  },
  {
    title: "Disclosure labels",
    body: "Copy blocks for commercial partner vs operator listing vs editorial — must stay distinct on public cards.",
    fields: ["Affiliate disclosure", "Business listing disclosure", "Editorial badge"],
  },
  {
    title: "Expiry defaults",
    body: "Fallback TTLs when partners omit an end date; pause behavior for stale inventory.",
    fields: ["Default affiliate TTL", "Grace window before auto-pause", "Reminder cadence (internal)"],
  },
  {
    title: "Moderation rules",
    body: "Business lane policies — first-time advertisers, high-value packages, media review thresholds.",
    fields: ["First-time review", "Image auto-flag keywords", "Escalation path"],
  },
  {
    title: "Partner labels",
    body: "Controlled vocabulary for affiliate labels shown publicly (OTAs, wholesalers, DMCs).",
    fields: ["Preferred partners", "Restricted wording", "Locale variants"],
  },
  {
    title: "Trust requirements",
    body: "Minimum proof before a business profile or offer can go live.",
    fields: ["WhatsApp match", "Website WHOIS alignment", "Phone verification"],
  },
  {
    title: "Business posting rules",
    body: "What agencies must include in applications; quality bar for Viajes as a business category.",
    fields: ["Minimum imagery", "Cancellation copy", "Operator license field (future)"],
  },
  {
    title: "Language & routing",
    body: "Future-proofing for bilingual merchandising and deep links into results.",
    fields: ["Default locale", "EN/ES parity rules", "Query param strategy"],
  },
];

export default function AdminViajesSettingsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · policy"
        title="Settings / Rules"
        subtitle="Central place for Viajes operating rules — values are illustrative until configuration storage exists."
        helperText="Nothing here affects production traffic yet; it communicates what Leonix will control before APIs ship."
      />

      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase tracking-wide text-[#A67C52]">{s.title}</p>
            <p className="mt-2 text-sm text-[#5C5346]">{s.body}</p>
            <ul className="mt-3 space-y-2">
              {s.fields.map((f) => (
                <li key={f}>
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{f}</label>
                  <input className={`${adminInputClass} mt-1`} disabled placeholder="Configured later" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
