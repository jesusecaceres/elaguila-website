"use client";

type Primary = "apply" | "phone" | "whatsapp" | "email" | "website";

type Props = {
  applyLabel: string;
  websiteUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  primaryCta: Primary;
  onChange: (p: Partial<{ applyLabel: string; websiteUrl: string; phone: string; whatsapp: string; email: string; primaryCta: Primary }>) => void;
  labels: {
    apply: string;
    website: string;
    phone: string;
    whatsapp: string;
    email: string;
    primary: string;
    primaryHint?: string;
  };
  applyPlaceholder?: string;
};

export function EmpleosPremiumCtaFieldGroup({
  applyLabel,
  websiteUrl,
  phone,
  whatsapp,
  email,
  primaryCta,
  onChange,
  labels,
  applyPlaceholder,
}: Props) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="font-semibold text-[color:var(--lx-text)]">{labels.apply}</span>
        <input
          value={applyLabel}
          onChange={(e) => onChange({ applyLabel: e.target.value })}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          placeholder={applyPlaceholder}
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
          <span className="font-semibold text-[color:var(--lx-text)]">{labels.phone}</span>
          <input
            value={phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            type="tel"
            autoComplete="tel"
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
        <label className="block text-sm sm:col-span-2">
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
        {labels.primaryHint ? (
          <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{labels.primaryHint}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="empleos-premium-primary-cta" checked={primaryCta === "apply"} onChange={() => onChange({ primaryCta: "apply" })} />
            {labels.apply}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="empleos-premium-primary-cta" checked={primaryCta === "phone"} onChange={() => onChange({ primaryCta: "phone" })} />
            {labels.phone}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="empleos-premium-primary-cta" checked={primaryCta === "whatsapp"} onChange={() => onChange({ primaryCta: "whatsapp" })} />
            {labels.whatsapp}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="empleos-premium-primary-cta" checked={primaryCta === "email"} onChange={() => onChange({ primaryCta: "email" })} />
            {labels.email}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="empleos-premium-primary-cta" checked={primaryCta === "website"} onChange={() => onChange({ primaryCta: "website" })} />
            {labels.website}
          </label>
        </div>
      </fieldset>
    </div>
  );
}
