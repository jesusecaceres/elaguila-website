import { Suspense } from "react";
import { AutosNegociosPublishConfirm } from "../components/AutosNegociosPublishConfirm";

export default function AutosNegociosConfirmPublishPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosNegociosPublishConfirm />
    </Suspense>
  );
}
