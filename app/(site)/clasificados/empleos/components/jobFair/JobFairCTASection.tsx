type Props = {
  intro: string;
  verFlyerLabel: string;
  contactOrganizerLabel: string;
  registerLabel?: string;
  showVerFlyer: boolean;
  showContact: boolean;
  flyerAnchorId?: string;
  registerHref?: string;
  contactHref?: string;
};

export function JobFairCTASection({
  intro,
  verFlyerLabel,
  contactOrganizerLabel,
  registerLabel,
  showVerFlyer,
  showContact,
  flyerAnchorId = "feria-flyer",
  registerHref,
  contactHref,
}: Props) {
  const hasButtons = showVerFlyer || showContact || Boolean(registerHref);
  if (!intro.trim() && !hasButtons) return null;
  return (
    <section className="mt-10 rounded-[18px] border border-[#E8DFD0] bg-[#FFFBF7] p-5 shadow-[0_10px_32px_rgba(42,40,38,0.06)] sm:p-8">
      {intro.trim() ? (
        <p className="max-w-3xl text-sm leading-relaxed text-[#4A4744] sm:text-base">{intro}</p>
      ) : null}
      {hasButtons ? (
        <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${intro.trim() ? "mt-6" : ""}`}>
          {registerHref?.startsWith("http") ? (
            <a
              href={registerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center justify-center rounded-[14px] bg-[#B8943F] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#9A7A32] sm:w-auto sm:min-w-[11rem]"
            >
              {registerLabel?.trim() || contactOrganizerLabel}
            </a>
          ) : null}
          {showVerFlyer ? (
            <a
              href={`#${flyerAnchorId}`}
              className="flex min-h-12 w-full items-center justify-center rounded-[14px] border border-[#C9A85A] bg-[#FFFBF7] px-6 text-sm font-bold text-[#6B5320] shadow-sm transition hover:bg-[#FFF5E6] sm:w-auto sm:min-w-[11rem]"
            >
              {verFlyerLabel}
            </a>
          ) : null}
          {showContact && contactHref && (contactHref.startsWith("http") || contactHref.startsWith("mailto:") || contactHref.startsWith("tel:")) ? (
            <a
              href={contactHref}
              target={contactHref.startsWith("http") ? "_blank" : undefined}
              rel={contactHref.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex min-h-12 w-full items-center justify-center rounded-[14px] border border-[#E8DFD0] bg-white px-6 text-sm font-bold text-[#2A2826] shadow-sm transition hover:bg-[#FAF7F2] sm:w-auto sm:min-w-[11rem]"
            >
              {contactOrganizerLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
