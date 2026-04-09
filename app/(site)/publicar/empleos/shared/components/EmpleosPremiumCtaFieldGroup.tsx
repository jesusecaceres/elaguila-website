"use client";

type Primary = "apply" | "whatsapp" | "email" | "website";

type Props = {
  applyLabel: string;
  websiteUrl: string;
  whatsapp: string;
  email: string;
  primaryCta: Primary;
  onChange: (p: Partial<{ applyLabel: string; websiteUrl: string; whatsapp: string; email: string; primaryCta: Primary }>) => void;
  labels: {
    apply: string;
    website: string;
    whatsapp: string;
    email: string;
    primary: string;
  };
};

export function EmpleosPremiumCtaFieldGroup({ applyLabel, websiteUrl, whatsapp, email, primaryCta, onChange, labels }: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="font-semibold text-[color:var(--lx-text)]">{labels.apply}</span>
        <input
          value={applyLabel}
          onChange={(e) => onChange({ applyLabel: e.target.value })}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-semibold text-[color:var(--lx-text)]">{labels.website}</span>
          <input
            value={websiteUrl}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            type="url"
            placeholder="https://"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[color:var(--lx-text)]">{labels.whatsapp}</span>
          <input
            value={whatsapp}
            onChange={(e) => onChange({ whatsapp: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            placeholder="15551234567"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[color:var(--lx-text)]">{labels.email}</span>
          <input
            value={email}
            onChange={(e) => onChange({ email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            type="email"
          />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-[color:var(--lx-text)]">{labels.primary}</legend>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {(["apply", "whatsapp", "email", "website"] as const).map((k) => (
            <label key={k} className="inline-flex items-center gap-2">
              <input type="radio" name="empleos-premium-primary-cta" checked={primaryCta === k} onChange={() => onChange({ primaryCta: k })} />
              {labels[k]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
