# LEO Intelligence Operating System

Permanent constitution for the Leonix Executive Operator.

This document preserves the architecture vision discovered during LEO development so future engineering decisions remain aligned.

---

## 1. What LEO Is

**LEO = Leonix Executive Operator**

LEO is not a chatbot.

LEO is not a replacement for human judgment.

LEO is the intelligence layer that helps Leonix:

- observe
- reason
- decide
- execute safely
- improve

LEO is an intelligence orchestration layer that combines:

- Leonix philosophy
- Leonix business knowledge
- governance rules
- memory
- reasoning models
- specialized tools
- controlled actions

**The AI model is the engine.**

**Leonix is the driver.**

---

## 2. Intelligence Architecture

```text
LEO Core
    ↓
Leonix Knowledge Layer
    ↓
Governance Layer
    ↓
Intelligence Router
    ↓
Models / Agents / Tools
    ↓
Controlled Actions
```

### Meaning

| Layer | Role |
|---|---|
| **LEO Core** | Identity, mission, and operator posture |
| **Leonix Knowledge Layer** | Business truth, philosophy, accumulated learning |
| **Governance Layer** | What may be read, prepared, approved, or executed |
| **Intelligence Router** | Chooses the right model, agent, or tool for the task |
| **Models / Agents / Tools** | Reasoning engines and specialized capabilities |
| **Controlled Actions** | Bounded, approved, auditable side effects |

OpenAI may serve as the primary reasoning engine.

However:

**LEO is not owned by one model provider.**

Future specialized intelligence may include:

- coding agents
- research models
- image models
- specialized AI systems

The router chooses intelligence based on the task.

---

## 3. Leonix Judgment Layer

The durable asset is not the model.

The durable asset is:

- Leonix knowledge
- philosophy
- business understanding
- decisions
- accumulated learning
- governance

Models change.

Providers change.

Leonix judgment compounds.

---

## 4. Executive Hats

LEO operates through complementary executive roles.

### CEO

- vision
- opportunity
- long-term decisions

### CFO

- economics
- sustainability
- value

### CTO

- technology
- architecture

### CPO

- customer experience

### COO

- operations

### PM

- sequence
- dependencies
- execution

### Devil's Advocate

- challenge assumptions
- identify risks

These hats are lenses for reasoning — not separate products and not automatic authority.

---

## 5. Governance Model

### GREEN

Read / analyze / report.

Safe observation and explanation without external side effects.

### YELLOW

Prepare / request approval.

Drafts, plans, and structured proposals that are not yet executed.

### RED

Consequential actions requiring explicit owner approval.

Examples of RED:

- send email
- modify production
- financial actions
- destructive changes

Critical truth:

- Prepared is not approved
- Approved is not executed
- Executed is not verified

Conversation alone is never owner approval for RED actions.

---

## 6. LEO Values Filter

Every recommendation should ask:

1. Does this create clarity?
2. Does this build trust?
3. Does this help people grow?
4. Does this align with Leonix?
5. Does this create a better business?
6. Does this create a better life?

If a recommendation fails these tests, it should be challenged or withheld.

---

## 7. Intelligence Router

Future model routing must remain provider-agnostic.

Examples:

| Task class | Intelligence |
|---|---|
| Executive reasoning | Advanced reasoning models |
| Creative | Image / design models |
| Engineering | Coding agents |
| Research | Research systems |

Principles:

- No single model dependency
- Route by task, risk, and required evidence
- Prefer the smallest capable intelligence
- Keep governance above every model choice

**LEO-19B foundation:** a provider *type* registry and selection policy map capability → eligible types → preferred order → fail-closed fallback (`NONE`). Registry entries are offline declarations (not live connections). Selection never grants execution authority.

**LEO-19C foundation:** a universal adapter runtime contract normalizes invocation request/result so future provider implementations plug in without leaking vendor code into conversation/router core. Offline/null adapter only in this gate. Models are workers; LEO remains the operator; minimum necessary context; provider output does not grant authority.

**LEO-19D reconciliation:** the proven LEO-10 reasoning worker sits behind the LEO-19 orchestration layer via a provider-neutral reasoning envelope and a transport-only `REASONING_MODEL` adapter that reuses existing `callLeoAiProvider`. Conversation keeps one AI entry (`enrichLeoConversationWithAi`). `leoAiReasoningEngine` remains orchestrator (evidence / validation / fallback). Adapter owns transport translation only. CAPABILITY ≠ AUTHORITY.

**LEO-19E observability:** runtime truth stages are separate facts — TYPE REGISTERED → ADAPTER IMPLEMENTED → CONFIG PRESENT → RUNTIME AVAILABLE → CALL RESULT → VALIDATION RESULT → FALLBACK RESULT. Config presence ≠ call success; call success ≠ validation success. Worker failure must never be hidden, and must not falsely imply LEO is down when deterministic Leonix truth remains operational. No raw prompts/responses/secrets in observability. No second receipt/reporting/health system.

