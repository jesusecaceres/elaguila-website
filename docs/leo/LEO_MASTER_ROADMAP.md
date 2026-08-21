# LEO Master Roadmap

Canonical roadmap for the Leonix Executive Operator.

This document tracks completed foundations and the dependency-first path forward.

Branch context: `integration/leo-executive-operating-intelligence-2026-08`

---

## Completed

### LEO-13 — Google Read Intelligence

Bounded Gmail and Calendar read intelligence.

- inbox / calendar observation
- communication intelligence surfaces
- no provider writes

### LEO-14.x — Conversation, Persistence, Voice, Hands-Free

Executive Action OS foundations:

- persistent conversation
- commitments and receipts
- attention runtime
- voice and hands-free with safety locks
- Morning Brief

### LEO-15 — Business Concierge Bridge

Read-only Concierge context bridge.

- LEO may read bounded Concierge context
- Concierge remains a separate system
- no Concierge execution ownership by LEO

### LEO-16 — Reports and Watches

Scheduled watches and owner alerts, plus company-wide executive reporting integration.

- LEO-16 watches / notifications
- EXEC-REPORTS-01 global reporting fabric
- EXEC-REPORTS-02 whole-company watch integration

### LEO-17A — Governed Connected Action Persistence Foundation

Durable proposal + approval + execution-claim contract.

- RED governed action families
- deterministic proposal fingerprint
- atomic execution claim
- receipt linkage
- no provider writes

### LEO-17B.0 — Intelligence Operating System Foundation

Permanent LEO operating documentation:

- `LEO_INTELLIGENCE_OPERATING_SYSTEM.md`
- `LEO_MASTER_ROADMAP.md`

No application code changes.

### LEO-17B — Conversation → Governed Proposal Wiring

Implemented: conversation / referent / preparation → durable proposal candidates.

- owner approval remains explicit (API)
- conversation POST does not approve
- no provider writes

### LEO-18 — Entity / Executive Context Safety

Foundation completed for proposal-safe entity resolution and executive context packaging.

### LEO-19 — Intelligence Router / Provider Workers

Orchestration foundation completed (19A–19E). Models are workers. CAPABILITY ≠ AUTHORITY. Selection ≠ execution.

### LEO-20 — Self-Intelligence V1

Closed: interpret-only self-intelligence profile, cockpit, discovery/SEO + buyer-engagement sensors. No connected-action execution from Self-Intelligence.

---

## Future Roadmap

## LEO-21 — Governed Connected Actions

**Goal:** Approved integrations under governance.

Possible connected systems:

- GitHub
- Vercel
- Supabase
- Business systems
- Google communications / calendar (proposal families already exist)

Always:

- explicit owner approval for RED
- execution claim / idempotency
- durable receipt
- read-back verification when required
- CAPABILITY ≠ AUTHORITY

### LEO-21A — Provider-Neutral Governed Execution Runtime

Execution contract, stable failure model, provider adapter interface, null/blocked adapter, orchestrator (claim before execute). Gmail/Calendar remain read-only. No OAuth write scopes. No live provider writes.

### LEO-21B — Owner Governed Action Approval Cockpit

Owner cockpit on `/admin/leo` for inspect / approve / cancel of canonical `leo_action_proposals`.

- fingerprint-bound approval with explicit confirmation
- approval ≠ execution
- no Execute / Send / Schedule controls
- provider writes remain disabled

### LEO-21C — Gmail Reply Adapter (Write-Disabled / Scope-Aware)

Gmail Reply provider adapter wired for `GMAIL_REPLY` only (historical gate).

- `gmail.send` declared as future required write scope
- current OAuth grant expectation remains `gmail.readonly` + `calendar.readonly`
- LEO-21C shipped fail-closed before send; LEO-21D supersedes with live-capable code behind two-key authority OFF

### LEO-21D — Gmail Reply Live-Capable Adapter (Feature Flag OFF)

Provider code is **live-capable** but **authority remains OFF**.

- Env switch `LEO_GMAIL_REPLY_WRITE_ENABLED` — only explicit `true` enables; default / missing → false
- Two-key activation: write flag **and** proven live `gmail.send` (tokeninfo)
- MIME plain-text builder + `messages.send` transport + pre-send thread revalidation
- Full `format=full` text/plain body verification before `VERIFIED`
- `PROVIDER_ACCEPTED` ≠ `VERIFIED`; timeout after dispatch → `UNKNOWN_EXTERNAL_OUTCOME` (no blind resend)
- Execute API deferred in 21D; superseded by LEO-21E.1 surface (still authority OFF)

### LEO-21E.1 — Owner Execute Surface (Authority Still OFF)

- `POST /api/leo/action/proposal/[proposalId]/execute` — `{ expectedFingerprint }` only → orchestrator
- Governed Actions Execute + RED confirmation ("Send this exact approved reply")
- Capability read model: `writeFlagEnabled` ∧ `gmailSendScopeProven` ⇒ `gmailReplyExecutionAvailable`
- OAuth helper prepared for three-scope union (not run in this gate)
- No OAuth consent, no Preview env change, no write flag ON, no live email
- Next: LEO-21E.2 RED Preview activation + one controlled test

---

## LEO-22+ — Innovation Radar

**Goal:** Continuous discovery of:

- technology
- market changes
- community needs
- new opportunities

Innovation radar informs the executive hats.

It does not bypass governance.

---

## Sequencing Doctrine

1. Observe before act
2. Prepare before approve
3. Approve before claim
4. Claim before provider side effect
5. Verify before declare success
6. Remember what mattered

Each gate must preserve:

- owner judgment
- truthfulness
- no fake completion
- no accidental provider writes

---

## Current Next Gate

**Active family:** LEO-21 — Governed Connected Actions

**Current gate:** LEO-21E.1 — Owner Execute surface (authority OFF)

Next: LEO-21E.2 RED Preview OAuth + token replace + write flag ON + one controlled live reply + flag OFF.

Prerequisite satisfied: LEO-17–21D foundations; Execute API/UI code present; OAuth helper union prepared; write authority still OFF.

CAPABILITY ≠ AUTHORITY — Execute surface does not grant write authority.
