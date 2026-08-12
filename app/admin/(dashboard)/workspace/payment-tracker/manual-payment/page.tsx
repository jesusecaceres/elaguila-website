import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { getCurrentAdminAccessContext, requirePaymentTrackerAccess } from "@/app/admin/_lib/adminAccessControl";
import { fetchPaymentTrackerSnapshot } from "@/app/admin/_lib/paymentTrackerData";
import { REVENUE_V1_PACKAGE_MATRIX } from "@/app/lib/listingPlans/revenuePricingMatrix";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { ManualPaymentClient } from "./ManualPaymentClient";

export const dynamic = "force-dynamic";

/**
 * Package E Build E3, Gate 4 — the minimum real admin UI for the confirmed backend gap: the
 * manual-cleared-payment primitive (record -> verify_cleared -> fulfill, or reject/reverse) was
 * real and permission-gated but had zero UI callers. This page and its client component call the
 * EXACT existing /api/admin/revenue-os/manual-payments contract — no new payment system, no new
 * Stripe object, no invented payment method or package.
 */
export default async function AdminManualPaymentPage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const access = await getCurrentAdminAccessContext();
  requirePaymentTrackerAccess(access);

  const pendingSnapshot = await fetchPaymentTrackerSnapshot({ status: "pending", limit: 100 });
  const pendingManual = pendingSnapshot.rows.filter((r) => r.source === "admin_manual");

  const packageOptions = REVENUE_V1_PACKAGE_MATRIX.filter((p) => p.priceCents > 0).map((p) => ({
    packageKey: p.packageKey,
    category: p.category,
    label: p.label,
    priceCents: p.priceCents,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Manual cleared payment"
        subtitle="Record a non-Stripe payment (Zelle, ACH, cash, check, money order) and mark it cleared to activate the package entitlement — once, auditable, never a fake Stripe charge."
      />
      <p className="mb-4 text-xs">
        <Link href="/admin/workspace/payment-tracker" className="font-bold text-[#6B5B2E] underline">
          ← Back to payment tracker
        </Link>
      </p>
      {pendingSnapshot.unavailable ? (
        <div className={`${adminCardBase} mb-6 border-2 border-amber-200 bg-amber-50 p-5`}>
          <p className="text-sm text-amber-900">{pendingSnapshot.note ?? "Payment records unavailable."}</p>
        </div>
      ) : null}
      <ManualPaymentClient packageOptions={packageOptions} pendingManual={pendingManual} />
    </div>
  );
}
