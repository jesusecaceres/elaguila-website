import Image from "next/image";
import type { DigitalContactCopy } from "@/app/lib/digitalContact/digitalContactCopy";
import type { DigitalContactProfile } from "@/app/lib/digitalContact/digitalContactTypes";

type Props = {
  profile: DigitalContactProfile;
  copy: DigitalContactCopy;
};

/** Minimal, professional, Leonix-branded footer — no sitewide link sprawl. */
export function DigitalContactFooter({ profile, copy }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="mx-auto w-full max-w-2xl px-5 pb-10 pt-14 text-center sm:px-6">
      <div className="relative mx-auto h-9 w-28 opacity-90">
        <Image src="/logo-clean.png" alt={profile.company} fill sizes="112px" className="object-contain" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7B28]">{copy.footerTagline}</p>
      <p className="mt-3 text-xs text-[#5F6258]">
        © {year} {profile.legalEntity}. {copy.footerRights}
      </p>
    </footer>
  );
}
