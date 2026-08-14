import { Suspense } from "react";
import { BrPagoExitoClient } from "./BrPagoExitoClient";

export default function BrPagoExitoPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F1]">
      <Suspense fallback={null}>
        <BrPagoExitoClient />
      </Suspense>
    </div>
  );
}
