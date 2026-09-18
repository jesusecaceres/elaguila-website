# Learning Center — Content Batch I-1 · STAGING apply runbook

**Status:** PREPARED, NOT EXECUTED. Nothing in this document has been run. No database has been contacted.
**Scope:** STAGING ONLY. This runbook ends before production. Production needs its own Coach-approved gate.
**Seed:** `supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql`
**Generator:** `scripts/generate-learning-content-seed-i1.ts` · **Ledger:** `docs/learning-center-seed-i1-accent-ledger.md`

> ## DO NOT use a blind `supabase db push` to apply this reviewed content batch.
>
> The seed is deliberately kept **outside** `supabase/migrations/`, so `supabase db push`, `supabase migration up`
> and `supabase db reset` do not see it. Do not move it there "to make it easier". A push applies *every* pending
> migration to *whatever project the CLI happens to be linked to* — that is exactly the accident this quarantine
> prevents. The staging gate must use an **explicit, project-verified application method**: one file, one
> project whose identity was confirmed immediately before the write.

No secrets belong in this file. Never paste a database password, service-role key, access token or connection
string into a document, a commit, a chat or a terminal that is being recorded.

---

## What applying the seed does

- **Part A** — inserts exactly **3** new `published` rows into `business_learning_lessons`
  (`what_problem_do_you_solve`, `customer_conversations`, `know_your_competition`), `ON CONFLICT (lesson_key) DO NOTHING`.
  The moment these rows exist, the three lessons are **publicly visible** on that environment.
- **Part B (D3)** — 75 guarded `UPDATE`s that add Spanish accents (and one `¿`) to the TODAY-1 seed text in
  `business_learning_categories`, `business_learning_lessons`, `business_learning_resources`. Each is guarded by the
  md5 of the original value: a row someone has edited is skipped; re-running is a no-op.
- No DDL. No deletes. No English column. No other table.

## Preconditions (all must be true before step 1)

- [ ] Coach has opened an explicit **staging-seed gate**. This runbook is not self-authorizing.
- [ ] The owner has named the STAGING Supabase project (name **and** project ref). A project is not "staging"
      because its name contains the word — the owner confirms it.
- [ ] Whoever applies has their own authorized access to that project. Credentials are entered by that person,
      in their own tool; they are never shared with, typed by, or shown to an assistant.
- [ ] The TODAY-1 learning migrations (`20260807120000…foundation`, `20260807130000…privilege_hardening`) are
      already applied on staging.
- [ ] `npm run verify:business-learning-center` passes on the commit being applied.

---

## Sequence

### 1. Identify the intended STAGING project
Write down, in the gate notes: project **name**, project **ref**, region, and who confirmed it is staging.
If there is no separate staging project, **stop** — that is a decision for Coach and the owner, not something to
improvise by pointing at production.

