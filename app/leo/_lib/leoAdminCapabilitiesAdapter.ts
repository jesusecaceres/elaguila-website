/**
 * LEO-11 Admin OS action registry seam — READ ONLY.
 * Does not execute Admin actions. Preserves AdminTruthStatus semantics.
 */
import "server-only";

import {
  ADMIN_OS_ACTION_REGISTRY,
  type AdminActionContract,
  type AdminActionKey,
} from "@/app/admin/_lib/adminOsActionRegistry";
import type { LeoToolAvailability } from "@/app/leo/_lib/leoTypes";

export type LeoAdminActionCapability = {
  key: AdminActionKey;
  label: string;
  title: string;
  status: AdminActionContract["status"];
  riskLevel: AdminActionContract["riskLevel"];
  dangerous: boolean;
  confirmationRecommended: boolean;
  auditRecommended: boolean;
  /** LEO interpretation — never upgrades Admin truth. */
  leoAvailability: LeoToolAvailability;
  leoNote: string;
};

function mapStatus(status: AdminActionContract["status"]): {
  leoAvailability: LeoToolAvailability;
  leoNote: string;
} {
  switch (status) {
    case "real":
      return {
        leoAvailability: "AVAILABLE",
        leoNote: "Admin marks this action REAL — LEO still does not execute it.",
      };
    case "partial":
      return {
        leoAvailability: "PARTIAL",
        leoNote: "Admin marks this action PARTIAL — not fully operational.",
      };
    case "planned":
      return {
        leoAvailability: "UNAVAILABLE",
        leoNote: "Admin marks this action PLANNED — not available.",
      };
    case "needs live proof":
      return {
        leoAvailability: "NOT_VERIFIED",
        leoNote: "Admin marks NEEDS LIVE PROOF — not fully verified/operational.",
      };
    case "needs schema gate":
      return {
        leoAvailability: "UNAVAILABLE",
        leoNote: "Admin marks NEEDS SCHEMA GATE — not available until schema gate.",
      };
    case "disabled":
      return {
        leoAvailability: "DISABLED",
        leoNote: "Admin marks this action DISABLED.",
      };
    default:
      return {
        leoAvailability: "UNAVAILABLE",
        leoNote: "Unrecognized Admin status — treated as unavailable.",
      };
  }
}

export function listLeoAdminActionCapabilities(): LeoAdminActionCapability[] {
  return (Object.keys(ADMIN_OS_ACTION_REGISTRY) as AdminActionKey[]).map((key) => {
    const a = ADMIN_OS_ACTION_REGISTRY[key];
    const mapped = mapStatus(a.status);
    return {
      key: a.key,
      label: a.label,
      title: a.title,
      status: a.status,
      riskLevel: a.riskLevel,
      dangerous: a.dangerous,
      confirmationRecommended: a.confirmationRecommended,
      auditRecommended: a.auditRecommended,
      leoAvailability: mapped.leoAvailability,
      leoNote: mapped.leoNote,
    };
  });
}

export function summarizeLeoAdminCapabilities(): {
  total: number;
  real: number;
  partial: number;
  planned: number;
  needsLiveProof: number;
  disabled: number;
  summary: string;
  actions: LeoAdminActionCapability[];
} {
  const actions = listLeoAdminActionCapabilities();
  const real = actions.filter((a) => a.status === "real").length;
  const partial = actions.filter((a) => a.status === "partial").length;
  const planned = actions.filter((a) => a.status === "planned").length;
  const needsLiveProof = actions.filter((a) => a.status === "needs live proof").length;
  const disabled = actions.filter((a) => a.status === "disabled").length;
  return {
    total: actions.length,
    real,
    partial,
    planned,
    needsLiveProof,
    disabled,
    summary: `Admin OS registry: ${actions.length} actions (${real} real, ${partial} partial, ${planned} planned, ${needsLiveProof} needs live proof, ${disabled} disabled). LEO does not execute Admin actions. Planned actions are not available; needs-live-proof are not fully verified.`,
    actions,
  };
}
