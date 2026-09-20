import Link from "next/link";

type ViajesLandingBrowseMoreProps = {
  href: string;
  label: string;
};

/** Consistent “open results” affordance at the end of browse sections */
export function ViajesLandingBrowseMore({ href, label }: ViajesLandingBrowseMoreProps) {
  return (
    <div className="mt-6 flex justify-center border-t border-dashed border-[color:var(--lx-gold-border)]/45 px-1 pt-5 sm:justify-start">
      <Link
        href={href}
        className="min-h-[44px] max-w-full min-w-0 break-words text-center text-sm font-semibold leading-snug text-sky-900/90 underline-offset-[5px] transition hover:text-sky-950 hover:underline"
      >
        {label}
      </Link>
    </div>
  );
}
