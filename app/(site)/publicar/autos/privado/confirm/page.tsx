import { Suspense } from "react";
import { AutosPrivadoPublishConfirm } from "../components/AutosPrivadoPublishConfirm";

export default function AutosPrivadoConfirmPublishPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPrivadoPublishConfirm />
    </Suspense>
  );
}
