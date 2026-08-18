/**
 * LEO-11 tool catalog — runtime availability resolution over static registry.
 * No client registration. No AI registration.
 */
import "server-only";

import { isLeoGithubConfigured, isLeoVercelConfigured } from "@/app/leo/_lib/leoProjectConfig";
import { listLeoToolDefinitions } from "@/app/leo/_lib/leoToolRegistry";
import type {
  LeoToolAvailability,
  LeoToolCatalog,
  LeoToolCatalogEntry,
  LeoToolId,
} from "@/app/leo/_lib/leoTypes";

function projectToolsRuntimeAvailability(): {
  github: LeoToolAvailability;
  vercel: LeoToolAvailability;
  snapshot: LeoToolAvailability;
} {
  const github = isLeoGithubConfigured() ? "AVAILABLE" : "NOT_CONFIGURED";
  const vercel = isLeoVercelConfigured() ? "AVAILABLE" : "NOT_CONFIGURED";
  const snapshot =
    github === "AVAILABLE" || vercel === "AVAILABLE" ? "AVAILABLE" : "NOT_CONFIGURED";
  return { github, vercel, snapshot };
}

function refineAvailability(
  toolId: LeoToolId,
  declared: LeoToolAvailability,
  project: ReturnType<typeof projectToolsRuntimeAvailability>,
): LeoToolAvailability {
  if (toolId === "leo.project.github.read") return project.github;
  if (toolId === "leo.project.vercel.read") return project.vercel;
  if (toolId === "leo.project.snapshot.read") return project.snapshot;
  return declared;
}

/**
 * Owner-facing catalog with truthful runtime availability.
 */
export function getLeoToolCatalog(nowMs?: number): LeoToolCatalog {
  const generatedAt = new Date(nowMs ?? Date.now()).toISOString();
  const project = projectToolsRuntimeAvailability();
  const tools: LeoToolCatalogEntry[] = listLeoToolDefinitions().map((d) => ({
    ...d,
    runtimeAvailability: refineAvailability(d.id, d.availability, project),
  }));

  const available = tools.filter((t) => t.runtimeAvailability === "AVAILABLE");
  const partial = tools.filter((t) => t.runtimeAvailability === "PARTIAL");
  const notConfigured = tools.filter((t) => t.runtimeAvailability === "NOT_CONFIGURED");
  const other = tools.filter(
    (t) =>
      t.runtimeAvailability !== "AVAILABLE" &&
      t.runtimeAvailability !== "PARTIAL" &&
      t.runtimeAvailability !== "NOT_CONFIGURED",
  );

  const humanGroups: LeoToolCatalog["humanGroups"] = [
    {
      label: "Executive intelligence",
      toolIds: [
        "leo.attention.read",
        "leo.reasonChain.read",
        "leo.watcher.run",
        "leo.capabilities.read",
      ],
      status: "available",
    },
    {
      label: "Client Care",
      toolIds: ["leo.clientCare.read"],
      status: "available",
    },
    {
      label: "Memory",
      toolIds: ["leo.memory.read"],
      status: "available",
    },
    {
      label: "Decision support",
      toolIds: ["leo.decision.analyze"],
      status: "available",
    },
    {
      label: "Preparation",
      toolIds: ["leo.preparation.prepare"],
      status: "available",
    },
    {
      label: "Admin capabilities (read)",
      toolIds: ["leo.adminCapabilities.read"],
      status: "available",
    },
    {
      label: "GitHub project intelligence",
      toolIds: ["leo.project.github.read"],
      status: project.github === "AVAILABLE" ? "available" : "not_configured",
    },
    {
      label: "Vercel project intelligence",
      toolIds: ["leo.project.vercel.read"],
      status: project.vercel === "AVAILABLE" ? "available" : "not_configured",
    },
    {
      label: "Project snapshot",
      toolIds: ["leo.project.snapshot.read"],
      status: project.snapshot === "AVAILABLE" ? "available" : "not_configured",
    },
  ];

  return {
    generatedAt,
    tools,
    available,
    partial,
    notConfigured,
    other,
    humanGroups,
  };
}

export function composeToolCatalogCapabilitySummary(catalog: LeoToolCatalog): string {
  const availableLabels = catalog.humanGroups
    .filter((g) => g.status === "available")
    .map((g) => g.label);
  const notConfiguredLabels = catalog.humanGroups
    .filter((g) => g.status === "not_configured")
    .map((g) => g.label);

  const lines = [
    "LEO can help you operate Leonix as an executive cockpit — without inventing facts or executing consequential actions.",
    "",
    `Available tools: ${availableLabels.join(" · ") || "none"}.`,
  ];

  if (catalog.partial.length > 0) {
    lines.push(
      `Partial: ${catalog.partial.map((t) => t.name).join(" · ")}.`,
    );
  }

  if (notConfiguredLabels.length > 0) {
    lines.push(`Not configured yet: ${notConfiguredLabels.join(" · ")}.`);
  }

  lines.push(
    "",
    "Governance: GREEN read/analyze · YELLOW prepare only · RED requires Chuy approval · NEVER blocked.",
    "",
    "Not connected yet: background monitoring, notifications, Business Concierge connection, voice, and autonomous execution.",
  );

  return lines.join("\n");
}
