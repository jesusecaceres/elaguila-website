# Sales Business Workspace — Data Contract (Gate BCO-4A / Gate B / Gate B.1)

Every new field this package introduces. Fields already documented in
[`business-identity-data-dictionary-01.md`](./business-identity-data-dictionary-01.md) (the
Business Identity tables this workspace *reads*) are not repeated here — this doc covers the four
tables added by this package: `business_sales_profiles`, `business_sales_notes`,
`business_follow_ups`, `business_sales_audit_log`.

**Rules this package follows (non-negotiable):**

- Private business information is never sold and never shared with advertisers.
- Internal notes and follow-ups are never shown to the business owner in this package.
- Sensitive owner information (contact values, addresses) is shown only to staff whose resolved
  role carries the `view_private_contacts` capability — never a public surface, and never merely
  hidden in the UI: `getBusinessWorkspaceDetail()` redacts contact values server-side before the
  page ever renders them (`app/admin/_lib/businessWorkspaceData.ts`).
- AI does not receive internal notes by default; nothing here wires an AI system to any of these
  tables. The "possible next helpful action" panel is a **deterministic** function of confirmed
  profile data (`app/admin/_lib/salesWorkspaceLogic.ts`), not a model call.
- Notes are staff observations, never converted into confirmed Business Identity facts — nothing
  in this package writes back to `businesses`, `business_contacts`, or any other Identity table.
- Owner statements (the Identity record) and staff notes (this package) are kept in physically
  separate tables so they can never be silently conflated.
- A "confirmed fact" always means Identity-table data the owner entered; a "note" always means a
  staff observation. The UI never labels the second as the first.
- **Every actor column below is a required foreign key into `admin_team_members(id)`, never a
  free-text email and never a placeholder.** There is no "unattributed" actor anywhere in this
  schema — see the authorization section below.

## Authorization model (Gate B.1 — supersedes the Gate B inherited-gap note)

Every page and API route in this package calls `requireSalesWorkspaceAccess()`
(`app/admin/_lib/businessWorkspaceAccess.ts`) independently — never trusting the dashboard layout's
cookie check alone. That function denies closed in every one of these cases, in order, and never
falls back to an inferred `owner_admin` or a placeholder identity:

1. No `leonix_admin` cookie at all → `no_admin_cookie`.
2. The shared bootstrap password was used (no per-person identity) → `bootstrap_session_not_allowed`.
3. A per-person cookie exists but the operator-email/auth-user-id pair is missing or incomplete →
   `no_operator_identity`.
4. The operator email does not match an `admin_team_members` row → `roster_not_found`.
5. The matching roster row has `is_active = false` → `roster_inactive`.
6. The roster row's `role` is not one of the three Sales Workspace roles → `role_not_permitted`.

Only `super_admin`, `sales_manager`, and `sales_rep` (the roles defined in
`app/admin/_lib/salesWorkspaceCapabilities.ts`) can reach this package at all — every other
existing roster role (`billing_support`, `content_manager`, `ads_moderator`, `magazine_editor`,
`read_only`) is denied outright, not merely missing capabilities. Within those three roles, a
server-side capability matrix (`ROLE_CAPABILITIES` in the same file) governs each individual
read/write operation; `sales_rep` never receives `archive_sales_record` or
`manage_staff_assignments`.

A successful check returns a `StrictSalesActor`: `rosterId`, `authUserId`, `email`, `role`,
`displayName`, and the resolved `capabilities` set. Every write function in
`businessWorkspaceData.ts` requires this actor object — there is no code path that accepts a bare
email string or writes without it.

## `business_sales_profiles` (one row per business)

| Field | Purpose | Required | Source | Sensitivity | Owner visibility | Capability required | Editable | Retention | AI-use | Advertiser access |
|---|---|---|---|---|---|---|---|---|---|---|
| `status` | Sales-workspace pipeline status (New/Needs review/.../Archived) | Required (defaults `new`) | Staff, via status dropdown | BUSINESS_INTERNAL | Never shown to owner | `update_sales_status` (`archived` also requires `archive_sales_record`) | Yes | Current value only | NEVER_AI | No |
| `last_contacted_at` | Last time staff marked the business as contacted | Optional, system-set on "contacted" | Staff action (quick action / status change) | BUSINESS_INTERNAL | Never shown to owner | Same as above | System-set | Current value only | NEVER_AI | No |
| `created_by_roster_id` / `updated_by_roster_id` | Real actor attribution — FK into `admin_team_members(id)`, NOT NULL, no default | Required | `StrictSalesActor.rosterId` at write time | OWNER_PRIVATE (staff identity, not business owner) | Never shown to owner | n/a (system) | No | Current value only | NEVER_AI | No |
| `created_by_auth_user_id` / `updated_by_auth_user_id`, `created_by_email` / `updated_by_email`, `created_by_role` / `updated_by_role` | Denormalized actor detail for fast display without an extra join; the roster FK above is the actual guarantee | Required | `StrictSalesActor` | OWNER_PRIVATE (staff identity) | Never shown to owner | n/a (system) | No | Current value only | NEVER_AI | No |

