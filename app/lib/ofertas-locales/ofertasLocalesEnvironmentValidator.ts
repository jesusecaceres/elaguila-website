import "server-only";

import {
  OFERTAS_ENVIRONMENT_CONTRACT,
  type OfertaLocalEnvironmentVariableContract,
} from "./ofertasLocalesEnvironmentContract";

export type OfertaLocalEnvironmentName = "development" | "staging" | "production" | "unknown";
export type OfertaLocalEnvironmentCheckStatus = "ready" | "missing" | "malformed" | "optional" | "disabled";

export type OfertaLocalEnvironmentCheck = {
  name: string;
  subsystem: string;
  status: OfertaLocalEnvironmentCheckStatus;
  required: boolean;
  clientSafe: boolean;
  secret: boolean;
  externalValidation: "not_run";
  message: string;
};

export type OfertaLocalEnvironmentReadiness = {
  environment: OfertaLocalEnvironmentName;
  checks: OfertaLocalEnvironmentCheck[];
  summary: Record<string, "ready" | "missing" | "malformed" | "optional">;
  exposesValues: false;
};

function resolveEnvironmentName(): OfertaLocalEnvironmentName {
  const vercel = String(process.env.VERCEL_ENV ?? "").trim();
  if (vercel === "production") return "production";
  if (vercel === "preview") return "staging";
  if (process.env.NODE_ENV === "development") return "development";
  return "unknown";
}

function isRequired(contract: OfertaLocalEnvironmentVariableContract, env: OfertaLocalEnvironmentName): boolean {
  if (env === "production") return contract.requiredInProduction;
  if (env === "staging") return contract.requiredInStaging;
  if (env === "development") return contract.requiredInDevelopment;
  return contract.requiredInStaging;
}

function validateShape(contract: OfertaLocalEnvironmentVariableContract, value: string): OfertaLocalEnvironmentCheckStatus {
  if (!value) return "missing";
  if (contract.validator === "url") {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? "ready" : "malformed";
    } catch {
      return "malformed";
    }
  }
  if (contract.validator === "stripe_secret_prefix") return /^sk_(test|live)_/.test(value) ? "ready" : "malformed";
  if (contract.validator === "stripe_publishable_prefix") return /^pk_(test|live)_/.test(value) ? "ready" : "malformed";
  if (contract.validator === "positive_integer") return /^\d+$/.test(value) && Number(value) > 0 ? "ready" : "malformed";
  if (contract.validator === "enum") return value ? "ready" : "missing";
  return "ready";
}

export function validateOfertasLocalesEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): OfertaLocalEnvironmentReadiness {
  const environment = resolveEnvironmentName();
  const checks = OFERTAS_ENVIRONMENT_CONTRACT.map((contract) => {
    const value = String(env[contract.name] ?? "").trim();
    const required = isRequired(contract, environment);
    const shape = validateShape(contract, value);
    const status: OfertaLocalEnvironmentCheckStatus =
      shape === "missing" && !required ? "optional" : shape;
    return {
      name: contract.name,
      subsystem: contract.subsystem,
      status,
      required,
      clientSafe: contract.clientSafe,
      secret: contract.secret,
      externalValidation: "not_run" as const,
      message: status === "ready" ? "Configured by presence/shape only; external validation not run." : contract.missingBehavior,
    };
  });

  const summary: OfertaLocalEnvironmentReadiness["summary"] = {};
  for (const check of checks) {
    const current = summary[check.subsystem];
    if (check.status === "malformed" || current === "malformed") summary[check.subsystem] = "malformed";
    else if (check.status === "missing" || current === "missing") summary[check.subsystem] = "missing";
    else if (check.status === "ready" || current === "ready") summary[check.subsystem] = "ready";
    else summary[check.subsystem] = "optional";
  }

  return { environment, checks, summary, exposesValues: false };
}
