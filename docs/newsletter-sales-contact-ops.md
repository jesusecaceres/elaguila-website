# Newsletter Sales Contact Ops

Sales and admin handoff for Leonix newsletter subscribers while manual outreach is the launch workflow. True bulk campaign sending inside Leonix is **future scope**.

---

## 1. Current built tools

| Tool | Where | Notes |
|------|-------|-------|
| Newsletter signup | Public site → `POST /api/newsletter/subscribe` | Saves subscriber; may generate/reuse Launch 25 code |
| Launch 25 promo email | Resend (when configured) | One-time subscriber email with code |
| Admin subscriber inbox | `/admin/leads/newsletter` | Search, filters, Active/Archived tabs |
| Promo-code admin verification | `/admin/workspace/promo-codes?code_type=newsletter` | Delivery status on promo record |
| Export full CSV | Inbox → **Export full CSV** | Source, language, city, interests, consent, status |
| Export emails CSV | Inbox → **Export emails CSV** | Email + name; subscribed only |
| Copy visible emails | Inbox button | Filtered subscribed emails, comma-separated |
| Copy emails for BCC | Inbox button | Same list, formatted for one Gmail BCC field |
| Copy BCC chunks | Inbox button | ~50 emails per chunk for long lists |
| Manual mailto / Reply | Row actions + drawer | Opens local email client; individual outreach |
| Archive / restore / delete | Row actions + drawer | Soft lifecycle on subscriber records |

---

## 2. Google Sheets workflow

1. Open **Admin → Leads → Newsletter** (`/admin/leads/newsletter`).
2. Apply filters (status, language, source) if needed.
3. Click **Export emails CSV** (simple list) or **Export full CSV** (all fields).
4. Upload the downloaded CSV to **Google Drive**.
5. Right-click the file → **Open with → Google Sheets**.
6. Use Sheets filters/sorts on status, source, language, or interests for working lists.
7. **Do not** edit or delete live admin records from Sheets — Sheets is only a **working copy** for outreach planning.

**No Excel required.** The CSV opens cleanly in Google Sheets.

---

## 3. Gmail / manual outreach workflow

1. Filter subscribers in the admin inbox (e.g. status = subscribed, preferred language = es).
2. Use one of:
   - **Copy visible emails** — quick comma list
   - **Copy emails for BCC** — paste into a single Gmail BCC field
   - **Copy BCC chunks** — when the list is long; paste one chunk at a time into BCC
3. Compose in **Gmail** (or approved Leonix Google account).
4. Paste addresses into **BCC**, not **To** (protects subscriber privacy).
5. Write a clear subject and body; use row **Reply/Email** for individual mailto templates when needed.
6. Do **not** promise print magazine, print+digital combo, or manual contract eligibility — Launch 25 is for eligible **website checkout** products only.

---

## 4. Promo verification workflow

1. Open **View newsletter promo codes** in the inbox banner, or go to  
   `/admin/workspace/promo-codes?code_type=newsletter`.
2. Search by subscriber email or promo code.
3. Check **delivery status** on the promo record (`metadata.email_send_status`):
   - **sent** — subscriber promo email delivered via Resend
   - **failed** — send failed; resend manually or follow team policy
   - **not_configured** — Resend/env not set up
   - **pending** — in progress or not yet attempted
4. If status is failed or not_configured, use manual mailto outreach or contact the subscriber per team policy.

---

## 5. What is NOT built yet

- No true server-side **weekly bulk campaign sender** inside Leonix admin (no server-side weekly bulk campaign sender)
- No **unsubscribe** preference center
- No **email event log** (open / click / bounce tracking)
- No **campaign composer** (subject/body/schedule in admin)
- No **automatic Google Sheets sync**

Manual export, copy, and mailto are the correct launch workflow until those gates ship.

---

## 6. Future gates

- Google Sheets direct sync
- Gmail / Google Contacts integration
- Bulk campaign composer
- Unsubscribe / preference center
- Email event logging (sent / delivered / opened / clicked / bounced)

---

## Related docs

- `docs/newsletter-operations-readiness.md` — technical ops readiness audit
- `docs/newsletter-promo-code-readiness.md` — Launch 25 promo generation + checkout redemption
- `docs/leonix-admin-command-center-master-audit.md` — admin command center overview

---

## Verifier

```bash
npm run verify:newsletter-sales-contact-ops
```