### 2. Verify project ref / environment immediately before any write
In the tool that will run the SQL (Supabase dashboard SQL editor of that project, or a `psql` session opened
against that project's connection string):
- confirm the project ref shown in the dashboard URL / connection host matches step 1;
- run a read-only identity check and record the result:
  ```sql
  select current_database(), current_user, now();
  select count(*) as lessons, count(*) filter (where status = 'published') as published
  from public.business_learning_lessons;                       -- expected before: 16 / 8
  select lesson_key from public.business_learning_lessons
  where lesson_key in ('what_problem_do_you_solve','customer_conversations','know_your_competition'); -- expected: 0 rows
  ```
If the counts are not 16 / 8, or any of the three keys already exists, **stop and report** — the environment is not
in the state this seed was written for.

### 3. Review the seed content and fingerprint
- Regenerate and confirm nothing drifts: `npx tsx scripts/generate-learning-content-seed-i1.ts --write` → `git status` clean.
- Record the file's SHA-256 (LF line endings) and the git commit in the gate notes:
  `git rev-parse HEAD` and `git hash-object supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql`.
- Read the file. Read the ledger. Confirm: 3 `INSERT`, 75 `UPDATE`, no DDL.

### 4. Take a before-snapshot (read-only)
```sql
select 'categories' t, count(*) n, md5(string_agg(md5(c::text), '' order by category_key)) h from public.business_learning_categories c
union all select 'lessons', count(*), md5(string_agg(md5(l::text), '' order by lesson_key)) from public.business_learning_lessons l
union all select 'resources', count(*), md5(string_agg(md5(r::text), '' order by resource_key)) from public.business_learning_resources r
union all select 'progress', count(*), null from public.business_learning_progress
union all select 'capability_records', count(*), null from public.business_capability_records;
```
Keep the output. Also export the three learning tables (dashboard CSV export or `pg_dump --data-only -t …`) so the
change can be reversed.

### 5. Apply ONLY the reviewed I-1 seed, explicitly
Paste / run the contents of **that one file** in the verified project, inside a transaction so it can be inspected
before it is kept:
```sql
begin;
-- contents of supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql
-- run the checks of steps 6–7 here
commit;   -- or: rollback;
```
Not `supabase db push`. Not `supabase migration up`. Not a linked-project command of any kind.

### 6. Verify exactly 3 new published lesson rows
```sql
select lesson_key, status, published_at is not null as has_date, sort_order, capability_key,
       char_length(body_es) es_len, char_length(body_en) en_len
from public.business_learning_lessons
where lesson_key in ('what_problem_do_you_solve','customer_conversations','know_your_competition')
order by sort_order;                                            -- expected: 3 rows, published, sort 3/4/5, bodies > 1200
select count(*) as lessons, count(*) filter (where status = 'published') as published
from public.business_learning_lessons;                          -- expected after: 19 / 11
```

### 7. Verify the accent repair
```sql
select title_es from public.business_learning_lessons where lesson_key = 'who_is_your_customer';     -- Quién es tu cliente
select title_es from public.business_learning_categories where category_key = 'proteccion_y_datos';  -- Protección de datos
select count(*) from public.business_learning_lessons
where status = 'published' and body_es like '%Por qué importa:%' and body_es like '%Pasos prácticos:%'; -- 8
select count(*) from public.business_learning_lessons where body_es like '%Por que importa:%';        -- 0
```
If fewer rows changed than the ledger lists, a guard skipped an edited row: list which, and report — do not force it.

### 8. Start exactly ONE Learning runtime against staging
One dev server, port 3001, from the Learning worktree, with its environment pointing at the **staging** project
(the person running it sets the environment; values are never printed). No second server, no build.
Confirm the feature flag `business_learning_center` is at tier `global` on staging, or the public pages will not render.

### 9. Browser QA — all 3 lessons, at 390 · 768 · 1440
For `/aprender/leccion/what_problem_do_you_solve`, `/customer_conversations`, `/know_your_competition`, in ES and EN,
with `?journey=idea`, `empezando`, `negocio` and with no journey:
- header, breadcrumb, sticky mode bar (Leer · Hacer · Preguntar a IA), no horizontal scroll at 390;
- hook visual: every label fits its bubble/pill in both languages (`product_vs_problem`, `pitch_vs_ask`, `alternatives_fork`);
- example story changes with the journey; "Ejemplo ilustrativo" label present;
- accents render correctly on the 8 older lessons, the category pages and the glossary.

### 10. Test the activities
- blanks stay visible `[brackets]`; the counter reads `n de N`; nothing is auto-completed;
- the multi-line fields (questions; observation notes) keep line breaks in the result;
- copy button, clear button, reload → answers persist on the device only (no network request carries them);
- "¿Y ahora qué hago con esto?" appears under the result and its button lands on the AI lab;
- local completion turns on only after every answer + the checklist.

### 11. Test every AI template variant
3 lessons × 3 templates × 4 stages (neutral · idea · empezando · negocio) × ES/EN:
- activity answers appear inside the conversation; editing the activity updates it; clearing the activity clears it;
- city / idea / customer / stage inputs fill their `[placeholders]`; empty ones stay bracketed;
- "Ensaya conmigo" is labelled practice-only and says its answers are not evidence;
- the competition templates refuse invented business names, prices, hours and reviews;
- no AI provider is named anywhere; copying makes no network call.

### 12. Test the print sheet
"Imprimir mi hoja" on each lesson → print preview shows **only** the sheet (1–2 pages): title, the learner's
result (sentence / plan / comparison), checklist, primary AI conversation, verification footer.
A normal browser print of the page is unaffected.

### 13. Test journey NEXT behaviour
- Idea: what_problem → who_is_your_customer → customer_conversations → know_your_competition → revenue_vs_profit;
- Empezando: who → what_problem → customer_conversations → know_your_competition → …;
- Negocio: who → customer_conversations → know_your_competition → … (what_problem is not in this pathway);
- no journey, from the flagship → customer_conversations;
- pathway pages show the new lessons under checkpoint 01 with truthful counts; planned lessons remain invisible.

### 14. Confirm no unrelated rows changed
Re-run the step-4 snapshot. Expected: `lessons` +3 rows and a new hash; `categories` and `resources` same counts,
new hashes; `progress` and `capability_records` **unchanged counts**. Spot-check that every `*_en` column of the
16 original lessons is byte-identical to the export taken in step 4. No other table was named by the seed.

### 15. Stop. Return to Coach before production.
Report: project ref used, seed commit + hash, before/after counts, any guard that skipped a row, QA findings with
screenshots, and the dev server stopped. **Do not apply to production from this runbook.**

---

## Rollback (staging)
```sql
begin;
delete from public.business_learning_lessons
where lesson_key in ('what_problem_do_you_solve','customer_conversations','know_your_competition')
  and not exists (select 1 from public.business_learning_progress p where p.lesson_id = business_learning_lessons.id);
-- accent repair: restore the three tables' *_es columns from the step-4 export if required
commit;
```
Deleting is acceptable on staging only. On production a lesson is withdrawn by status, never deleted.

## Known, not part of this batch
Four English strings of the TODAY-1 seed miss a possessive apostrophe ("your customers information" ×2,
"many people decisions", "your customers experience"). The I-1 seed updates no English column; they need their
own small reviewed correction.
