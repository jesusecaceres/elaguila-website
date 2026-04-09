import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase, adminInputClass } from "@/app/admin/_components/adminTheme";

const GROUPS: {
  groupTitle: string;
  groupIntro: string;
  sections: { title: string; body: string; fields: string[] }[];
}[] = [
  {
    groupTitle: "Disclosures & trust",
    groupIntro: "Copy and minimum proof before anything goes live — affiliate vs business vs editorial must never be ambiguous on public cards.",
    sections: [
      {
        title: "Disclosure labels",
        body: "Canonical strings for affiliate commission, business operator, and editorial badges.",
        fields: ["Affiliate disclosure", "Business listing disclosure", "Editorial badge"],
      },
      {
        title: "Trust requirements",
        body: "Minimum proof before a business profile or offer can be approved.",
        fields: ["WhatsApp match", "Website WHOIS alignment", "Phone verification"],
      },
    ],
  },
  {
    groupTitle: "Offer shape & filters",
    groupIntro: "What travelers can filter on and what admins validate during intake.",
    sections: [
      {
        title: "Offer types",
        body: "Canonical list for Viajes cards (packages, cruises, hotel+air, last-minute, etc.).",
        fields: ["Package", "Cruise", "Hotel + air", "Activities bundle", "Ground transport add-on"],
      },
      {
        title: "Moderation defaults",
        body: "Default reviewer posture for new advertisers and high-value packages.",
        fields: ["First-time review", "Image auto-flag keywords", "Escalation path"],
      },
    ],
  },
  {
    groupTitle: "Placement & campaigns",
    groupIntro: "Rails, caps, and how seasonal campaigns override static slots.",
    sections: [
      {
        title: "Placement rules",
        body: "How many affiliate vs business slots share a rail; seasonal overrides.",
        fields: ["Max featured per partner", "Homepage rail cap", "Results interleaving order"],
      },
      {
        title: "Expiry defaults",
        body: "TTLs when partners omit end dates; pause behavior for stale inventory.",
        fields: ["Default affiliate TTL", "Grace window before auto-pause", "Reminder cadence (internal)"],
      },
    ],
  },
  {
    groupTitle: "Lanes & locales",
    groupIntro: "Rules that differ between affiliate authoring, business posting, and private drafts.",
    sections: [
      {
        title: "Lane-specific rules",
        body: "Affiliate (admin-only), business (/publicar/viajes/negocios), private (/publicar/viajes/privado).",
        fields: ["Affiliate: no consumer authoring", "Business: moderation required", "Private: local draft only until backend"],
      },
      {
        title: "Language & routing",
        body: "Bilingual merchandising and deep links into results.",
        fields: ["Default locale", "EN/ES parity rules", "Query param strategy"],
      },
      {
        title: "Partner labels",
        body: "Controlled vocabulary for affiliate labels shown publicly.",
        fields: ["Preferred partners", "Restricted wording", "Locale variants"],
      },
    ],
  },
];

export default function AdminViajesSettingsPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Viajes · policy"
        title="Settings / Rules"
        subtitle="Practical planning groupings for disclosures, offer types, moderation, expiry, placement, trust, and lane-specific behavior. Values are illustrative until configuration storage exists."
        helperText="Use this page to align owners and ops before locking schema — nothing here changes production traffic yet."
      />

      <div className="space-y-8">
        {GROUPS.map((g) => (
          <div key={g.groupTitle} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#1E1810]">{g.groupTitle}</h2>
              <p className="mt-1 max-w-3xl text-sm text-[#5C5346]">{g.groupIntro}</p>
            </div>
            <div className="space-y-4">
              {g.sections.map((s) => (
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
          </div>
        ))}
      </div>
    </>
  );
}
