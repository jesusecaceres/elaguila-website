"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { adminActionProofErr, adminActionProofOk } from "./adminTheme";
import { formatAdminActionProofMessage, parseAdminActionResultParams } from "../_lib/adminQueueActionFlow";

export function AdminActionProofBanner() {
  const searchParams = useSearchParams();

  const proof = useMemo(() => {
    if (!searchParams) return null;
    const params = parseAdminActionResultParams(searchParams);
    if (!params) return null;
    return { message: formatAdminActionProofMessage(params), status: params.status };
  }, [searchParams]);

  if (!proof) return null;

  const cls = proof.status === "success" ? adminActionProofOk : adminActionProofErr;

  return (
    <div className={`mb-4 ${cls}`} role="status" aria-live="polite">
      {proof.message}
    </div>
  );
}
