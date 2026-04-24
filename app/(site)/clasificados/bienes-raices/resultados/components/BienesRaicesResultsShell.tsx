import { brLuxuryPageClass } from "../../shared/brResultsTheme";

export function BienesRaicesResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={brLuxuryPageClass}>
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28">{children}</div>
    </div>
  );
}
