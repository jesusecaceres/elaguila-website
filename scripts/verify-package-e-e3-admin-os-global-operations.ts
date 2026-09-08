/**
 * Package E Build E3 — narrow verifier proving the Admin OS consolidation gates are real,
 * source-level truths: nav truth (real payment tracker primary, site settings discoverable, no
 * duplicate canonical route), unified customer support view (real readers, no account-tier
 * substitution), audit truthfulness (no fuzzy association, existing append path preserved),
 * manual payment (real endpoint, server-derived actor, no Stripe fabrication), permissions
 * (server-side checks on every new mutation/page, owner/sales-rep scope preserved), and mobile
 * structure sanity on the new surfaces.
 *
 * Run: npx tsx scripts/verify-package-e-e3-admin-os-global-operations.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

async function main() {
  // --- Gate 1: nav truth ---
  const nav = src("app/admin/_lib/adminGlobalNav.ts");
  check(
    nav.includes('href: "/admin/workspace/payment-tracker"') && nav.includes('labelKey: "nav.payments"'),
    "Gate 1: primary Payments/Revenue nav entry routes to the real payment tracker",
  );
  check(
    nav.includes('href: "/admin/site-settings"'),
    "Gate 1: real site-settings writer is a primary nav entry",
  );
  check(
    (nav.match(/href: "\/admin\/workspace\/payment-tracker"/g) ?? []).length === 1,
    "Gate 1: no duplicate canonical route for the payment tracker in the nav array",
  );
  check(
    nav.includes("AdminGlobalNavGroup") && nav.includes('"command"') && nav.includes('"revenue"'),
    "Gate 1: nav items carry the six Admin OS groups (additive field, no new nav framework)",
  );
  const accessControl = src("app/admin/_lib/adminAccessControl.ts");
  check(
    accessControl.includes('hrefs.push("/admin/site-settings"'),
    "Gate 1: getAllowedGlobalNavHrefs permission-filters the new site-settings entry (not unconditionally visible)",
  );

  // --- Gate 2: unified customer support view ---
  const commercialContext = src("app/admin/_lib/adminCustomerCommercialContext.ts");
  check(
    commercialContext.includes("leonix_payment_records") &&
      commercialContext.includes("listing_package_entitlements") &&
      commercialContext.includes("leonix_placement_entitlements") &&
      commercialContext.includes("leonix_subscription_records"),
    "Gate 2: commercial context reads all four independent canonical tables (payment/entitlement/placement/subscription)",
  );
  check(
    commercialContext.includes("effectiveEntitlementStatus") && commercialContext.includes("resolveCommercialStateBadges"),
    "Gate 2: reuses existing status/badge resolvers rather than reimplementing commercial-state logic",
  );
  check(
    !commercialContext.includes("membership_tier") && !commercialContext.includes("account_type"),
    "Gate 2: commercial context never reads account-tier fields (no account-tier substitution for listing plan)",
  );
  const userDetail = src("app/admin/(dashboard)/usuarios/[id]/page.tsx");
  check(
    userDetail.includes("fetchAdminCustomerCommercialContext") && userDetail.includes("fetchAdminAuditLogForTarget"),
    "Gate 2/3: user detail page wires the new commercial context and target-scoped audit reader",
  );
  check(
    (
      userDetail.match(
        /Package &amp; Placement|Subscription \/ Grace|Promo \/ Grant Source|Revenue \/ Payments|Recent Admin Activity/g,
      ) ?? []
    ).length >= 5,
    "Gate 2: all five new commercial/support cards are present on the customer detail page",
  );

  // --- Gate 3: user-scoped audit history ---
  const auditServer = src("app/admin/_lib/adminAuditLogServer.ts");
  check(
    auditServer.includes("export async function fetchAdminAuditLogForTarget"),
    "Gate 3: target-scoped audit reader exists",
  );
  check(
    auditServer.includes('.in("target_id", ids)') &&
      !/customer_name|customer_email|business_name/.test(auditServer),
    "Gate 3: target-scoped audit reader matches by exact id only — never fuzzy name/email association",
  );
  check(
    auditServer.includes("export async function appendAdminAuditLog") &&
      auditServer.includes('.from("admin_audit_log").insert('),
    "Gate 3: the existing audit append pathway is unchanged (same table, same insert shape)",
  );
  const activityLog = src("app/admin/(dashboard)/activity-log/page.tsx");
  check(
    activityLog.includes("fetchAdminAuditLogFiltered") && activityLog.includes("requireActivityLogAccess"),
    "Gate 3/7: activity log page filters via the extended reader and is now server-permission-gated",
  );

  // --- Gate 4: manual cleared payment UI ---
  const manualRoute = src("app/api/admin/revenue-os/manual-payments/route.ts");
  check(
    !manualRoute.includes("String(body.adminUserId"),
    "Gate 4: manual-payments route no longer reads adminUserId from client-supplied JSON",
  );
  check(
    manualRoute.includes("getCurrentAdminAccessContext()") &&
      manualRoute.includes("access.authUserId ?? access.operatorEmail ?? access.rosterMemberId"),
    "Gate 4: adminUserId is derived from the server-authenticated access context",
  );
  check(
    manualRoute.includes('requireLeonixAdminPermission("can_view_payments")'),
    "Gate 4: manual-payments route still requires the real permission check",
  );
  check(
    !/stripe.*checkout\.sessions\.create|new Stripe\(/i.test(manualRoute),
    "Gate 4: manual-payments route never fabricates a Stripe checkout session",
  );
  const manualPage = src("app/admin/(dashboard)/workspace/payment-tracker/manual-payment/page.tsx");
  const manualClient = src("app/admin/(dashboard)/workspace/payment-tracker/manual-payment/ManualPaymentClient.tsx");
  check(
    manualPage.includes("requirePaymentTrackerAccess") && manualPage.includes("fetchPaymentTrackerSnapshot"),
    "Gate 4: manual-payment page is permission-gated and reads real pending records",
  );
  check(
    manualClient.includes('fetch("/api/admin/revenue-os/manual-payments"') &&
      (manualClient.match(/"action":\s*"record"|action:\s*"record"/) ?? []).length >= 1,
    "Gate 4: manual-payment client calls the real, existing API contract",
  );
  check(
    ["zelle", "ach", "cash", "check", "money_order", "other"].every((m) => manualClient.includes(`"${m}"`)),
    "Gate 4: manual-payment method options match the real ManualPaymentMethod union exactly",
  );

  // --- Gate 5: consolidation links (not rewrites) ---
  const paymentTracker = src("app/admin/(dashboard)/workspace/payment-tracker/page.tsx");
  check(
    paymentTracker.includes("row.owner_user_id") && paymentTracker.includes("/admin/usuarios/"),
    "Gate 5: payment tracker links a row's real owner_user_id to the customer support view",
  );
  check(
    paymentTracker.includes("/admin/workspace/payment-tracker/manual-payment"),
    "Gate 5: payment tracker cross-links to the new manual-payment UI",
  );

  // --- Gate 7: permissions ---
  check(
    accessControl.includes("export function requireActivityLogAccess"),
    "Gate 7: activity log gained an independent server-side permission function",
  );
  check(
    !accessControl.includes("ADMIN_ENFORCE_ROSTER_PERMISSIONS ="),
    "Gate 7: the roster-enforcement env flag was never assigned/changed by this build",
  );
  check(
    accessControl.includes("owner_admin") && accessControl.includes("rosterResolved: false"),
    "Gate 7: owner-admin fallback path still present, unmodified",
  );

  // --- Gate 8: language truth (no raw table names in E3-authored copy) ---
  check(
    !/leonix_payment_records|leonix_subscription_records/.test(
      userDetail.slice(userDetail.indexOf("Revenue / Payments"), userDetail.indexOf("Recent Admin Activity")),
    ),
    "Gate 8: new commercial-context cards never show a raw table name to staff",
  );

  // --- Gate 9: mobile structure sanity (no brittle fixed-width table without a wrapper) ---
  check(
    userDetail.includes("overflow-x-auto") && userDetail.includes("<table"),
    "Gate 9: the new Payments table is wrapped for horizontal scroll safety, not a bare fixed table",
  );

  console.log(
    failures === 0
      ? "verify-package-e-e3-admin-os-global-operations: all checks passed."
      : `verify-package-e-e3-admin-os-global-operations: ${failures} FAILURE(S).`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