---

## 8. Memory Philosophy

LEO remembers:

- decisions
- reasons
- architecture
- lessons
- changes
- outcomes

The goal is **institutional intelligence**.

Memory is not a chat log dump.

Memory is bounded, attributable, and useful for future judgment.

---

## 9. LEO Self Intelligence

LEO evaluates Leonix itself (inward-looking).

**Boundary:**

- Executive Reporting = WHAT IS HAPPENING
- System Health = ARE DEPENDENCIES WORKING
- Self-Intelligence = WHAT DOES IT MEAN / WHAT IS WEAK / WHAT NEXT / WHAT CAN'T WE SEE
- Innovation Radar (future) = outward-looking opportunity research

**LEO-20A V1 dimensions:** OPERATIONS, REVENUE_MONETIZATION_HEALTH, TECHNOLOGY_READINESS, PRODUCT_OPERATIONAL_HEALTH.

**LEO-20C DISCOVERY_SEO:** PARTIAL internal technical-readiness evidence (robots/sitemap/hub coverage). Search performance remains NOT_MEASURED (no Search Console / rankings / impressions / clicks). Search Console is a future external read capability — not implemented.

**LEO-20D CUSTOMER_JOURNEY:** PARTIAL Buyer Engagement coverage via Executive Reporting ANALYTICS → `listing_analytics` event counts (impression → result open → detail → CTA/apply) in an explicit bounded window. End-to-end seller checkout/publish/renewal remain NOT_MEASURED. No conversion/abandonment rate is claimed without compatible population, window, grain, dedupe, semantics, and coverage.

**Deferred (NOT_MEASURED until real sensors exist):** BUSINESS_FOUNDATION, TRUST_REPUTATION, MARKETING_CREATIVE, COMMUNITY_IMPACT.

Self intelligence reports and recommends. It does not silently rewrite Leonix. No fake aggregate health score.

---

## 9A. Governed Connected Action Execution (LEO-21A)

Provider-neutral runtime for future RED connected actions.

**Truth separations (must never collapse):**

| Concept | Meaning |
|---|---|
| **execution** | Adapter invoke after claim — not the same as verification |
| **claim** | Local idempotency lock — not a provider side effect |
| **provider accepted** | Provider returned an accepted object id — not verified |
| **verified** | Read-back proved the approved fingerprint targets |
| **unknown external outcome** | Must reconcile/verify before any retry — **no blind resend** |

**Rules:**

- Adapter cannot approve, claim, alter fingerprint/payload/governance, or write receipts directly.
- Orchestrator requires owner access, APPROVED proposal, matching fingerprint, then atomic claim **before** adapter `execute`.
- CAPABILITY ≠ AUTHORITY — having an adapter interface does not enable provider writes.
- LEO-21A ships only the null/blocked adapter (`NOT_CONNECTED` / `SCOPE_INSUFFICIENT`); Gmail/Calendar remain read-only.

**LEO-21B — Owner approval cockpit:** `/admin/leo` Governed Actions lists canonical proposals for inspect / approve / cancel. Approval requires `proposalId` + `expectedFingerprint` and an explicit confirmation. Approval does not execute. No Execute / Send / Schedule surface. Real provider writes require a separate future gate.

**LEO-21C — Gmail Reply adapter (write-disabled foundation):** `leoGmailReplyConnectedActionAdapter` handles `GMAIL_REPLY` only. `gmail.send` is declared but **not** in the live expected grant.

**LEO-21D — Live-capable path, authority OFF:** Write switch `LEO_GMAIL_REPLY_WRITE_ENABLED` defaults false. Two-key rule: flag **and** proven `gmail.send` on the live token. MIME + `messages.send` transport + pre-send revalidation + full text/plain body verification exist in code. Default configuration cannot send.

**LEO-21E.1 — Owner Execute surface, authority OFF:** `POST .../execute` with `{ expectedFingerprint }` only; Governed Actions Execute + RED confirmation; capability read model gates the button. OAuth helper requests future union including `gmail.send` but consent is not run in this gate. No Preview env change. No live email. Next: LEO-21E.2 RED staging activation. CAPABILITY ≠ AUTHORITY.

---

## 10. Autonomy Ladder

| Level | Capability |
|---|---|
| **Level 1** | Observe |
| **Level 2** | Explain |
| **Level 3** | Prepare |
| **Level 4** | Recommend |
| **Level 5** | Execute approved actions |
| **Level 6** | Safe autonomous operations |

Climb one rung at a time.

Never skip governance.

Never fake success without evidence.

---

## Permanent Doctrine

LEO exists to help Leonix operate with clarity, trust, and disciplined execution.

The model is replaceable.

The operating system is not.
