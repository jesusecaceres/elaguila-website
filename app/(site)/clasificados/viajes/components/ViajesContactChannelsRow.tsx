"use client";

import type { ViajesContactChannel } from "../data/viajesOfferDetailSampleData";
import { FiGlobe, FiMail, FiPhone } from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp, SiX, SiYoutube } from "react-icons/si";

function IconFor({ kind }: { kind: ViajesContactChannel["kind"] }) {
  const common = "h-5 w-5";
  switch (kind) {
    case "tel":
    case "telOffice":
      return <FiPhone className={common} aria-hidden />;
    case "whatsapp":
      return <SiWhatsapp className={common} aria-hidden />;
    case "email":
      return <FiMail className={common} aria-hidden />;
    case "website":
      return <FiGlobe className={common} aria-hidden />;
    case "facebook":
      return <SiFacebook className={common} aria-hidden />;
    case "instagram":
      return <SiInstagram className={common} aria-hidden />;
    case "tiktok":
      return <SiTiktok className={common} aria-hidden />;
    case "youtube":
      return <SiYoutube className={common} aria-hidden />;
    case "twitter":
      return <SiX className={common} aria-hidden />;
    default:
      return <FiGlobe className={common} aria-hidden />;
  }
}

export function ViajesContactChannelsRow({ channels, ariaLabel }: { channels: ViajesContactChannel[]; ariaLabel: string }) {
  if (!channels.length) return null;
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{ariaLabel}</p>
      <ul className="flex flex-wrap gap-2">
        {channels.map((ch, i) => (
          <li key={`${ch.kind}-${ch.href}-${i}`}>
            <a
              href={ch.href}
              target={ch.href.startsWith("mailto:") || ch.href.startsWith("tel:") ? undefined : "_blank"}
              rel={ch.href.startsWith("mailto:") || ch.href.startsWith("tel:") ? undefined : "noopener noreferrer"}
              className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[color:var(--lx-nav-hover)]"
            >
              <span className="text-[color:var(--lx-gold)]">
                <IconFor kind={ch.kind} />
              </span>
              <span className="max-w-[200px] truncate">{ch.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
