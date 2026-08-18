const AVAILABLE = [
  "Truth",
  "Reason Chains",
  "Attention",
  "Client Care",
  "Memory",
  "Governance",
  "Decision support",
  "On-demand watchers",
  "Preparation",
  "Evidence-grounded AI reasoning",
  "Admin action capability read",
] as const;

function projectConnectionLabel(configured: boolean, name: string): string {
  return configured ? `${name} (connected)` : `${name} (not configured)`;
}

export function LeoCapabilityStrip() {
  const githubConfigured = Boolean(process.env.LEO_GITHUB_TOKEN?.trim());
  const vercelConfigured = Boolean(
    process.env.LEO_VERCEL_TOKEN?.trim() || process.env.VERCEL_TOKEN?.trim(),
  );

  const connected: string[] = [];
  const notConnected: string[] = [
    "Background monitoring",
    "Notifications",
    "Business Concierge connection",
    "Voice",
    "Autonomous execution",
  ];

  if (githubConfigured) connected.push(projectConnectionLabel(true, "GitHub"));
  else notConnected.unshift(projectConnectionLabel(false, "GitHub"));

  if (vercelConfigured) connected.push(projectConnectionLabel(true, "Vercel"));
  else notConnected.unshift(projectConnectionLabel(false, "Vercel"));

  return (
    <div className="min-w-0" aria-labelledby="leo-cap-heading">
      <h3 id="leo-cap-heading" className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">
        Capability
      </h3>
      <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">Available</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{AVAILABLE.join(" · ")}</p>
          {connected.length > 0 ? (
            <>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">Connected</p>
              <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{connected.join(" · ")}</p>
            </>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Not connected yet</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{notConnected.join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}
