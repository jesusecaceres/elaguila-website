import { brResultsPaperBgClass } from "../../shared/brResultsTheme";

export function BienesRaicesResultsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={"min-h-screen text-[#2C2416] " + brResultsPaperBgClass}>
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-24 sm:px-5 sm:pb-20 sm:pt-28">{children}</div>
    </div>
  );
}
