import { buildSmsHref, buildTelHref } from "@/app/lib/digitalContact/humanConnection/nativeChannelHrefs";
import type { PublicResourceRecord, RecursosLang } from "@/app/lib/recursos/types";

const COPY: Record<RecursosLang, { eyebrow: string; call: string; text: string }> = {
  es: { eyebrow: "Ayuda ahora", call: "Llamar", text: "Enviar texto" },
  en: { eyebrow: "Help now", call: "Call", text: "Send text" },
};

/**
 * Life-safety escape hatch — must never depend on search or category browsing working, and
 * must never show a fabricated hotline. Only resources the eligible public dataset itself marks
 * `urgencyLevel: "help-now"` and that carry a real phone/SMS number ever appear here. Direct
 * `tel:`/`sms:` anchors (not the full CtaActionSheet) for the fastest possible one-tap action —
 * every second matters for this specific bar.
 */
export function HelpNowBar({ resources, lang }: { resources: PublicResourceRecord[]; lang: RecursosLang }) {
  const t = COPY[lang];

  const items = resources
    .map((r) => {
      const phone = r.contact.crisisPhone || r.contact.phone || null;
      const sms = r.contact.sms || null;
      const telHref = phone ? buildTelHref(phone) : null;
      const smsHref = sms ? buildSmsHref(sms) : null;
      if (!telHref && !smsHref) return null;
      return { resource: r, telHref, smsHref };
    })
    .filter((x): x is { resource: PublicResourceRecord; telHref: string | null; smsHref: string | null } => Boolean(x))
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section
      aria-label={t.eyebrow}
      className="rounded-xl border border-[#C97A4A]/40 bg-[#FBF1E8] px-4 py-3 sm:px-5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#7A3E1E]">{t.eyebrow}</span>
        {items.map(({ resource, telHref, smsHref }) => (
          <span key={resource.slug} className="flex items-center gap-1.5">
            {telHref ? (
              <a
                href={telHref}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#7A1E2C] px-3 text-xs font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
              >
                {t.call} · {resource.organizationName}
              </a>
            ) : null}
            {smsHref ? (
              <a
                href={smsHref}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#C97A4A]/60 bg-[#FFFDF7] px-3 text-xs font-bold text-[#7A3E1E] transition hover:bg-[#FBF1E8]"
              >
                {t.text}
              </a>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}
