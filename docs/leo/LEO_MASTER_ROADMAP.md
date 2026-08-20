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

---

## Future Roadmap

## LEO-17B — Conversation → Governed Proposal Wiring

**Goal:** Connect natural conversation to safe action proposals.

- conversation / referent / preparation → durable proposal candidates
- owner approval remains explicit
- no provider writes in this gate

---

## LEO-18 — LEO Memory Intelligence

**Goal:** Executive memory.

- decisions
- lessons
- architecture history
- outcomes that compound institutional intelligence

---

## LEO-19 — LEO Tool Intelligence Router

**Goal:** Route tasks to the right intelligence capability, then select a provider *type* by policy.

- LEO-19A: capability classification (executive / engineering / creative / research / data / unknown)
- LEO-19B: provider registry + selection policy (provider types only; offline; no live invocation)
- LEO-19C: provider adapter runtime contract (normalized invoke/result seam; offline/null adapter only)

Chain: Router → Registry → Selection Policy → Adapter Runtime → future provider implementations.

Models are workers. LEO remains the operator. Provider output does not grant authority. Minimum necessary context. CAPABILITY ≠ AUTHORITY. Selection ≠ execution.

---

## LEO-20 — LEO Self Intelligence

**Goal:** Leonix evaluates itself.

- SEO
- UX
- operations
- products
- growth

Report and recommend. Do not silently mutate.

---

## LEO-21 — LEO Connected Actions

**Goal:** Approved integrations under governance.

Possible connected systems:

- GitHub
- Vercel
- Supabase
- Business systems

Always:

- explicit owner approval for RED
- execution claim / idempotency
- durable receipt
- read-back verification when required

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

**Next executable build:** LEO-17B — Conversation → Governed Proposal Wiring

Prerequisite satisfied: LEO-17A persistence / approval / claim foundation.
