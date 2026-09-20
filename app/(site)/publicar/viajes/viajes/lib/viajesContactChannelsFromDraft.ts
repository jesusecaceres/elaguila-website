import type { ViajesContactChannel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function withHttp(url: string) {
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

/** User-entered URL or short handle → safe https URL for icons */
export function viajesNormalizeSocialUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  return withHttp(t);
}

function pushUnique(out: ViajesContactChannel[], ch: ViajesContactChannel) {
  if (!ch.href.trim()) return;
  if (out.some((x) => x.href === ch.href && x.kind === ch.kind)) return;
  out.push(ch);
}

export function viajesBuildNegociosContactChannels(p: {
  phone: string;
  phoneOffice: string;
  whatsapp: string;
  website: string;
  email: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
  socialTwitter: string;
}): ViajesContactChannel[] {
  const out: ViajesContactChannel[] = [];
  const p1 = digitsOnly(p.phone);
  if (p1.length >= 8) pushUnique(out, { kind: "tel", href: `tel:${p1}`, label: p.phone.trim() });
  const p2 = digitsOnly(p.phoneOffice);
  if (p2.length >= 8 && p2 !== p1) pushUnique(out, { kind: "telOffice", href: `tel:${p2}`, label: p.phoneOffice.trim() });
  const w = p.whatsapp.trim();
  if (w.startsWith("http")) pushUnique(out, { kind: "whatsapp", href: w, label: "WhatsApp" });
  else {
    const n = digitsOnly(w);
    if (n.length >= 8) pushUnique(out, { kind: "whatsapp", href: `https://wa.me/${n}`, label: "WhatsApp" });
  }
  const web = withHttp(p.website);
  if (web) pushUnique(out, { kind: "website", href: web, label: "Web" });
  const em = p.email.trim();
  if (em.includes("@")) pushUnique(out, { kind: "email", href: `mailto:${encodeURIComponent(em)}`, label: em });

  const sf = viajesNormalizeSocialUrl(p.socialFacebook);
  if (sf) pushUnique(out, { kind: "facebook", href: sf, label: "Facebook" });
  const si = viajesNormalizeSocialUrl(p.socialInstagram);
  if (si) pushUnique(out, { kind: "instagram", href: si, label: "Instagram" });
  const st = viajesNormalizeSocialUrl(p.socialTiktok);
  if (st) pushUnique(out, { kind: "tiktok", href: st, label: "TikTok" });
  const sy = viajesNormalizeSocialUrl(p.socialYoutube);
  if (sy) pushUnique(out, { kind: "youtube", href: sy, label: "YouTube" });
  const sx = viajesNormalizeSocialUrl(p.socialTwitter);
  if (sx) pushUnique(out, { kind: "twitter", href: sx, label: "X" });

  return out;
}

export function viajesBuildPrivadoContactChannels(p: {
  phone: string;
  phoneOffice: string;
  whatsapp: string;
  email: string;
  website: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialYoutube: string;
  socialTwitter: string;
}): ViajesContactChannel[] {
  const out: ViajesContactChannel[] = [];
  const p1 = digitsOnly(p.phone);
  if (p1.length >= 8) pushUnique(out, { kind: "tel", href: `tel:${p1}`, label: p.phone.trim() });
  const p2 = digitsOnly(p.phoneOffice);
  if (p2.length >= 8 && p2 !== p1) pushUnique(out, { kind: "telOffice", href: `tel:${p2}`, label: p.phoneOffice.trim() });
  const w = p.whatsapp.trim();
  if (w.startsWith("http")) pushUnique(out, { kind: "whatsapp", href: w, label: "WhatsApp" });
  else {
    const n = digitsOnly(w);
    if (n.length >= 8) pushUnique(out, { kind: "whatsapp", href: `https://wa.me/${n}`, label: "WhatsApp" });
  }
  const em = p.email.trim();
  if (em.includes("@")) pushUnique(out, { kind: "email", href: `mailto:${encodeURIComponent(em)}`, label: em });
  const web = withHttp(p.website);
  if (web) pushUnique(out, { kind: "website", href: web, label: "Web" });

  const sf = viajesNormalizeSocialUrl(p.socialFacebook);
  if (sf) pushUnique(out, { kind: "facebook", href: sf, label: "Facebook" });
  const si = viajesNormalizeSocialUrl(p.socialInstagram);
  if (si) pushUnique(out, { kind: "instagram", href: si, label: "Instagram" });
  const st = viajesNormalizeSocialUrl(p.socialTiktok);
  if (st) pushUnique(out, { kind: "tiktok", href: st, label: "TikTok" });
  const sy = viajesNormalizeSocialUrl(p.socialYoutube);
  if (sy) pushUnique(out, { kind: "youtube", href: sy, label: "YouTube" });
  const sx = viajesNormalizeSocialUrl(p.socialTwitter);
  if (sx) pushUnique(out, { kind: "twitter", href: sx, label: "X" });

  return out;
}
