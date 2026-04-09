import { FaCalendarAlt, FaClock, FaEnvelope, FaPhone } from "react-icons/fa";
import { SiWhatsapp } from "react-icons/si";

type Props = {
  pay: string;
  jobType: string;
  schedule: string;
  description: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  emailLabel: string;
  labels: {
    jobType: string;
    schedule: string;
  };
  /** When false, omit the entire contact button stack (pay/description still show). */
  showContactRow: boolean;
};

export function QuickJobCTACard({
  pay,
  jobType,
  schedule,
  description,
  phone,
  whatsapp,
  email,
  emailLabel,
  labels,
  showContactRow,
}: Props) {
  const hasSecondRow = Boolean(whatsapp || email);

  return (
    <div className="rounded-lg border border-black/[0.06] bg-white p-5 shadow-[0_4px_24px_rgba(30,24,16,0.08)] sm:p-6">
      <p className="text-2xl font-bold text-emerald-700">{pay}</p>

      <div className="mt-5 space-y-3 text-sm text-[color:var(--lx-text-2)]">
        <div className="flex gap-3">
          <FaCalendarAlt className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-muted)]" aria-hidden />
          <span>
            <span className="sr-only">{labels.jobType}: </span>
            {jobType}
          </span>
        </div>
        <div className="flex gap-3">
          <FaClock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--lx-muted)]" aria-hidden />
          <span>
            <span className="sr-only">{labels.schedule}: </span>
            {schedule}
          </span>
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{description}</p>

      {showContactRow ? (
        <div className="mt-6 flex flex-col gap-3">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\D/g, "")}`}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <FaPhone className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{phone}</span>
            </a>
          ) : null}

          {hasSecondRow ? (
            <div
              className={`grid gap-3 ${whatsapp && email ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
            >
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <SiWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                  WhatsApp
                </a>
              ) : null}
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#C41E3A] bg-[#C41E3A] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#A01830]"
                >
                  <FaEnvelope className="h-4 w-4 shrink-0" aria-hidden />
                  {emailLabel}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
