import { adminCardBase } from "@/app/admin/_components/adminTheme";

const AVAILABLE = [
  "Truth",
  "Reason Chains",
  "Attention",
  "Client Care",
  "Memory foundation",
  "Governance",
  "Decision support",
  "On-demand watchers",
  "Preparation",
] as const;

const NOT_ACTIVE = [
  "AI reasoning",
  "Background monitoring",
  "Notifications",
  "Business Concierge connection",
  "GitHub/Vercel intelligence",
  "Voice",
  "Autonomous execution",
] as const;

export function LeoCapabilityStrip() {
  return (
    <section className={`${adminCardBase} min-w-0 p-4 sm:p-5`} aria-labelledby="leo-cap-heading">
      <h2 id="leo-cap-heading" className="text-base font-bold text-[#1E1810]">
        Current capability
      </h2>
      <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">Available now</p>
          <ul className="mt-1.5 space-y-1">
            {AVAILABLE.map((item) => (
              <li key={item} className="break-words text-xs text-[#5C5346]">
                · {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Not active yet</p>
          <ul className="mt-1.5 space-y-1">
            {NOT_ACTIVE.map((item) => (
              <li key={item} className="break-words text-xs text-[#5C5346]">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
