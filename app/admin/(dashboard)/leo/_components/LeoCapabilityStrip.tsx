const AVAILABLE = [
  "Truth",
  "Reason Chains",
  "Attention",
  "Client Care",
  "Memory",
  "Governance",
  "Decision support",
  "Watchers",
  "Preparation",
] as const;

const COMING_LATER = [
  "AI reasoning",
  "Background monitoring",
  "Notifications",
  "Concierge connection",
  "GitHub/Vercel intelligence",
  "Voice",
  "Autonomous execution",
] as const;

export function LeoCapabilityStrip() {
  return (
    <div className="min-w-0" aria-labelledby="leo-cap-heading">
      <h3 id="leo-cap-heading" className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">
        Capability
      </h3>
      <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">Available</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{AVAILABLE.join(" · ")}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Coming later</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{COMING_LATER.join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}
