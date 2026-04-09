"use client";

type Primary = "phone" | "whatsapp" | "email";

type Props = {
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  primaryCta: Primary;
  onChange: (p: Partial<{ phone: string; whatsapp: string; email: string; website: string; primaryCta: Primary }>) => void;
  labels: {
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    primary: string;
  };
};

export function EmpleosCtaFieldGroup({ phone, whatsapp, email, website, primaryCta, onChange, labels }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
            autoComplete="email"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-semibold text-[color:var(--lx-text)]">{labels.website}</span>
          <input
            value={website}
            onChange={(e) => onChange({ website: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            type="url"
            placeholder="https://"
          />
        </label>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-[color:var(--lx-text)]">{labels.primary}</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {(["phone", "whatsapp", "email"] as const).map((k) => (
            <label key={k} className="inline-flex items-center gap-2">
              <input type="radio" name="empleos-primary-cta" checked={primaryCta === k} onChange={() => onChange({ primaryCta: k })} />
              {labels[k]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