## `business_sales_notes`

| Field | Purpose | Required | Source | Sensitivity | Owner visibility | Capability required | Editable | Retention | AI-use | Advertiser access |
|---|---|---|---|---|---|---|---|---|---|---|
| `note_type` | Controlled category (call attempt, conversation, concern, opportunity, etc.) | Required | Staff dropdown | BUSINESS_INTERNAL | **Never shown to owner** | `create_internal_note` to write; `view_all_staff_notes` to read | No (notes are append-only in this package) | Current value only, no version history | OWNER_APPROVED_AI only (never bulk-loaded by default) | No |
| `body` | The note text itself — a staff observation, never a confirmed fact | Required, 1–4000 chars | Staff textarea | BUSINESS_INTERNAL | **Never shown to owner** | Same as above | No | Current value only | OWNER_APPROVED_AI only | No |
| `visibility` | `internal` (default) or `private` — reserved for a future finer-grained staff-role split; both values are already staff-only in this package | Required (defaults `internal`) | Staff | BUSINESS_INTERNAL | Never shown to owner | Same as above | No | Current value only | NEVER_AI (control field) | No |
| `contact_method`, `outcome` | Structured metadata about the contact attempt this note documents | Optional | Staff dropdowns | BUSINESS_INTERNAL | Never shown to owner | Same as above | No | Current value only | OWNER_APPROVED_AI only | No |
| `follow_up_date` | Optional date this note flags for follow-up (distinct from the `business_follow_ups` system — a note can flag a date without creating a formal follow-up) | Optional | Staff | BUSINESS_INTERNAL | Never shown to owner | Same as above | No | Current value only | NEVER_AI | No |
| `author_roster_id`, `author_auth_user_id`, `author_email`, `author_role` | Required actor attribution on every note — all four are NOT NULL, `author_roster_id` is a FK into `admin_team_members(id)` | Required | `StrictSalesActor`, resolved server-side, never client-supplied | OWNER_PRIVATE (staff identity) | Never shown to owner | n/a (system) | No | Current value only | NEVER_AI | No |

## `business_follow_ups`

| Field | Purpose | Required | Source | Sensitivity | Owner visibility | Capability required | Editable | Retention | AI-use | Advertiser access |
|---|---|---|---|---|---|---|---|---|---|---|
| `scheduled_date`, `scheduled_time` | When the next contact is planned | `scheduled_date` required, time optional | Staff date/time picker | BUSINESS_INTERNAL | Never shown to owner | `create_follow_up` | Yes (replacing the current follow-up cancels the old one and creates a new one — see `upsertCurrentFollowUp`) | Current value only | NEVER_AI | No |
| `contact_method` | Planned contact channel | Optional | Staff dropdown | BUSINESS_INTERNAL | Never shown to owner | Same as above | Yes | Current value only | NEVER_AI | No |
| `purpose` | Why this follow-up exists, in the staff member's own words | Required, 1–500 chars | Staff | BUSINESS_INTERNAL | Never shown to owner | Same as above | Yes | Current value only | OWNER_APPROVED_AI only | No |
| `status` | Scheduled / Due today / Overdue / Completed / Cancelled / Waiting on owner. `due_today`/`overdue` are **derived at read time** from `scheduled_date`, never written directly by staff | Required (defaults `scheduled`) | Staff quick actions; `due_today`/`overdue` computed by `deriveFollowUpDisplayStatus()` | BUSINESS_INTERNAL | Never shown to owner | Same as above | Yes (via quick actions only — no free-text status edit) | Current value only | NEVER_AI | No |
| `outcome` | Free-text result recorded on completion | Optional, ≤1000 chars | Staff, on "Mark contacted / complete" | BUSINESS_INTERNAL | Never shown to owner | Same as above | No (set once at completion) | Current value only | OWNER_APPROVED_AI only | No |
| `assigned_roster_id` | Which staff member owns this follow-up (defaults to whoever created it — there is no safe per-business staff-assignment model in this repo yet, see below). FK into `admin_team_members(id)`, nullable. | Optional | Staff, defaults to actor's `rosterId` | OWNER_PRIVATE (staff identity) | Never shown to owner | n/a — **soft hint only, not an access-control boundary** | Yes | Current value only | NEVER_AI | No |
| `created_by_roster_id`, `created_by_auth_user_id`, `created_by_email`, `created_by_role` | Required actor attribution | Required | `StrictSalesActor`, resolved server-side | OWNER_PRIVATE (staff identity) | Never shown to owner | n/a (system) | No | Current value only | NEVER_AI | No |

