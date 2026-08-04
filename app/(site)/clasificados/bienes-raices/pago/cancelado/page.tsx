import { Suspense } from "react";
import { BrPagoCanceladoClient } from "./BrPagoCanceladoClient";

export default function BrPagoCanceladoPage() {
  return (
    <div className="min-h-screen bg-[#F9F6F1]">
      <Suspense fallback={null}>
        <BrPagoCanceladoClient />
      </Suspense>
    </div>
  );
}
