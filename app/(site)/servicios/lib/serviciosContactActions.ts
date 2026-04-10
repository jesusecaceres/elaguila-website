import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";

export type ServiciosQuoteDestinationKind = "whatsapp" | "tel" | "mailto" | "website";

/** Same priority as typical quote outreach: WhatsApp → call → email → website. */
export function resolveServiciosQuoteDestination(
  profile: ServiciosProfileResolved,
  lang: ServiciosLang,
): {
  kind: ServiciosQuoteDestinationKind;
  href: string;
} | null {
  const c = profile.contact;
  const wa = c.socialLinks?.whatsapp;
  if (wa) return { kind: "whatsapp", href: wa };
  if (c.phoneTelHref) return { kind: "tel", href: c.phoneTelHref };
  if (c.emailMailtoHref) {
    const subj = encodeURIComponent(lang === "en" ? "Quote request" : "Solicitud de cotización");
    const sep = c.emailMailtoHref.includes("?") ? "&" : "?";
    return { kind: "mailto", href: `${c.emailMailtoHref}${sep}subject=${subj}` };
  }
  if (c.websiteHref) return { kind: "website", href: c.websiteHref };
  return null;
}

type SecondaryId = "whatsapp" | "call" | "callOffice" | "email" | "website";

export type ServiciosSecondaryAction = {
  id: SecondaryId;
  href: string;
  /** i18n label applied by the panel */
  labelKey: "whatsapp" | "call" | "callOffice" | "email" | "visitWebsite";
};

function normHttpOrTel(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "");
}

/** mailto:user@x.com?foo=bar → user@x.com path for dedup */
function mailtoAddrKey(h: string): string | null {
  const s = h.trim();
  if (!s.toLowerCase().startsWith("mailto:")) return null;
  const rest = s.slice(7).split("?")[0].split("#")[0];
  return decodeURIComponent(rest).toLowerCase();
}

function sameAsPrimary(
  primary: { href: string; kind: ServiciosQuoteDestinationKind } | null,
  candidateHref: string,
  candidateKind: "whatsapp" | "tel" | "mailto" | "website",
): boolean {
  if (!primary) return false;
  if (primary.kind === "mailto" && candidateKind === "mailto") {
    const p = mailtoAddrKey(primary.href);
    const c = mailtoAddrKey(candidateHref);
    if (p && c) return p === c;
  }
  return normHttpOrTel(candidateHref) === normHttpOrTel(primary.href);
}

/**
 * Live secondary actions (deduped against primary). Order: WhatsApp, mobile call, office call, email, website, maps.
 */
export function buildServiciosSecondaryActions(
  profile: ServiciosProfileResolved,
  primary: { href: string; kind: ServiciosQuoteDestinationKind } | null,
): ServiciosSecondaryAction[] {
  const c = profile.contact;
  const out: ServiciosSecondaryAction[] = [];
  const candKindById: Record<SecondaryId, "whatsapp" | "tel" | "mailto" | "website"> = {
    whatsapp: "whatsapp",
    call: "tel",
    callOffice: "tel",
    email: "mailto",
    website: "website",
  };
  const push = (a: ServiciosSecondaryAction) => {
    if (!a.href) return;
    const candKind = candKindById[a.id];
    if (primary && sameAsPrimary(primary, a.href, candKind)) return;
    if (out.some((x) => normHttpOrTel(x.href) === normHttpOrTel(a.href))) return;
    if (
      a.id === "email" &&
      out.some((x) => x.id === "email" && mailtoAddrKey(x.href) === mailtoAddrKey(a.href))
    )
      return;
    out.push(a);
  };

  if (c.socialLinks?.whatsapp) {
    push({ id: "whatsapp", href: c.socialLinks.whatsapp, labelKey: "whatsapp" });
  }
  if (c.phoneTelHref) {
    push({ id: "call", href: c.phoneTelHref, labelKey: "call" });
  }
  if (c.phoneOfficeTelHref && c.phoneOfficeDisplay) {
    push({ id: "callOffice", href: c.phoneOfficeTelHref, labelKey: "callOffice" });
  }
  if (c.emailMailtoHref) {
    push({ id: "email", href: c.emailMailtoHref, labelKey: "email" });
  }
  if (c.websiteHref) {
    push({ id: "website", href: c.websiteHref, labelKey: "visitWebsite" });
  }
  return out;
}