**Enforcement note:** at most one *current* (non-terminal) follow-up exists per business — enforced
by a partial unique index (`business_follow_ups_one_current_per_business`) at the database level,
not just application code, so a race between two staff members can't silently create two active
follow-ups.

## `business_sales_audit_log` (Gate B.1 — new)

A dedicated, attributable audit trail for every Sales Workspace mutation. Created instead of
reusing the legacy `admin_audit_log` table because that table has no actor column at all (confirmed
during the Gate B.1 security review) — this package must never lose attribution the way that table
structurally cannot keep it.

| Field | Purpose | Required | Source | Sensitivity | Owner visibility | AI-use |
|---|---|---|---|---|---|---|
| `action` | One of `note_created`, `note_updated`, `follow_up_created`, `follow_up_completed`, `follow_up_cancelled`, `follow_up_waiting_on_owner`, `sales_status_changed`, `archived` | Required, CHECK-bounded | Written by `businessWorkspaceData.ts` after every mutation | BUSINESS_INTERNAL | Never shown to owner | NEVER_AI |
| `business_id`, `record_type`, `record_id` | What the audited action touched | `business_id`/`record_type` required, `record_id` nullable (status changes have no single record) | System | BUSINESS_INTERNAL | Never shown to owner | NEVER_AI |
| `actor_roster_id`, `actor_auth_user_id`, `actor_email`, `actor_role` | Who performed the action — same actor-attribution shape as every other table in this package | Required | `StrictSalesActor` | OWNER_PRIVATE (staff identity) | Never shown to owner | NEVER_AI |
| `metadata` | Safe, bounded context (e.g. `{"from_status":"new","to_status":"contacted"}`) | Defaults `{}` | System | BUSINESS_INTERNAL | Never shown to owner | NEVER_AI — **never contains a raw note body or any secret value** |

## Explicitly out of scope for this package

- **Per-business staff assignment as an access boundary.** The Gate B security review found no
  existing safe assignment model in this repo (no `assigned_to`/`owner_staff_id` precedent on any
  table). Every staff role permitted into this package can see and act on every business — there is
  no per-record scoping yet. `assigned_roster_id` on `business_follow_ups` is a soft "who owns
  this" hint only, not an access-control boundary. `manage_staff_assignments` is defined in the
  capability matrix but granted to no role today, ready for the moment a safe assignment feature is
  built.
- **Email/SMS automation.** Follow-ups and notes are recorded manually; nothing in this package
  sends a message on the business owner's behalf.
- **AI-generated recommendations.** The "possible next helpful action" panel is 100% deterministic
  rule logic over confirmed profile fields — see the pure functions in
  `app/admin/_lib/salesWorkspaceLogic.ts`. No model call, no inferred need beyond "ask the owner to
  confirm."

## Gate B inherited-gap note — resolved by Gate B.1

Gate B originally inherited `getCurrentAdminAccessContext()`'s fail-open behavior (full
`owner_admin` when no roster row exists) and recorded an `"unattributed@leonix-admin"` placeholder
when no roster identity was available. Gate B.1 replaces this entirely for this package: the legacy
resolver is not used anywhere in `businessWorkspaceAccess.ts`, there is no placeholder actor string
anywhere in this package's code or schema, and every actor column is a required, currently-active
`admin_team_members` foreign key enforced at the database level. This fix is scoped to
`/admin/businesses/**` only — the legacy admin surface elsewhere in `app/admin/**` is unchanged.
