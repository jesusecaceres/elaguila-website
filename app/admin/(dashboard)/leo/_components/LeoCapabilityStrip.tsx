import type { LeoGoogleWorkspaceCapabilityTruth } from "@/app/leo/_lib/leoGoogleWorkspaceCapabilityTruth";
import type { LeoProjectConfigDiagnostic } from "@/app/leo/_lib/leoTypes";

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

export function LeoCapabilityStrip({
  project,
  google,
}: {
  project: LeoProjectConfigDiagnostic;
  google: LeoGoogleWorkspaceCapabilityTruth;
}) {
  const notConnected: string[] = [
    "Background monitoring",
    "Business Concierge connection",
    "Autonomous execution",
  ];

  const githubLine = project.github.connectorConnected
    ? project.github.projectIntelligenceConfigured
      ? "GitHub — connector connected · project intelligence ready"
      : "GitHub — connector connected · project intelligence mapping incomplete"
    : "GitHub — connector not configured";

  const vercelLine = project.vercel.connectorConnected
    ? project.vercel.projectIntelligenceConfigured
      ? "Vercel — connector connected · project intelligence ready"
      : "Vercel — connector connected · project mapping (team/project ids) not configured"
    : "Vercel — connector not configured";

  const sendScope =
    google.gmailSendScopeHealth === "HEALTHY"
      ? "send scope proven"
      : google.gmailSendScopeHealth === "UNPROVEN"
        ? "send scope unproven"
        : "send scope not configured";

  return (
    <div className="min-w-0" aria-labelledby="leo-cap-heading" data-leo-capability-truth>
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
            {githubLine}. {vercelLine}.
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#2A4536]">
            Google Workspace
          </p>
          <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]" data-leo-google-capability>
            {google.summary} Read: Gmail {google.gmailReadConfigured ? "configured" : "not configured"}, Calendar{" "}
            {google.calendarReadConfigured ? "configured" : "not configured"}. {sendScope}. Write flag{" "}
            {google.writeFlagEnabled ? "on" : "off"}. Reply execution{" "}
            {google.gmailReplyExecutionAvailable ? "available" : "unavailable"}.
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
