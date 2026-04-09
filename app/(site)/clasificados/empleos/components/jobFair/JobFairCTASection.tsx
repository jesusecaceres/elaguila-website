type Props = {
  intro: string;
  verFlyerLabel: string;
  contactOrganizerLabel: string;
  showVerFlyer: boolean;
  showContact: boolean;
};

export function JobFairCTASection({
  intro,
  verFlyerLabel,
  contactOrganizerLabel,
  showVerFlyer,
  showContact,
}: Props) {
  const hasButtons = showVerFlyer || showContact;
  if (!intro.trim() && !hasButtons) return null;
  return (
    <section className="mt-10 rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(30,24,16,0.06)] sm:p-8">
      {intro.trim() ? (
        <p className="max-w-3xl text-sm leading-relaxed text-[color:var(--lx-text-2)] sm:text-base">{intro}</p>
      ) : null}
      {hasButtons ? (
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${intro.trim() ? "mt-6" : ""}`}>
        {showVerFlyer ? (
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#2563EB] px-6 text-sm font-bold text-white shadow-sm transition hover:bg-[#1D4ED8] sm:w-auto sm:min-w-[11rem]"
          >
            {verFlyerLabel}
          </button>
        ) : null}
        {showContact ? (
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-center rounded-lg bg-amber-400 px-6 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-amber-300 sm:w-auto sm:min-w-[11rem]"
          >
            {contactOrganizerLabel}
          </button>
        ) : null}
      </div>
      ) : null}
    </section>
  );
}
