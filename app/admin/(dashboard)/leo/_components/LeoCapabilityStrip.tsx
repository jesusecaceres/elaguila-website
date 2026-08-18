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
  "Project change intelligence",
] as const;

export function LeoCapabilityStrip() {
  const githubConfigured = Boolean(process.env.LEO_GITHUB_TOKEN?.trim());
  const vercelConfigured = Boolean(
    process.env.LEO_VERCEL_TOKEN?.trim() || process.env.VERCEL_TOKEN?.trim(),
  );
  // Config presence only — does not claim live Gmail/Calendar API success.
  const googleWorkspaceConfigured = Boolean(
    process.env.LEO_GOOGLE_CLIENT_ID?.trim() &&
      process.env.LEO_GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.LEO_GOOGLE_REFRESH_TOKEN?.trim(),
  );
  const googleOwnerConfigured = Boolean(process.env.LEO_GOOGLE_ACCOUNT_EMAIL?.trim());
  const googleLabel = googleWorkspaceConfigured ? "Configured" : "Not configured";

  const projectStatus =
    githubConfigured && vercelConfigured
      ? "Project intelligence connected"
      : githubConfigured || vercelConfigured
        ? "Project intelligence partial"
        : "Project intelligence not configured";

  const notConnected: string[] = [
    "Background monitoring",
    "Notifications",
    "Business Concierge connection",
    "Voice",
    "Autonomous execution",
  ];

  return (
    <div className="min-w-0" aria-labelledby="leo-cap-heading">
      <h3 id="leo-cap-heading" className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">
        Capability
      </h3>
      <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">Available</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{AVAILABLE.join(" · ")}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">
            Project connections
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">
            GitHub — {githubConfigured ? "Connected" : "Not configured"} · Vercel —{" "}
            {vercelConfigured ? "Connected" : "Not configured"} · {projectStatus}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">
            Google Workspace
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">
            Workspace — {googleLabel} · Gmail — {googleLabel} · Calendar — {googleLabel}
            {googleWorkspaceConfigured
              ? ` · Owner account — ${googleOwnerConfigured ? "Configured" : "Not configured"}`
              : null}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Not connected yet</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">{notConnected.join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}
