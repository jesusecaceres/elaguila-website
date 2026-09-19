# Leonix Learning Center — Master Curriculum Matrix

**Status:** CANONICAL CURRICULUM CONTROL PLANE (Gate G3; rev. 2 in Gate G4-I1) · **Date:** 2026-09-18
**Rev. 2:** owner decision OD-1A restored `ein_and_tax_id_awareness` as its own lesson (row 61). Universal total 61 · V1 40. Owner decisions OD-1…OD-5 and D3 are recorded as resolved in §21.
**Controlling doctrine:** `LEONIX_LEARNING_CENTER_MASTER_CONSTRUCTION_BIBLE_V2_2026-09-18.md` (esp. §5–§6, §10, §18–§21, §31, §44A–§44B)
**Working reference implementation:** lesson `who_is_your_customer` (G2 + G2.1) — `app/lib/business/learning/lessonPackage/**`
**Supersedes:** `docs/business-learning-center-content-batch-02.md` (its 8 planned rows are all carried here; its "1,200 characters + same structure" recipe is replaced by `validateLessonPackage`).

This document is curriculum **architecture**. It contains no lesson prose. Nothing here publishes a lesson: a lesson is public only when its `business_learning_lessons` row is `published` **and** it has a validated LessonPackage.

---

## 1. Executive curriculum principles

1. **One school, one spine, three ordered views.** Every lesson has exactly one home checkpoint (CP1–CP7). The three pathways (Idea · Starting · Business) reuse the *same* lesson with a different depth, urgency, example, recommended action and AI conversation. A lesson is never duplicated per pathway.
2. **The canonical lesson flow is locked (Bible §44A):** LEARN → DO → *understand what this result is for* → DEVELOP IT WITH AI → VERIFY → SAVE / BUILD ON IT → NEXT. Every row below names the result the learner creates and answers "what do I do with this?".
3. **Never collect an answer without showing its use.** Every activity has a `what_do_i_do_with_this_result`. The validator already rejects a package activity without a result bridge.
4. **AI is both curriculum and method.** Five lessons *teach* AI (rows 3, 4, 5, 27, 41). Every other lesson *uses* AI through a small, stage-aware template set assembled locally from the learner's own answers. Assistant-neutral, no AI API, nothing transmitted, blanks stay blank, "AI helps. You verify."
5. **Investigate, don't assert.** Anything legal, tax, licensing, insurance, employment, privacy or regulated is taught as *what to investigate, what to verify, and who to ask* — never as a requirement stated as fact (Bible §20–§21). Those rows are `JS = Y` and must carry `verify` + `pro_help` blocks (validator-enforced).
6. **Quality over count.** 61 universal lessons, 40 in V1. A lesson exists only if a first-time entrepreneur leaves it able to *do* something. No stub lessons, no inflated counts, planned titles are never shown publicly.
7. **Stable identity.** `lesson_key` and `capability_key` of the 16 seeded lessons are frozen (Concierge `relatedLessonKey`, Idea Builder `relatedCapabilityKey` and progress/capability records depend on them).
8. **Useful without Leonix.** `leonix_connection` is blank for almost every row. Leonix appears factually in a handful of visibility/media rows and transparently in the capstone (row 60), from a capability truth registry the owner certifies (decision D7). No partner is named anywhere (Bible §24).
9. **Audio teaches; it does not narrate.** Every V1 row has an audio teaching goal and outline. Scripts are separate, conversational, driving-safe, and never read the page.
10. **Truth ages.** Evergreen rows get an editorial review; platform and jurisdiction rows carry a review cadence, and any maintained official source must show `last_verified_at` / `review_by` and degrade visibly when stale.

---

## 2. Legend / field definitions

**Status / source:** `PUB` published seed lesson (8) · `PLN` planned seed row, no body (8) · `NEW` no database row yet.
**Class:** `V1` (40) · `V1.1` (19) · `V2` (2) · `REC` = recurring/current content stream, not a lesson (§20).
**Checkpoint (CP):** 1 entender · 2 construir · 3 preparar · 4 visible · 5 crecer · 6 proteger · 7 siguiente.
**Domain:** IDEA · CUST · BRAND · FOUND (business foundation) · MONEY · DIGI (digital presence) · SOCIAL · AI · MKT · OPS · PEOPLE · GROW · PROTECT · NEXT.
**U/C:** `U` universal · `U+R` universal with Restaurant/Food overlay · `U+S` with Services/Trades overlay · `U+RS` both. Category-specific lessons live in §13–§14, not in the universal table.
**Depth per journey (I / E / N = Idea / Starting / Business):** `C` core · `L` light (shown as "Vistazo": core blocks only, short framing) · `D` deep (revisit with real business evidence) · `–` not in that pathway.
**AI template types (Bible §44A-D):** `A` Develop my answer · `B` Interview me · `C` Challenge my assumptions · `D` Research / verify · `E` Teach me the vocabulary · `F` Help me decide the next step.
**Stage:** `S3` template wording changes materially for all three journeys · `S2` two journeys differ (third not in pathway or identical) · `S1` same conversation for everyone.
**Q1:** the template asks the AI to ask questions *before* answering (always `Y` unless noted). **CH:** set includes an assumption-challenge step.
**Verification instruction (what the learner is told to check, and against what):** `V-REAL` real people/customers · `V-DATA` the learner's own sales/records · `V-PLATFORM` the platform's own current help pages · `V-OFFICIAL` the official agency/source for the learner's location · `V-PRO` a licensed professional.
**Privacy boundary (what never goes into an AI assistant):** `P-STD` customers' full names, phone numbers, addresses, private account info · `P-FIN` adds bank/card/account numbers, SSN/ITIN/EIN, logins, statements with identifiers · `P-HR` adds employees' names, SSNs, medical, immigration or disciplinary details · `P-SEC` adds passwords, verification codes, screenshots showing account data.
**Read structure:** `R-FULL` flagship anatomy (hook · outcomes · explain chunks · visual model · example with journey variants · compare · activity + result bridge · AI lab · mistake · glossary · checklist · verify · recap) · `R-TOOL` platform how-to (hook · outcomes · explain · ordered steps · example · activity/checklist + bridge · AI lab · verify-with-platform · recap) · `R-JS` jurisdiction lesson (`R-FULL` without compare, plus mandatory `verify` + `pro_help`, "investigate" wording) · `R-AI` AI-skill lesson (`R-FULL` where the activity *is* an AI conversation) · `R-CAP` capstone.
**Truth:** `EVG` evergreen · `PLAT` platform-dependent (features change) · `JS` jurisdiction-sensitive · `CUR` current/maintained.
**Jurisdiction scope for V1 maintained sources (decision D5):** U.S. federal · California · Santa Clara County · San José. Everywhere else the lesson teaches *how to find your own office*. `MS` = a maintained current source is eventually required (`Y`/`N`).
**Review cadence:** `E24` editorial review every 24 months · `P12` platform review every 12 months · `ANN` annual (tax season / January) · `Q` quarterly.
**Professional-help types:** `cpa_tax` · `attorney` · `insurance` · `licensing_office` · `health_department` · `labor_agency` · `financial` · `contractor_board` · `hr` (same enum as `ProHelpType` in `lessonPackage/types.ts`).
**Analytics priority:** `H` instrument first (journey funnels, activity completion, template copies) · `M` · `L`.
**Owner QA:** `FULL` flagship-level owner walk-through · `STD` standard content QA · `LEGAL` owner QA + recommended read-through by the named professional type before publishing.
**Implementation dependency:** `ENG` lesson engine (exists) · `SEED` needs an additive data seed (new `business_learning_lessons` row: the page only renders published rows) · `ACT:x` new code-owned activity kind/key · `VIS:x` new code-owned visual · `CALC` calculator activity kind (not built) · `TRUTH` maintained-source model (future migration M5) · `CAPREG` Leonix capability truth registry (decision D7) · `AUD` audio asset pipeline (decision D6).

---

## 3. Existing 8 published lessons — canonical mapping

All eight keep their `lesson_key`, `capability_key`, category and publish state. Seven currently render through the legacy adapter (reduced structure: explanation · steps · note · linked resources); "Upgrade work" is what turns each into a full package. Stored titles/bodies are unaccented — accent repair is decision D3 (reviewed data update, later gate).

| # | lesson_key | capability_key (frozen) | CP | I/E/N | Today | Upgrade work |
|---|---|---|---|---|---|---|
| 2 | `who_is_your_customer` | `know_your_customer` | 1 | C/C/D | **Full package (flagship, G2.1)** | None. Reference for every other row. |
| 18 | `revenue_vs_profit` | `revenue_vs_profit` | 3 | L/C/C | Legacy adapter | Full package; month-profit activity; linked `template_monthly_expense_tracker`; template set A·E·C. **Idea batch.** |
| 22 | `healthy_boundaries_and_capacity` | `healthy_capacity_boundaries` | 3 | L/C/C | Legacy adapter | Full package; weekly-hours activity; A·C·F. **Idea batch.** |
| 28 | `consistent_business_information` | `consistent_business_info` | 4 | –/C/C | Legacy adapter | Full package; master-info document activity; linked `checklist_business_info_consistency`; A·D. |
| 29 | `google_business_basics` | `google_business_basics` | 4 | –/C/C | Legacy adapter | Full package (`R-TOOL`); facts-only description activity; linked `checklist_google_business_setup`; A·B·D (proof set in §9). |
| 33 | `whatsapp_business_basics` | `whatsapp_business_basics` | 4 | –/C/C | Legacy adapter | Full package (`R-TOOL`); welcome/away/quick-reply drafts; linked `checklist_whatsapp_weekly_response`; A·B. |
| 34 | `reviews_and_customer_response` | `review_response_basics` | 4 | –/L/C | Legacy adapter | Full package; calm-response drafting activity; linked `template_review_response`; A·C. |
| 43 | `advertising_fundamentals` | `advertising_fundamentals` | 5 | –/C/C | Legacy adapter | Full package; one-goal/one-message ad brief; A·C·D. |

## 4. Existing 8 planned lessons — canonical mapping

All eight keep their seeded `lesson_key` and `capability_key`. None is public until authored as a package and flipped to `published`.

| # | lesson_key | capability_key (frozen) | CP | I/E/N | Class | Note |
|---|---|---|---|---|---|---|
| 12 | `branding_basics` | `branding_basics` | 2 | L/C/D | V1 | In the Idea pathway (light). Idea Builder already points its "business name" readiness question at this capability. |
| 35 | `local_seo_basics` | `local_seo_basics` | 4 | –/L/C | V1 | Depends on 28 + 29. |
| 44 | `referrals_basics` | `referral_program_basics` | 5 | –/L/C | V1 | Orphan resource `template_referral_ask_script` attaches on publish. |
| 55 | `customer_data_protection` | `customer_data_protection` | 6 | –/C/C | V1 | `JS = Y` (privacy law varies); the seeded empty category `proteccion_y_datos` becomes visible when this publishes. |
| 23 | `profitable_service_basics` | `profitable_service_basics` | 3 | –/L/C | V1.1 | Builds on 17 + 18. |
| 37 | `short_video_basics` | `short_video_basics` | 4 | –/L/C | V1.1 | After 32. |
| 38 | `product_photography_basics` | `product_photography_basics` | 4 | –/C/C | V1.1 | Orphan resource `checklist_photo_shoot_prep` attaches on publish. |
| 48 | `simple_analytics` | `simple_analytics_basics` | 5 | –/–/C | V1.1 | Business pathway only. |

**Changes versus the approved 61-row plan (and why):**
- **Kept** `ein_and_tax_id_awareness` as its own lesson (row 61). Rev. 1 of this matrix merged it into `business_structure_concepts`; the owner rejected that (OD-1A): an EIN / tax ID is a major first-time-entrepreneur concept and deserves its own discoverable lesson. Row 13 is structure only. Row numbers are stable identifiers, not positions, so the restored row is numbered 61 and sits after row 13.
- **Promoted** row 6 `customer_conversations` from V1.1 to **V1** and into all three pathways. The flagship's verification step tells every learner to "talk to 3 real people"; the school must teach *how* (approved, OD-1B). With the EIN lesson restored, V1 is **40** — curriculum truth outranks a round count.
- **Re-ordered CP1** so the first AI lessons (3–5) come right after the first business win (rows 1–2): the learner meets the AI lab in the flagship, then learns to use it well before the remaining lessons lean on it.

---

## 5. Full universal curriculum matrix

### 5.1 Identity and curriculum (all 61 rows)

Row numbers (`#`) are stable identifiers, not positions: row 61 was restored after rows 1–60 were numbered and sits in CP2 after row 13. `capability_key` for a NEW row equals its `lesson_key` unless shown. Prerequisites are *recommended order*, never a gate — public learning is never blocked.

| # | lesson_key | Título (ES) | Title (EN) | Src | Class | CP | Domain | U/C | I/E/N | Prerequisites |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `what_problem_do_you_solve` | Qué problema resuelves | What problem do you solve | NEW | V1 | 1 | IDEA | U | C/L/– | — |
| 2 | `who_is_your_customer` | Quién es tu cliente | Who is your customer? | PUB | V1 | 1 | CUST | U+RS | C/C/D | 1 (Idea) |
| 3 | `ai_basics_for_business` | IA para tu negocio: lo básico | AI for your business: the basics | NEW | V1 | 1 | AI | U | C/C/C | 2 |
| 4 | `build_your_ai_business_coach` | Crea tu coach de negocio con IA | Build your AI business coach | NEW | V1 | 1 | AI | U | C/C/C | 2, 3 |
| 5 | `ai_helps_you_verify` | La IA ayuda. Tú verificas. | AI helps. You verify. | NEW | V1 | 1 | AI | U | C/C/C | 3 |
| 6 | `customer_conversations` | Habla con clientes reales | Talk to real customers | NEW | V1 | 1 | CUST | U+RS | C/C/L | 2 |
| 7 | `know_your_competition` | Conoce a tu competencia | Know your competition | NEW | V1 | 1 | IDEA | U+RS | C/L/D | 2 |
| 8 | `what_makes_you_different` | Qué te hace diferente | What makes you different | NEW | V1 | 1 | CUST | U | C/C/D | 2, 7 |
| 9 | `validate_before_you_spend` | Valida antes de gastar | Validate before you spend | NEW | V1 | 1 | IDEA | U | C/L/– | 2, 6 |
| 10 | `simple_business_model` | Cómo gana dinero tu negocio | How your business makes money | NEW | V1.1 | 1 | IDEA | U | C/L/– | 1, 2 |
| 11 | `naming_your_business` | El nombre de tu negocio | Naming your business | NEW | V1 | 2 | BRAND | U | L/C/– | 8 |
| 12 | `branding_basics` | Marca: más que un logo | Branding: more than a logo | PLN | V1 | 2 | BRAND | U | L/C/D | 2, 8 |
| 13 | `business_structure_concepts` | Estructuras de negocio: qué preguntar | Business structures: what to ask | NEW | V1 | 2 | FOUND | U | –/C/L | — |
| 61 | `ein_and_tax_id_awareness` | EIN y tu identificación fiscal: qué es y qué preguntar | EIN and your tax ID: what it is and what to ask | NEW | V1 | 2 | FOUND | U | –/C/L | 13 |
| 14 | `licenses_and_permits_awareness` | Licencias y permisos: cómo investigar | Licenses and permits: how to research them | NEW | V1 | 2 | FOUND | U+RS | L/C/L | 1 |
| 15 | `business_banking_basics` | Separa tu dinero: banca de negocio | Separate your money: business banking | NEW | V1 | 2 | MONEY | U | –/C/L | 13 |
| 16 | `startup_costs` | Cuánto cuesta empezar | What it costs to start | NEW | V1 | 2 | MONEY | U+RS | C/C/– | 1, 9 |
| 17 | `pricing_basics` | Costo, precio y cómo cobrar | Cost, price, and how to charge | NEW | V1 | 3 | MONEY | U+RS | L/C/D | 16 (Idea), 2 |
| 18 | `revenue_vs_profit` | Ingresos contra ganancia | Revenue versus profit | PUB | V1 | 3 | MONEY | U+RS | L/C/C | 17 |
| 19 | `record_keeping_basics` | Registros y contabilidad básica | Record keeping and basic bookkeeping | NEW | V1 | 3 | MONEY | U | –/C/C | 15, 18 |
| 20 | `customer_experience_basics` | La experiencia de tu cliente | Your customer's experience | NEW | V1 | 3 | CUST | U+RS | –/C/C | 2 |
| 21 | `simple_operations_and_follow_up` | Operación simple: agenda, procesos y seguimiento | Simple operations: schedule, processes, follow-up | NEW | V1 | 3 | OPS | U+RS | –/C/C | 20 |
| 22 | `healthy_boundaries_and_capacity` | Límites sanos y capacidad | Healthy boundaries and capacity | PUB | V1 | 3 | OPS | U | L/C/C | — |
| 23 | `profitable_service_basics` | Servicios y productos que sí dejan ganancia | Services and products that are actually profitable | PLN | V1.1 | 3 | MONEY | U+RS | –/L/C | 17, 18 |
| 24 | `cash_flow_and_budgeting` | Flujo de efectivo y presupuesto | Cash flow and budgeting | NEW | V1.1 | 3 | MONEY | U | –/L/C | 18, 19 |
| 25 | `payments_and_contact_channels` | Cómo te pagan y cómo te contactan | How customers pay you and reach you | NEW | V1.1 | 3 | OPS | U | –/C/L | 15 |
| 26 | `estimates_and_contracts_awareness` | Cotizaciones y contratos: lo básico | Estimates and contracts: the basics | NEW | V1.1 | 3 | FOUND | U+S | –/C/L | 17 |
| 27 | `ai_for_operations` | IA para operar: procesos, hojas de cálculo y mensajes | AI for operations: processes, spreadsheets, and messages | NEW | V1.1 | 3 | AI | U | –/L/C | 4, 21 |
| 28 | `consistent_business_information` | Información consistente del negocio | Consistent business information | PUB | V1 | 4 | DIGI | U | –/C/C | — |
| 29 | `google_business_basics` | Fundamentos de Google Business | Google Business basics | PUB | V1 | 4 | DIGI | U+RS | –/C/C | 28 |
| 30 | `yelp_basics` | Yelp: qué es y cómo manejarlo | Yelp: what it is and how to manage it | NEW | V1 | 4 | DIGI | U+RS | –/C/C | 28 |
| 31 | `website_basics` | ¿Necesitas un sitio web? | Do you need a website? | NEW | V1 | 4 | DIGI | U | –/C/D | 2, 28 |
| 32 | `choosing_social_platforms` | Redes sociales: cuál le conviene a tu negocio | Social media: which platform fits your business | NEW | V1 | 4 | SOCIAL | U+RS | L/C/C | 2 |
| 33 | `whatsapp_business_basics` | Fundamentos de WhatsApp Business | WhatsApp Business basics | PUB | V1 | 4 | DIGI | U | –/C/C | 28 |
| 34 | `reviews_and_customer_response` | Reseñas y respuesta a clientes | Reviews and customer response | PUB | V1 | 4 | CUST | U+RS | –/L/C | 29 |
| 35 | `local_seo_basics` | Fundamentos de SEO local | Local SEO basics | PLN | V1 | 4 | DIGI | U+S | –/L/C | 28, 29 |
| 36 | `instagram_facebook_profile_basics` | Tu perfil de Instagram y Facebook | Your Instagram and Facebook profile | NEW | V1.1 | 4 | SOCIAL | U | –/C/C | 32 |
| 37 | `short_video_basics` | Video corto básico | Short video basics | PLN | V1.1 | 4 | SOCIAL | U+R | –/L/C | 32 |
| 38 | `product_photography_basics` | Fotografía de producto básica | Product photography basics | PLN | V1.1 | 4 | BRAND | U+RS | –/C/C | 12 |
| 39 | `qr_links_booking_orders` | QR, enlaces, reservas y pedidos en línea | QR codes, links, booking, and online orders | NEW | V1.1 | 4 | DIGI | U+R | –/C/C | 28 |
| 40 | `email_and_sms_basics` | Email y SMS para tu negocio | Email and SMS for your business | NEW | V1.1 | 4 | MKT | U | –/L/C | 55 |
| 41 | `ai_for_content_and_design` | IA para contenido: texto, imagen y video | AI for content: text, image, and video | NEW | V1.1 | 4 | AI | U | –/L/C | 4, 5, 12 |
| 42 | `marketing_fundamentals` | Marketing: lo esencial | Marketing: the essentials | NEW | V1 | 5 | MKT | U | –/C/C | 2, 8 |
| 43 | `advertising_fundamentals` | Fundamentos de publicidad | Advertising fundamentals | PUB | V1 | 5 | MKT | U | –/C/C | 2, 42 |
| 44 | `referrals_basics` | Fundamentos de referidos | Referrals basics | PLN | V1 | 5 | MKT | U+S | –/L/C | 20 |
| 45 | `customer_retention` | Clientes que regresan | Customers who come back | NEW | V1.1 | 5 | CUST | U+RS | –/–/C | 20 |
| 46 | `offers_and_promotions` | Ofertas y promociones que sí convienen | Offers and promotions that are worth it | NEW | V1.1 | 5 | MKT | U+R | –/L/C | 17, 18 |
| 47 | `media_mix_print_radio_digital` | Impreso, radio, digital y social: cómo combinarlos | Print, radio, digital, and social: how to combine them | NEW | V1.1 | 5 | MKT | U | –/–/C | 43 |
| 48 | `simple_analytics` | Analítica simple para tu negocio | Simple analytics for your business | PLN | V1.1 | 5 | GROW | U | –/–/C | 43 |
| 49 | `hiring_readiness` | ¿Listo para contratar? | Are you ready to hire? | NEW | V1.1 | 5 | PEOPLE | U+RS | –/–/C | 22, 54 |
| 50 | `community_marketing_partnerships` | Comunidad y alianzas locales | Community and local partnerships | NEW | V2 | 5 | MKT | U | –/–/C | 42 |
| 51 | `expansion_readiness` | Sistemas antes de crecer | Systems before you scale | NEW | V2 | 5 | GROW | U | –/–/C | 21, 24 |
| 52 | `insurance_awareness` | Seguros: qué preguntar | Insurance: what to ask | NEW | V1 | 6 | PROTECT | U+RS | –/C/C | 13 |
| 53 | `tax_awareness` | Impuestos: conceptos y preguntas para tu contador | Taxes: concepts and questions for your accountant | NEW | V1 | 6 | PROTECT | U+R | –/C/C | 13, 19 |
| 54 | `employees_contractors_payroll` | Empleados, contratistas y nómina: lo básico | Employees, contractors, and payroll: the basics | NEW | V1 | 6 | PEOPLE | U+RS | –/L/C | 13 |
| 55 | `customer_data_protection` | Protección de datos del cliente | Customer-data protection | PLN | V1 | 6 | PROTECT | U | –/C/C | — |
| 56 | `scams_and_online_safety` | Estafas comunes contra negocios pequeños | Common scams against small businesses | NEW | V1 | 6 | PROTECT | U | C/C/C | — |
| 57 | `when_to_get_professional_help` | Cuándo buscar ayuda profesional y cómo prepararte | When to get professional help and how to prepare | NEW | V1 | 6 | PROTECT | U | C/C/C | — |
| 58 | `workers_comp_and_workplace_notices` | Compensación laboral y avisos en el trabajo | Workers' compensation and workplace notices | NEW | V1.1 | 6 | PEOPLE | U+RS | –/L/C | 54 |
| 59 | `quarterly_business_checkup` | Tu revisión trimestral | Your quarterly business checkup | NEW | V1.1 | 7 | NEXT | U | –/L/C | 18 |
| 60 | `how_to_move_forward` | Ya tienes las herramientas. Ahora decide cómo quieres avanzar. | You have the tools. Now decide how you want to move forward. | NEW | V1 | 7 | NEXT | U | C/C/C | 57 |

**Checkpoint coverage (V1 / all):** CP1 9/10 · CP2 7/7 · CP3 6/11 · CP4 8/14 · CP5 3/10 · CP6 6/7 · CP7 1/2. Every checkpoint has V1 coverage in the Starting pathway; the Idea pathway is intentionally thin in CP4–CP5 ("it is not time to advertise yet").

Stored titles for rows 12 and 23 differ from the display titles above (`Fundamentos de identidad de marca` / `Fundamentos de servicios rentables`); the package's `meta.title` carries the display title, exactly as the flagship does. `next_lesson_by_journey` for every row is given in §5.2 and is derived from the pathway orders in §6–§8.

### 5.2 Learning + AI development (one card per row)

Card fields: **Outcomes** (`learning_outcomes`) · **Why** (`why_it_matters`) · **Hook / example** (`visual_hook`, `example_business`, `example_variant_by_journey`) · **Do → result** (`interactive_activity`, `result_created`) · **Use it** (`what_do_i_do_with_this_result`) · **AI** (`ai_development_goal`, `ai_template_set`, `ai_template_variants_by_journey`, `activity_fields_used_as_context`) · **Context out** (`business_context_fields_created_or_updated`) · **Next** (`next_lesson_by_journey`; V1 order; "—" = not in that pathway).

Coded AI columns (`ai_questions_first`, `assumption_challenge`, `verification_instruction`, `privacy_boundary`) are in §9.1; media, truth, product and delivery columns are in §5.3–§5.5.

#### CP1 · ENTENDER

**1 · `what_problem_do_you_solve`**
- **Outcomes:** state the problem in the customer's words; tell a problem from a product idea; name who feels it most and how they cope today.
- **Why:** people pay to solve problems, not to admire products; an idea with no felt problem burns savings.
- **Hook / example:** a product sitting on a shelf vs. a person with a need — "Nobody wakes up wanting your product." Example: *Lavandería móvil de Marco*. I: Marco assumes "everyone hates laundry". E: he notices it is nurses on 12-hour shifts. N: not in pathway.
- **Do → result:** `problem_statement_builder` (guided fields: who · what goes wrong · how often · what they do today · what it costs them) → a one-sentence **problem statement**.
- **Use it:** it is a hypothesis about pain, not proof; it tells you who to talk to first and what to ask; it becomes the opening context of every later AI conversation.
- **AI:** goal — sharpen and stress-test the problem. Set A·B·C. S2: Idea = "treat as a guess, what would disprove it?"; Starting = "which version of this problem are my first customers paying to solve?". Context in: all five fields.
- **Context out:** `business_idea`, `problem_solved`.
- **Next:** I → 2 · E → 3 · N —

**2 · `who_is_your_customer`** — *built; reference implementation*
- **Outcomes:** describe who the business serves; explain the problem solved; identify where to reach that customer.
- **Why:** "everyone" makes every message, price and ad decision vague.
- **Hook / example:** business in the center, five customer groups, one ringed "you start here". *Panadería de Rosa* — I: planning to sell from home; E: first month, impossible requests; N: three years in, learns who actually returns.
- **Do → result:** `customer_statement_builder` (offer · who · problem · where · why) → **customer sentence**.
- **Use it:** first working customer draft / hypothesis; shapes message, where to reach people and what to investigate; must be tested with real people; feeds the AI lab.
- **AI:** Set A·B·C, S3 (explore → prepare → diagnose), all five fields + city + stage. Live in `prompts.ts`.
- **Context out:** `customer`, `problem_solved`, `what_i_sell`, `city`, `business_stage`.
- **Next:** I → 3 · E → 1 · N → 3

**3 · `ai_basics_for_business`**
- **Outcomes:** explain in plain words what an AI assistant is good and bad at; give it context and a role; recognise a confident wrong answer.
- **Why:** the learner just used an AI template; without this they either fear it or trust it blindly — both cost money.
- **Hook / example:** a very fast, well-read intern who has never seen *your* business. Example: *Taquería de Luis* asks the same question twice — once bare, once with context — and compares the answers. Variants by what each stage asks about (idea names · launch checklist · slow Tuesdays).
- **Do → result:** `bare_vs_context_compare` (tap-to-reveal + the learner rewrites one of their own questions with context, role, constraint) → a **better question** in their own words.
- **Use it:** this is the pattern behind every Leonix template; reuse it for any question; it is practice, not an answer about your business.
- **AI:** goal — understand the tool by using it. Set E·B. S3 (examples differ by stage). Context in: the learner's rewritten question + stage.
- **Context out:** first entries of `things_ai_must_never_assume`.
- **Next:** I, E, N → 4

**4 · `build_your_ai_business_coach`**
- **Outcomes:** assemble a reusable business context; start one continuing AI conversation; update it over time.
- **Why:** retyping context every time is why people give up; a saved context turns an AI into a coach that knows the business.
- **Hook / example:** a blank notebook vs. a notebook with your business on page one. Example: Rosa pastes her profile and the answers stop being generic. I: profile is mostly hypotheses; E: decisions and launch date; N: real numbers and patterns.
- **Do → result:** `ai_starter_profile_builder` (the 12 Bible §13 fields, prefilled from lessons 1–2 where available) → **My Business AI Starter Profile** + starter instruction, one copyable block.
- **Use it:** paste it at the start of any AI conversation; re-paste when a new chat starts; refresh it every quarter; it is the seed of *Mi contexto de negocio*.
- **AI:** Set A·F. S3 (what the profile says about evidence differs). Context in: every profile field.
- **Context out:** `business_name`, `industry`, `city`, `business_stage`, `what_i_sell`, `customer`, `goals`, `challenges`, `team_size`, `things_ai_must_never_assume`.
- **Next:** I, E, N → 5

**5 · `ai_helps_you_verify`**
- **Outcomes:** ask an AI what it assumed; separate fact, assumption and suggestion; know what never to paste; know when a professional outranks an AI.
- **Why:** an invented permit rule, tax figure or "market fact" can cost more than the business earns in a month.
- **Hook / example:** one answer, three highlighters — fact · assumption · suggestion. Example: an AI tells Marco he "definitely needs" a permit; he asks for the source, finds none, and calls the city. Variants: idea = market claims; starting = permits/fees; business = hiring and tax claims.
- **Do → result:** `fact_assumption_sorter` (the learner sorts statements from a sample answer, then writes their own 3 verification questions) → a personal **"ask before you trust" list**.
- **Use it:** keep it next to every AI conversation; it is the habit behind every Verify block in the school.
- **AI:** Set C·D. S2. Context in: the learner's three verification questions + stage.
- **Context out:** `things_ai_must_never_assume`.
- **Next:** I, E, N → 6

**6 · `customer_conversations`**
- **Outcomes:** ask three real people useful questions without pitching; listen for their words; update the customer sentence with what was learned.
- **Why:** every Leonix lesson ends in "verify with real people" — this is how.
- **Hook / example:** two speech bubbles — one selling, one asking. Example: Rosa asks three neighbours how they solved their last birthday cake. I: talks to possible customers; E: talks to first buyers and near-misses; N (light): talks to regulars and to people who stopped coming.
- **Do → result:** `conversation_plan_builder` (who I will talk to · where · my 5 questions · what would change my mind) → a **3-conversation plan**, then a short "what I heard" note.
- **Use it:** evidence, not opinions; use their exact words in messages; rewrite the customer sentence; bring the notes into the AI lab.
- **AI:** Set A·B·C — B is labelled *practice*: the AI plays a customer so the learner rehearses; it never replaces a real conversation. S3. Context in: customer sentence (from row 2) + the plan fields.
- **Context out:** `customer` (evidence-updated), `challenges`.
- **Next:** I → 7 · E → 8 · N → 7

**7 · `know_your_competition`**
- **Outcomes:** list real alternatives (including "do nothing" and "do it myself"); compare on what the customer cares about; find a gap without copying.
- **Why:** customers always have an alternative; ignoring it produces the wrong price and the wrong message.
- **Hook / example:** the customer at a fork with four paths, one of them "do nothing". Example: Marco's competitors are the laundromat, a relative, and the washer at home. I: desk + street research; E (light): who is near my location; N: who my customers also use and why they switch.
- **Do → result:** `alternatives_grid` (3–5 alternatives × price · convenience · trust · what they do well) → a **comparison grid**.
- **Use it:** it shows where you can be clearly better for *your* customer; it is a snapshot to re-check, not a verdict; it feeds "what makes you different".
- **AI:** goal — a research checklist, never invented competitor facts. Set D·A·C. S3. Context in: customer sentence + the grid.
- **Context out:** `competitors`.
- **Next:** I → 8 · E → 9 · N → 8

**8 · `what_makes_you_different`**
- **Outcomes:** write a value statement a customer would repeat; tell a real difference from a slogan; know what you will *not* be.
- **Why:** "quality and good service" is what everyone says; a specific difference is what gets remembered and recommended.
- **Hook / example:** ten identical storefronts, one with a specific promise on the window. Rosa: "cake your way in 2–3 days". I: a promise to test; E: a promise to deliver from day one; N: the difference customers already name in reviews.
- **Do → result:** `value_statement_builder` (for whom · the result they get · unlike · because) + weak/strong compare → a **value statement**.
- **Use it:** the spine of your name, profile description and first ad; still a claim until customers confirm it; test the wording in your conversations.
- **AI:** Set A·B·C. S3. Context in: customer sentence + comparison grid + the four fields.
- **Context out:** `differentiation`, `offer`.
- **Next:** I → 9 · E → 7 · N → 12

**9 · `validate_before_you_spend`**
- **Outcomes:** design one cheap test; decide in advance what result means go / adjust / stop; read the result honestly.
- **Why:** the expensive mistakes (lease, equipment, inventory) happen before any customer has said yes.
- **Hook / example:** a small bridge tested with one step before the truck. Rosa takes ten pre-orders before buying an oven. I: core; E (light): a soft opening as the test; N: not in pathway.
- **Do → result:** `cheap_test_planner` (what I believe · the smallest test · cost/time limit · the number that means "go") → a **one-page test plan**.
- **Use it:** run it this week; a "no" is a saved cost, not a failure; the result updates your customer, price and offer.
- **AI:** Set A·C·F. S2. Context in: problem statement + customer sentence + value statement + test fields.
- **Context out:** `goals`, `pricing_assumptions` (tested).
- **Next:** I → 16 · E → 11 · N —

**10 · `simple_business_model`** *(V1.1)*
- **Outcomes:** explain in four boxes who pays, for what, how often, and what it costs to deliver.
- **Why:** many ideas have customers but no way to earn enough per sale.
- **Hook / example:** four connected boxes. Marco: per-load vs. weekly subscription. I: core; E: light.
- **Do → result:** `four_box_model` → a **one-page model**. **Use it:** compare two ways of charging before choosing; input for startup costs and pricing.
- **AI:** Set A·E. S2. Context in: the four boxes. **Context out:** `offer`, `pricing_assumptions`.
- **Next:** slots after 9 in Idea and Starting.

#### CP2 · CONSTRUIR

**11 · `naming_your_business`** *(JS)*
- **Outcomes:** generate names from the value statement; test them for say-ability and confusion; know what to check (DBA/fictitious name, trademark, domain, handles) before paying for a sign.
- **Why:** renaming after signs, cards and profiles is expensive; a confusing or taken name is avoidable.
- **Hook / example:** a storefront with three crossed-out names. Rosa checks her favourite name and finds another bakery two cities away. I (light): shortlist only; E: choose and check.
- **Do → result:** `name_shortlist_tester` (5 candidates × easy to say · easy to spell · says what I do · not confusingly similar) → a **tested shortlist** + a "to verify" list.
- **Use it:** a shortlist, not a registration; nothing is yours until you verify availability where you operate.
- **AI:** Set A·D. S2. A brainstorms within the learner's constraints; D builds the availability checklist and never says a name "is available". Context in: value statement + shortlist.
- **Context out:** `business_name`.
- **Next:** I → 12 · E → 12 · N —

**12 · `branding_basics`** *(planned seed)*
- **Outcomes:** tell brand from logo; choose a simple consistent look and voice; list the places it must match.
- **Why:** inconsistency reads as "not a real business"; consistency is free.
- **Hook / example:** the same business shown twice — mismatched vs. consistent. I (light): three words for how it should feel; E: colours, voice, photo style; N (deep): audit what is already out there.
- **Do → result:** `brand_basics_sheet` (3 feeling words · 2 colours · voice do/don't · photo style) → a **one-page brand sheet**.
- **Use it:** hand it to anyone who makes something for you (or to an AI); it prevents redesigns, it does not replace a good product.
- **AI:** Set A·B·E. S3. Context in: value statement + brand sheet fields.
- **Context out:** `brand_voice`.
- **Next:** I → 14 · E → 13 · N → 13

**13 · `business_structure_concepts`** *(JS)*
- **Outcomes:** name the common structures and what differs between them (liability, taxes, paperwork, cost); arrive at a professional with the right questions.
- **Why:** the structure affects personal risk and taxes; the wrong "a friend told me" choice is costly to undo.
- **Hook / example:** the owner and the business drawn as one figure vs. two. Example follows a learner preparing for a first CPA meeting. E: core; N (light): "is my current structure still right?"
- **Do → result:** `pro_meeting_prep` (my situation in 6 facts · what I want to protect · my questions) → a **question sheet for a CPA/attorney**.
- **Use it:** take it to the meeting; it shortens (and cheapens) professional time; Leonix does not tell you which structure to choose.
- **AI:** Set D·E·F. S2. "Explain the terms using my situation; do not tell me which structure to pick; list what I must verify and with whom." Context in: the six facts + state.
- **Context out:** — (no legal facts are stored as context).
- **Next:** I — · E → 61 · N → 61

**61 · `ein_and_tax_id_awareness`** *(JS — restored by owner decision OD-1A)*
- **Outcomes:** explain in plain words what a tax ID / EIN is and what it is used for (bank, taxes, hiring, forms); know who issues it and that the official application is the source of truth; tell it apart from personal identification and from state registrations; arrive at a tax professional with the right questions.
- **Why:** it is the first "official" thing a bank, a supplier or a form asks a new owner for, and confusion here leads to paying look-alike sites, using a personal number where a business one fits, or freezing at the first form.
- **Hook / example:** one card for the person, one card for the business. Example: Rosa is asked for "her EIN" when opening a business account and does not know whether she has, needs or can get one. E: core — before the bank and the first supplier; N (light): "do I need one now that I am hiring or changing structure?"
- **Do → result:** `pro_meeting_prep` (reused: my situation · who asked me for a tax ID and why · my structure status · employees yes/no/later · my questions) → a **tax-ID question sheet**.
- **Use it:** take it to a tax professional or to the official agency's own help; Leonix explains the concept, it never tells you whether *you* need one, how to file, or what it costs — verify on the official source, and be careful with look-alike sites.
- **AI:** Set E·D·F. S2. "Explain the terms using my situation; do not tell me whether I need one or fill out anything for me; list what I must confirm on the official source or with a tax professional." Context in: the sheet fields + state.
- **Context out:** — (no tax facts are stored as context).
- **Next:** I — · E → 14 · N → 14

**14 · `licenses_and_permits_awareness`** *(JS)*
- **Outcomes:** build a research checklist by level (city · county · state · federal); find the right office; ask for requirements in writing.
- **Why:** requirements depend on place, industry and business model; guessing risks fines or a closed door.
- **Hook / example:** four stacked layers — city, county, state, federal — with question marks. I (light): "what would I have to investigate?"; E: do the research; N (light): renewal and expiry audit.
- **Do → result:** `permit_research_checklist` (business type · exact location · home/commercial · employees · special activities) → a **layered research checklist** with blanks for "who I asked / date / answer".
- **Use it:** a list of questions, not a list of requirements; only the agency's answer counts; keep the dates.
- **AI:** Set D·E. S3. Full proof set in §9.3. Context in: all five fields.
- **Context out:** `industry`, `city`, `service_area`.
- **Next:** I → 17 · E → 15 · N → 15

**15 · `business_banking_basics`** *(JS)*
- **Outcomes:** explain why business and personal money must be separate; list what banks commonly ask for; compare accounts on fees that matter.
- **Why:** mixed money hides profit, complicates taxes and can weaken liability protection.
- **Hook / example:** one jar vs. two labelled jars. E: open and separate from day one; N (light): untangle an existing mix.
- **Do → result:** `account_comparison_sheet` (monthly fee · minimums · cash deposits · transfers · card processing) → a **bank question list**.
- **Use it:** call or visit two banks with it; requirements and fees vary by bank and structure — confirm with the bank.
- **AI:** Set D·F. S2. Context in: structure status + the fee priorities.
- **Context out:** —
- **Next:** I — · E → 16 · N → 17

**16 · `startup_costs`**
- **Outcomes:** list one-time vs. monthly costs; find the forgotten ones; know how many months of runway the savings cover.
- **Why:** most first businesses fail on cash, not on the idea.
- **Hook / example:** an iceberg — visible costs above, deposits/permits/insurance/slow months below. Rosa's oven is the small number; the first three slow months are the big one. I: core; E: core.
- **Do → result:** `startup_cost_list` (one-time · monthly · "what I forgot" prompts · savings available) → a **cost list with a runway estimate**. `CALC` optional; works as guided fields first.
- **Use it:** an estimate to refine with real quotes; decides how small to start; goes straight into pricing.
- **AI:** Set A·C. S2. "Ask me what I have not listed; never invent prices — tell me what to get a quote for." Context in: cost lines.
- **Context out:** `startup_costs`.
- **Next:** I → 11 · E → 17 · N —

#### CP3 · PREPARAR

**17 · `pricing_basics`**
- **Outcomes:** calculate the full cost of one sale including own time; set a price from cost + value + alternatives; defend it without apologising.
- **Why:** under-pricing is the most common way busy businesses lose money.
- **Hook / example:** a price tag sliced into materials · time · overhead · profit. Rosa's $25 cake leaves $3 after her hours. I (light): "could this ever pay?"; E: set launch prices; N (deep): re-price from real costs.
- **Do → result:** `unit_cost_price_builder` (materials · minutes × hourly value · overhead share · target profit · what alternatives charge) → a **price with its reasoning**.
- **Use it:** a starting price to test, not a permanent one; explains your price to yourself first; revisit each quarter.
- **AI:** Set A·C·E. S3. Full proof set in §9.3. Context in: all builder fields.
- **Context out:** `pricing_assumptions`, `offer`.
- **Next:** I → 18 · E → 18 · N → 18

**18 · `revenue_vs_profit`** *(published; upgrade)*
- **Outcomes:** separate what comes in from what is kept; compute one month's real profit; spot the product that sells most but earns least.
- **Why:** a business can look busy while losing money every month.
- **Hook / example:** a full cash register beside a nearly empty jar labelled "what stays". I (light): does the idea leave anything?; E: track from month one; N: last month's real profit.
- **Do → result:** `month_profit_snapshot` (revenue · cost lines · profit · best/worst line) → a **one-month profit snapshot**; links existing `template_monthly_expense_tracker`.
- **Use it:** one month is a snapshot — repeat three months before deciding; shows which line to fix first.
- **AI:** Set A·E·C. S3. "Help me organise my categories; do not calculate taxes; explain margin with my numbers." Context in: the snapshot.
- **Context out:** `operating_costs`.
- **Next:** I → 22 · E → 19 · N → 19

**19 · `record_keeping_basics`** *(JS)*
- **Outcomes:** keep income, expenses and receipts in one weekly habit; use simple categories; know what an accountant will ask for.
- **Why:** records are how you see profit, prove expenses and avoid a panicked tax season.
- **Hook / example:** a shoebox of receipts vs. one simple weekly page. E: start the habit; N: fix the backlog.
- **Do → result:** `weekly_records_routine` (where receipts go · categories · the weekly 20 minutes · who does it) → a **records routine**.
- **Use it:** a habit, not an accounting system; retention rules and deductible categories must be confirmed with a tax professional.
- **AI:** Set A·D·E. S2. Context in: categories + routine.
- **Context out:** `operating_costs`.
- **Next:** I — · E → 20 · N → 20

**20 · `customer_experience_basics`**
- **Outcomes:** map the customer's path from first contact to after the sale; find the two moments that lose people; fix one this week.
- **Why:** most lost sales are lost at a slow reply, a confusing price or a forgotten follow-up — not at the product.
- **Hook / example:** a path with stepping stones, two of them cracked. Rosa loses orders between "how much?" and her reply. E: design it before opening; N: walk your own path as a customer.
- **Do → result:** `customer_path_map` (find · ask · buy · receive · after — what happens, how long, how it feels) → a **path map with two fixes**.
- **Use it:** fix the cheapest crack first; ask a real customer to confirm it.
- **AI:** Set A·B·C. S2. Context in: the five steps.
- **Context out:** `challenges`.
- **Next:** I — · E → 21 · N → 21

**21 · `simple_operations_and_follow_up`**
- **Outcomes:** write the steps of one repeated job; keep one calendar and one customer list; follow up every lead within a promised time.
- **Why:** a business that lives in the owner's head cannot rest, delegate or grow.
- **Hook / example:** tangled string vs. five numbered pegs. Marco's pickup-to-delivery routine. E: before launch; N: the job that breaks most often.
- **Do → result:** `process_steps_writer` (one recurring job → steps · who · tools · what "done" means · follow-up rule) → **a written process + a follow-up rule**.
- **Use it:** a first draft to try for two weeks; the beginning of training someone else.
- **AI:** Set A·B·F. S2. Full proof set in §9.3. Context in: job name + the learner's own steps.
- **Context out:** `challenges`, `team_size`.
- **Next:** I — · E → 22 · N → 22

**22 · `healthy_boundaries_and_capacity`** *(published; upgrade)*
- **Outcomes:** count real weekly hours; find the point where more work lowers quality; say no, or "not yet", with a reason.
- **Why:** over-promising damages quality, reviews and the owner's health.
- **Hook / example:** a full glass under a running tap. I (light): hours really available; E: limits before opening; N: where quality drops.
- **Do → result:** `weekly_capacity_check` (hours by activity · sustainable hours · jobs per week at that pace) → a **weekly capacity number** + one boundary sentence.
- **Use it:** quote delivery dates from it; it is a limit to revisit, not a ceiling forever.
- **AI:** Set A·C·F. S3. Context in: hours + capacity.
- **Context out:** `goals`, `challenges`.
- **Next:** I → 32 · E → 28 · N → 28

**23 · `profitable_service_basics`** *(planned seed · V1.1)* — **Outcomes:** rank offers by profit per hour, not by sales. **Do → result:** `offer_profit_ranking` → **ranked offer list**. **Use it:** promote the top, fix or drop the bottom; based on your numbers, not on a guarantee. **AI:** A·C, S1 (Business), context: offer lines. **Context out:** `offer`, `pricing_assumptions`. Slots after 18 (E light, N core).

**24 · `cash_flow_and_budgeting`** *(V1.1)* — **Outcomes:** see *when* money moves; plan for slow months and big bills. **Do → result:** `thirteen_week_cash_view` (`CALC`) → **cash calendar**. **Use it:** spot the tight week before it arrives; a plan, not a forecast. **AI:** A·E·D, S2, context: inflows/outflows. **Context out:** `operating_costs`. Slots after 19.

**25 · `payments_and_contact_channels`** *(V1.1)* — **Outcomes:** choose how customers pay and reach you; understand fees in plain words. **Do → result:** `channel_choice_sheet` → **payments + contact setup list**. **Use it:** fees and terms change — confirm on each provider's current page. **AI:** D·F, S2. **Context out:** `marketing_channels`. Slots after 21 in Starting.

**26 · `estimates_and_contracts_awareness`** *(JS · V1.1)* — **Outcomes:** know what a clear estimate contains; understand deposits and change orders; know when an attorney should review. **Do → result:** `estimate_outline_builder` → **estimate outline + questions for an attorney**. **Use it:** a clarity tool, not a legal contract. **AI:** E·D·F, S2. **Context out:** —. Slots after 17 (Starting); core for Services/Trades.

**27 · `ai_for_operations`** *(AI · V1.1)* — **Outcomes:** turn the learner's own steps into a checklist, a spreadsheet layout and message templates with an AI. **Do → result:** the AI conversation itself → **one reusable work template**. **Use it:** test it on a real day; you remain the editor. **AI:** A·B, S2, context: process from row 21. **Context out:** `challenges`. Slots after 21.

#### CP4 · HACERTE VISIBLE

**28 · `consistent_business_information`** *(published; upgrade)*
- **Outcomes:** create one master record of name, address/area, phone, hours, links; audit every place the business appears; schedule the review.
- **Why:** mismatched hours and phone numbers lose customers who were already convinced.
- **Hook / example:** one business, five signs, three different phone numbers. E: create the master before any profile; N: audit years of drift.
- **Do → result:** `master_business_info` (the record + a list of places to check) → **master info document**; links `checklist_business_info_consistency`.
- **Use it:** copy from it, never from memory; it feeds every profile lesson; review every 3–4 months.
- **AI:** Set A·D. S2. Context in: the master record (business info only).
- **Context out:** `business_name`, `city`, `service_area`.
- **Next:** I — · E → 29 · N → 29

**29 · `google_business_basics`** *(published; upgrade · PLAT)*
- **Outcomes:** claim/create the profile; complete it with real information; write a facts-only description; keep it current.
- **Why:** for many local searches the profile is seen before any website.
- **Hook / example:** a map pin with an empty card vs. a complete card. E: create and complete; N: refresh photos, hours, description.
- **Do → result:** `profile_description_builder` (what I offer · for whom · area · what is different · hours) → a **profile description made only of true facts**; links `checklist_google_business_setup`.
- **Use it:** paste it, then check it monthly; a complete profile helps people trust what they find — it does not guarantee ranking.
- **AI:** Set A·B·D. S2. Full proof set in §9.3. Context in: master record + value statement + description fields.
- **Context out:** `marketing_channels`, `what_i_sell`.
- **Next:** I — · E → 30 · N → 30

**30 · `yelp_basics`** *(PLAT)*
- **Outcomes:** decide whether Yelp matters for this business; claim and complete the page; respond without being pushed into paid ads.
- **Why:** in many U.S. categories customers check it whether or not the owner does.
- **Hook / example:** the business seen through a window the owner never looked through. E: claim + complete; N: respond and decide on paid offers with clear eyes.
- **Do → result:** `listing_decision_and_setup` (do my customers use it? · claim status · info from master record · response plan) → **claimed-page checklist**.
- **Use it:** a free presence to keep accurate; paid features are a separate decision to evaluate, not a requirement.
- **AI:** Set A·D. S2. Context in: master record + customer sentence.
- **Context out:** `marketing_channels`.
- **Next:** I — · E → 31 · N → 31

**31 · `website_basics`**
- **Outcomes:** decide if a website is needed now; know what a one-page site must contain; evaluate do-it-yourself vs. hiring.
- **Why:** many owners overpay for a site they did not need yet, or go years without the one page that would help.
- **Hook / example:** a decision tree with three exits — not yet · one page · full site. E: decide; N (deep): does the current site convert?
- **Do → result:** `website_decision_tree` → a **decision + a one-page content outline**.
- **Use it:** a brief to hand to whoever builds it, including an AI tool; prices and tools change — compare current options.
- **AI:** Set F·A·D. S2. Context in: customer sentence + master record + the decision answers.
- **Context out:** `marketing_channels`.
- **Next:** I — · E → 32 · N → 32

**32 · `choosing_social_platforms`**
- **Outcomes:** pick one platform from where the customer actually is; define what to post from real assets; set a pace that can be kept.
- **Why:** five abandoned profiles are worse than one alive.
- **Hook / example:** five doors, the customer walking through one. I (light): where will people look for me?; E: pick and set up one; N: keep, fix or close each profile.
- **Do → result:** `platform_fit_picker` (customer · what I can show · time per week) → **one chosen platform + a weekly rhythm**.
- **Use it:** a focus decision for the next 90 days; platform features change — check the platform's own guidance.
- **AI:** Set F·B·C. S3. Context in: customer sentence + the three answers.
- **Context out:** `marketing_channels`.
- **Next:** I → 56 · E → 33 · N → 33

**33 · `whatsapp_business_basics`** *(published; upgrade · PLAT)* — **Outcomes:** set up the business profile, welcome, away and quick replies; keep a response-time promise. **Why:** the first fast, clear reply often wins the customer. **Hook / example:** two phones, one replies in 5 minutes. **Do → result:** `message_templates_builder` → **welcome · away · 3 quick replies in the learner's voice**; links `checklist_whatsapp_weekly_response`. **Use it:** drafts to adjust after a week of real chats. **AI:** A·B, S2, context: FAQs + hours + brand voice. **Context out:** `marketing_channels`. **Next:** E → 34 · N → 34.

**34 · `reviews_and_customer_response`** *(published; upgrade)* — **Outcomes:** answer good and hard reviews calmly; never expose customer details; ask for reviews naturally. **Why:** future customers read the owner's reply more than the complaint. **Hook / example:** an angry review and two possible replies. **Do → result:** `review_response_drafter` → **two response drafts + an ask script**; links `template_review_response`. **Use it:** wait, then post; never promise or admit liability in public. **AI:** A·C, S2 (E light / N core), context: the review text **with names removed** + brand voice. **Context out:** `brand_voice`. **Next:** E → 35 · N → 35.

**35 · `local_seo_basics`** *(planned seed)* — **Outcomes:** explain local search in plain words; align profile, site and listings; choose the words customers type. **Why:** "near me" searches go to the businesses whose information agrees everywhere. **Hook / example:** three matching puzzle pieces — profile · listings · site. **Do → result:** `local_search_basics_check` → **a 5-item local visibility plan**. **Use it:** habits, not tricks; nobody can promise a ranking. **AI:** A·D·E, S2, context: master record + services + area. **Context out:** `service_area`, `marketing_channels`. **Next:** E → 42 · N → 42.

**36 · `instagram_facebook_profile_basics`** *(V1.1 · PLAT)* — profile that says what, where, how to order; **result:** completed profile checklist; **AI:** A·B. **37 · `short_video_basics`** *(planned · V1.1)* — three simple formats from real work; **result:** 5 video ideas + shot notes; **AI:** A·B. **38 · `product_photography_basics`** *(planned · V1.1)* — phone photos with light and angle; **result:** shot list; attaches `checklist_photo_shoot_prep`; **AI:** A·E. **39 · `qr_links_booking_orders`** *(V1.1)* — when a QR/link/booking tool helps; **result:** link map; **AI:** F·D. **40 · `email_and_sms_basics`** *(JS · V1.1)* — permission first, then useful messages; **result:** consent wording to verify + first message; **AI:** A·D·E. **41 · `ai_for_content_and_design`** *(AI · V1.1)* — text, image and video concepts from the brand sheet; **result:** one week of content drafted *and edited by the learner*; **AI:** A·C. Each follows the card standard above when authored; all slot after 32 in Starting/Business.

#### CP5 · CRECER

**42 · `marketing_fundamentals`**
- **Outcomes:** connect customer → message → place → offer → follow-up; choose one goal for 90 days; pick two channels, not ten.
- **Why:** marketing without a chain is random posting and wasted money.
- **Hook / example:** five chain links; the broken one is follow-up. E: a launch plan; N: fix the weakest link.
- **Do → result:** `one_page_marketing_plan` → a **90-day one-page plan**.
- **Use it:** a plan to run and measure, not a promise of sales; review at 90 days.
- **AI:** Set A·B·C. S2. Context in: customer + value statement + channels + capacity.
- **Context out:** `marketing_channels`, `goals`.
- **Next:** I — · E → 43 · N → 43

**43 · `advertising_fundamentals`** *(published; upgrade)* — **Outcomes:** one goal, one message, one action, one place, one measure before paying. **Why:** an ad with no goal cannot be judged. **Hook / example:** an arrow with one target vs. a handful thrown. **Do → result:** `ad_brief_builder` → **a one-ad brief**. **Use it:** run small, measure, then repeat or change; no ad guarantees sales. **AI:** A·C·D, S2, context: customer + value + the brief. **Context out:** `marketing_channels`, `goals`. **Next:** E → 44 · N → 44. *Leonix connection: factual mention that local print/digital placements exist as one option among several (no CTA).*

**44 · `referrals_basics`** *(planned seed)* — **Outcomes:** ask happy customers at the right moment, in the owner's own words. **Why:** the cheapest new customer is the one a happy customer sends. **Do → result:** `referral_ask_script` → **an ask script + the moment to use it**; attaches `template_referral_ask_script`. **Use it:** try it with three customers this week. **AI:** A·B, S2. **Context out:** `marketing_channels`. **Next:** E → 52 · N → 52.

**45 · `customer_retention`** *(V1.1 · N only)* — why customers leave quietly; **result:** a repeat-customer routine; **AI:** A·C, context: own customer patterns (`V-DATA`). **46 · `offers_and_promotions`** *(V1.1)* — promotions that do not erase profit; **result:** one offer with its margin check; **AI:** A·C. **47 · `media_mix_print_radio_digital`** *(V1.1 · N only)* — what each medium is good at and how to evaluate a package; **result:** a media-mix worksheet; **AI:** F·C·D; *Leonix connection: factual, from the capability registry only.* **48 · `simple_analytics`** *(planned · V1.1 · N only)* — five numbers worth watching; **result:** a monthly numbers page; **AI:** A·E·C. **49 · `hiring_readiness`** *(JS · V1.1 · N only)* — signs you are ready, what a first hire really costs, what to verify; **result:** readiness checklist + questions for HR/CPA; **AI:** D·E·F. **50 · `community_marketing_partnerships`** *(V2)* — real local partnerships; **AI:** A·F. **51 · `expansion_readiness`** *(JS · V2)* — systems, cash and the owner's life before a second location; **AI:** C·D·F.

#### CP6 · PROTEGER

**52 · `insurance_awareness`** *(JS)*
- **Outcomes:** name the common coverage types and what each is for; list the business's real risks; ask an agent the right questions and compare quotes.
- **Why:** one uninsured accident can end a healthy business; buying the wrong policy wastes money.
- **Hook / example:** an umbrella with labelled panels, one missing. E: before opening; N: annual review, new risks.
- **Do → result:** `risk_list_and_agent_questions` → a **risk list + question sheet for an insurance professional**.
- **Use it:** bring it to two agents; Leonix does not say what coverage you need or what is legally required where you operate.
- **AI:** Set D·E·F. S2. Context in: the risk list + business type + location.
- **Context out:** —
- **Next:** I — · E → 53 · N → 53

**53 · `tax_awareness`** *(JS)*
- **Outcomes:** explain sales tax, income tax and estimated payments in plain words; know which records matter; arrive at a tax professional prepared.
- **Why:** surprise tax bills and penalties are the most common avoidable shock in year one.
- **Hook / example:** a calendar with quiet months and four flagged dates — "ask your accountant about these". E: before the first sale; N: every January.
- **Do → result:** `tax_question_sheet` → **questions for a CPA/tax professional + a records list**.
- **Use it:** take it to the appointment; Leonix never calculates what you owe and dates/rules change — verify.
- **AI:** Set E·D·F. S2. "Explain the concepts with my situation; do not calculate my tax; help me prepare questions." Context in: business type + structure status + state.
- **Context out:** —
- **Next:** I — · E → 54 · N → 54

**54 · `employees_contractors_payroll`** *(JS)* — **Outcomes:** understand why employee vs. contractor is a legal question, not a preference; know what payroll involves; know who to ask *before* the first payment. **Why:** misclassification penalties can be severe. **Hook / example:** two people doing the same job, two very different obligations. **Do → result:** `first_helper_question_sheet` → **questions for a CPA/HR/labor agency**. **Use it:** ask before paying anyone regularly; rules vary by state. **AI:** E·D·F, S2 (E light · N core), `P-HR`. **Context out:** `team_size`. **Next:** E → 55 · N → 55.

**55 · `customer_data_protection`** *(planned seed · JS)* — **Outcomes:** list what customer data is kept and where; keep only what is needed; basic account safety; know privacy rules vary. **Why:** a leaked customer list breaks trust faster than any bad review. **Hook / example:** a notebook of customer numbers left on a counter. **Do → result:** `customer_data_inventory` → **a data inventory + three safety fixes**. **Use it:** fix the riskiest item this week; legal duties depend on location and size — verify. **AI:** A·D, S2, `P-SEC`. **Context out:** `things_ai_must_never_assume`. **Next:** E → 56 · N → 56.

**56 · `scams_and_online_safety`**
- **Outcomes:** recognise the common patterns (fake invoices, "Google/Yelp is calling", overpayment, fake agency notices, account-takeover links); pause and verify; protect the main accounts.
- **Why:** new business registrations and public profiles attract scams within weeks.
- **Hook / example:** an urgent message with four red flags circled. All journeys: core — Idea learners are targeted as soon as they register a name.
- **Do → result:** `spot_the_red_flags` (tap-to-reveal on sample messages) + `pause_and_verify_rule` → a **personal "pause and verify" rule**.
- **Use it:** tape it next to the phone; when in doubt, contact the organisation through a number *you* look up.
- **AI:** Set B·D (B = "quiz me on red flags"). S1. Current alerts live in the recurring layer (§20), not here.
- **Context out:** —
- **Next:** I, E, N → 57

**57 · `when_to_get_professional_help`**
- **Outcomes:** know what each kind of professional/agency does; prepare a one-page brief and questions; judge the cost against the risk.
- **Why:** arriving prepared makes professional help cheaper and better; avoiding it entirely is often the costlier choice.
- **Hook / example:** a map of nine doors (the `ProHelpType` list). I: before spending; E: before launch; N: before a big change.
- **Do → result:** `pro_meeting_prep` (reused from row 13: situation · decision · documents · questions) → a **meeting brief**.
- **Use it:** bring it; ask about fees first; Leonix names types of help, never a specific firm.
- **AI:** Set F·D. S3. Context in: the decision + the brief.
- **Context out:** `challenges`.
- **Next:** I, E, N → 60

**58 · `workers_comp_and_workplace_notices`** *(JS · V1.1)* — what these are, that rules depend on state and headcount, who to ask; **result:** question sheet for an insurer/labor agency; **AI:** D·E, `P-HR`. Slots after 54.

#### CP7 · SIGUIENTE PASO

**59 · `quarterly_business_checkup`** *(V1.1)* — **Outcomes:** run a 60-minute review of prices, profit, profile accuracy, offers, insurance/permit dates, capacity. **Do → result:** `quarterly_checkup` → **a dated one-page review with three actions**. **Use it:** repeat every quarter; compare to the last one; refresh your AI starter profile. **AI:** A·C·F, S1, `V-DATA`. **Context out:** `goals`, `challenges` (+ refresh of all). The evergreen anchor of the recurring layer (§20).

**60 · `how_to_move_forward`** *(capstone — depends on decision D7)*
- **Outcomes:** see what capability was gained; choose between doing it yourself, community help, the right professional, or Leonix where it genuinely helps.
- **Why:** education first, transparent options second, no fake urgency (Bible §26).
- **Hook / example:** four equal doors. Variants: the next pathway to continue on (Idea → Starting → Business).
- **Do → result:** `next_90_days_plan` (three actions · who helps with each · what I will verify) → a **90-day plan**.
- **Use it:** it is yours; Leonix is one option, not a requirement; the ecosystem map shows only capabilities the owner has certified as live.
- **AI:** Set F. S3. Context in: the plan + the learner's AI starter profile.
- **Context out:** `goals`.
- **Next:** bridge to the next pathway.

### 5.3 Media columns (V1 rows in full; V1.1/V2 inherit the pattern of their domain)

`read_structure` · `target_audio_minutes` · `worksheet_resource` (existing resource key, or NEW) · `glossary_terms` (existing seeded keys in `code`; *italic* = new term to add) · `reusable_social_or_shortform_angle`. Audio outlines are in §15.

| # | Read | Audio min | Worksheet / resource | Glossary | Short-form angle |
|---|---|---|---|---|---|
| 1 | R-FULL | 8 | NEW problem-statement sheet | *problema del cliente*, `glossary_target_customer` | "Nobody wakes up wanting your product." |
| 2 | R-FULL | 9 | Mi hoja (built) | `glossary_target_customer`, `glossary_lead`, `glossary_referral` | "Your customer is not everyone." |
| 3 | R-AI | 8 | NEW better-question card | *asistente de IA*, *contexto*, *prompt* (plain words) | Same question, two answers. |
| 4 | R-AI | 9 | NEW AI starter profile | *contexto de negocio* | "Page one of your AI notebook." |
| 5 | R-AI | 8 | NEW ask-before-you-trust list | *suposición*, *fuente oficial* | Fact · assumption · suggestion. |
| 6 | R-FULL | 9 | NEW conversation plan + notes | `glossary_lead`, *evidencia* | "Ask, don't pitch." |
| 7 | R-FULL | 8 | NEW alternatives grid | *competencia*, *alternativa* | "Your competitor might be 'do nothing'." |
| 8 | R-FULL | 8 | NEW value statement | *propuesta de valor*, `glossary_branding` | Slogan vs. specific promise. |
| 9 | R-FULL | 8 | NEW cheap-test plan | *validación*, `glossary_conversion` | "Ten pre-orders before the oven." |
| 11 | R-JS | 7 | NEW shortlist + to-verify list | *DBA / nombre ficticio*, *marca registrada* | Three crossed-out names. |
| 12 | R-FULL | 8 | NEW brand sheet | `glossary_branding` | Brand is not a logo. |
| 13 | R-JS | 9 | NEW CPA/attorney question sheet | *estructura legal*, *responsabilidad* | One figure vs. two. |
| 61 | R-JS | 8 | NEW tax-ID question sheet | *EIN*, *ITIN*, *identificación fiscal* | One card for you, one for the business. |
| 14 | R-JS | 9 | NEW layered research checklist | *licencia*, *permiso*, *zonificación* | City · county · state · federal. |
| 15 | R-JS | 7 | NEW bank question list | *cuenta de negocio*, `glossary_overhead` | One jar vs. two. |
| 16 | R-FULL | 8 | NEW startup cost list | `glossary_overhead`, *capital inicial* | The cost iceberg. |
| 17 | R-FULL | 9 | NEW unit-cost sheet | `glossary_profit_margin`, `glossary_overhead` | "Your $25 cake pays you $3." |
| 18 | R-FULL | 8 | `template_monthly_expense_tracker` | `glossary_profit_margin`, `glossary_overhead` | Full register, empty jar. |
| 19 | R-JS | 7 | NEW weekly records page | *categoría de gasto*, *comprobante* | Shoebox vs. one page. |
| 20 | R-FULL | 8 | NEW customer path map | `glossary_conversion`, `glossary_lead` | The cracked stepping stone. |
| 21 | R-FULL | 8 | NEW process sheet | `glossary_capacity`, *proceso (SOP)* | Five pegs beat a tangle. |
| 22 | R-FULL | 8 | NEW capacity check | `glossary_capacity` | The overflowing glass. |
| 28 | R-TOOL | 7 | `checklist_business_info_consistency` | `glossary_google_business_profile`, *NAP* | Three phone numbers, one business. |
| 29 | R-TOOL | 9 | `checklist_google_business_setup` | `glossary_google_business_profile`, `glossary_local_seo` | Empty pin vs. full card. |
| 30 | R-TOOL | 7 | NEW claimed-page checklist | `glossary_review` | The window you never looked through. |
| 31 | R-FULL | 8 | NEW one-page site outline | `glossary_landing_page`, `glossary_cta` | Not yet · one page · full site. |
| 32 | R-FULL | 8 | NEW platform-fit sheet | `glossary_engagement` | One door, not five. |
| 33 | R-TOOL | 7 | `checklist_whatsapp_weekly_response` | `glossary_whatsapp_business` | Five-minute reply. |
| 34 | R-FULL | 8 | `template_review_response` | `glossary_review` | Two replies to one angry review. |
| 35 | R-FULL | 9 | NEW local visibility plan | `glossary_seo`, `glossary_local_seo` | Three matching pieces. |
| 42 | R-FULL | 9 | NEW one-page marketing plan | `glossary_cta`, `glossary_lead`, `glossary_conversion` | The broken link is follow-up. |
| 43 | R-FULL | 8 | NEW ad brief | `glossary_cta`, `glossary_conversion` | One arrow, one target. |
| 44 | R-FULL | 7 | `template_referral_ask_script` | `glossary_referral` | Ask at the happy moment. |
| 52 | R-JS | 8 | NEW risk list + agent questions | *póliza*, *responsabilidad civil*, *deducible* | The umbrella with a missing panel. |
| 53 | R-JS | 9 | NEW tax question sheet | *impuesto sobre ventas*, *pagos estimados* | Four flagged dates. |
| 54 | R-JS | 8 | NEW first-helper question sheet | *empleado*, *contratista*, *nómina* | Same job, different obligations. |
| 55 | R-JS | 7 | NEW data inventory | `glossary_customer_data` | The notebook on the counter. |
| 56 | R-FULL | 8 | NEW pause-and-verify card | *phishing*, *suplantación* | Four red flags in one message. |
| 57 | R-FULL | 8 | NEW meeting brief | the nine professional types | Nine doors. |
| 60 | R-CAP | 8 | NEW 90-day plan | — | Four equal doors. |

### 5.4 Truth / safety columns (all 61 rows)

`Truth` = `evergreen_or_current` · `JS` = `jurisdiction_sensitive` · `Scope` = `jurisdiction_scope` (F federal · ST state · CO county · CI city · — none) · `Off.` = `official_verification_needed` · `Pro` = `professional_help_type` · `LV` = `last_verified_required` (a visible verified date is required once any maintained source is shown) · `Cad.` = `review_cadence`.

| # | lesson_key | Truth | JS | Scope | Off. | Pro | LV | Cad. |
|---|---|---|---|---|---|---|---|---|
| 1–2, 6–10 | CP1 business rows | EVG | N | — | N | — | N | E24 |
| 3–5 | AI foundation rows | EVG + PLAT (tools change) | N | — | N | all regulated types named in row 5 | N | ANN |
| 11 | `naming_your_business` | JS | **Y** | F · ST · CO | Y (name/DBA filing office, trademark search) | attorney · licensing_office | Y | ANN |
| 12 | `branding_basics` | EVG | N | — | N | — | N | E24 |
| 13 | `business_structure_concepts` | JS | **Y** | F · ST | Y (state business filing office, tax agency) | cpa_tax · attorney | Y | ANN |
| 61 | `ein_and_tax_id_awareness` | JS | **Y** | F · ST | Y (the federal tax agency's own application and help; state tax registrations) | cpa_tax | Y | ANN |
| 14 | `licenses_and_permits_awareness` | JS | **Y** | F · ST · CO · CI | Y (city/county/state licensing offices) | licensing_office · health_department · contractor_board | Y | ANN |
| 15 | `business_banking_basics` | JS | **Y** | F · ST | Y (the bank's own requirements) | financial · cpa_tax | N | ANN |
| 16–18, 20–25 | money/ops rows (not 19) | EVG | N | — | N | cpa_tax (light mention in 24) | N | E24 |
| 19 | `record_keeping_basics` | JS | **Y** | F · ST | Y (record-retention and deductibility rules) | cpa_tax | N | ANN |
| 26 | `estimates_and_contracts_awareness` | JS | **Y** | ST | Y (contract/deposit rules, contractor board) | attorney · contractor_board | N | ANN |
| 27, 41 | AI applied rows | EVG + PLAT | N | — | N | — | N | ANN |
| 28 | `consistent_business_information` | EVG | N | — | N | — | N | E24 |
| 29, 30, 33, 35, 36, 37, 39 | platform rows | PLAT | N | — | platform's own current help pages | — | N | P12 |
| 31, 32, 34, 38 | digital/social evergreen rows | EVG + PLAT | N | — | N | — | N | P12 |
| 40 | `email_and_sms_basics` | JS | **Y** | F · ST | Y (consent / anti-spam rules) | attorney | Y | ANN |
| 42–48, 50 | marketing/growth rows | EVG | N | — | N | — | N | E24 |
| 49 | `hiring_readiness` | JS | **Y** | F · ST · CI | Y (labor agency, wage rules) | hr · cpa_tax · attorney · labor_agency | Y | ANN |
| 51 | `expansion_readiness` | JS | **Y** | ST · CO · CI | Y (permits/leases for a new location) | attorney · cpa_tax | N | ANN |
| 52 | `insurance_awareness` | JS | **Y** | ST | Y (what is legally required where the learner operates) | insurance | Y | ANN |
| 53 | `tax_awareness` | JS | **Y** | F · ST · CI | Y (tax agencies; rates and dates) | cpa_tax | Y | ANN |
| 54 | `employees_contractors_payroll` | JS | **Y** | F · ST | Y (labor and tax agencies) | hr · cpa_tax · attorney · labor_agency | Y | ANN |
| 55 | `customer_data_protection` | JS | **Y** | F · ST | Y (privacy rules that apply to the business) | attorney | N | ANN |
| 56 | `scams_and_online_safety` | EVG (patterns) + CUR (alerts live in §20) | N | — | N | — | N | ANN |
| 57 | `when_to_get_professional_help` | EVG | N | — | N | all nine types (teaches the pattern) | N | E24 |
| 58 | `workers_comp_and_workplace_notices` | JS | **Y** | F · ST | Y (state labor agency, insurer) | insurance · labor_agency · hr | Y | ANN |
| 59 | `quarterly_business_checkup` | EVG | N | — | N | — | N | E24 |
| 60 | `how_to_move_forward` | CUR (capability registry) | N | — | N | all (options card) | Y (registry) | Q |

**What Leonix teaches vs. what must be verified, for every `JS = Y` row:** Leonix teaches the *concepts*, the *questions to ask*, *which type of office or professional answers them*, and *how to prepare*. The learner verifies the *actual requirement, rate, date, form or coverage* for their location and business model. No `JS` lesson may state a requirement as universal fact; every one carries the permanent line "Verifica los requisitos exactos donde operas antes de confiar en esta información" and the `pro_help` block (validator rule).

### 5.5 Product connection and delivery columns (all 61 rows)

`Lx` = `leonix_connection` · `Playbook` = `category_playbook_dependency` (R restaurant/food · S services/trades) · `Partner` = `partner_dependency` (**none** for every row: the school works with no partner; a partner block can only ever be added by configuration) · `An` = `analytics_priority` · `Pri` = `authoring_priority` (batch id from §18–§19) · `Deps` = `implementation_dependency` · `QA` = `owner_QA_required`.

| # | lesson_key | Lx | Playbook | An | Pri | Deps | QA |
|---|---|---|---|---|---|---|---|
| 1 | what_problem_do_you_solve | — | — | H | I-1 | ENG · SEED · ACT:problem_statement_builder · VIS | FULL |
| 2 | who_is_your_customer | — | R · S (example variants) | H | done | — | done |
| 3 | ai_basics_for_business | — | — | H | I-2 | ENG · SEED · ACT:bare_vs_context_compare | FULL |
| 4 | build_your_ai_business_coach | — | — | H | I-2 | ENG · SEED · ACT:ai_starter_profile_builder | FULL |
| 5 | ai_helps_you_verify | — | — | H | I-2 | ENG · SEED · ACT:fact_assumption_sorter | FULL |
| 6 | customer_conversations | — | R · S | H | I-1 | ENG · SEED · ACT:conversation_plan_builder | STD |
| 7 | know_your_competition | — | R · S | M | I-1 | ENG · SEED · ACT:alternatives_grid | STD |
| 8 | what_makes_you_different | — | — | M | I-3 | ENG · SEED · ACT:value_statement_builder | STD |
| 9 | validate_before_you_spend | — | — | M | I-3 | ENG · SEED · ACT:cheap_test_planner | STD |
| 10 | simple_business_model | — | — | L | V1.1-a | ENG · SEED | STD |
| 11 | naming_your_business | — | — | M | I-4 | ENG · SEED · ACT:name_shortlist_tester | LEGAL (attorney) |
| 12 | branding_basics | — | — | M | I-4 | ENG (row exists) · ACT:brand_basics_sheet | STD |
| 13 | business_structure_concepts | — | — | M | E-1 | ENG · SEED · ACT:pro_meeting_prep · TRUTH (later) | LEGAL (cpa_tax · attorney) |
| 61 | ein_and_tax_id_awareness | — | — | M | E-1 | ENG · SEED · ACT:pro_meeting_prep (reused) · TRUTH (later) | LEGAL (cpa_tax) |
| 14 | licenses_and_permits_awareness | — | R · S (largest overlay) | H | I-4 | ENG · SEED · ACT:permit_research_checklist · TRUTH (later) | LEGAL (licensing_office) |
| 15 | business_banking_basics | — | — | L | E-1 | ENG · SEED | LEGAL (cpa_tax) |
| 16 | startup_costs | — | R · S | H | I-3 | ENG · SEED · ACT:startup_cost_list (CALC optional) | STD |
| 17 | pricing_basics | — | R · S | H | I-3 | ENG · SEED · ACT:unit_cost_price_builder (CALC optional) | FULL |
| 18 | revenue_vs_profit | — | R · S | H | I-5 | ENG (row exists) · ACT:month_profit_snapshot | STD |
| 19 | record_keeping_basics | — | — | M | E-1 | ENG · SEED | LEGAL (cpa_tax) |
| 20 | customer_experience_basics | — | R · S | M | E-2 | ENG · SEED · ACT:customer_path_map | STD |
| 21 | simple_operations_and_follow_up | — | R · S | M | E-2 | ENG · SEED · ACT:process_steps_writer | STD |
| 22 | healthy_boundaries_and_capacity | — | — | M | I-5 | ENG (row exists) · ACT:weekly_capacity_check | STD |
| 23–27 | CP3 V1.1 rows | — | 23 R·S · 26 S | L | V1.1-a | ENG · SEED (23 exists) · 24 CALC | 26 LEGAL · others STD |
| 28 | consistent_business_information | factual: a Leonix business profile is one more place the master record must match | — | M | E-3 | ENG (row exists) | STD |
| 29 | google_business_basics | factual: a Leonix profile can link *to* Google reviews; never "instead of Google" | R · S | H | E-3 | ENG (row exists) · ACT:profile_description_builder | STD |
| 30 | yelp_basics | factual: same rule as 29 | R · S | M | E-3 | ENG · SEED | STD |
| 31 | website_basics | — | — | M | E-3 | ENG · SEED · ACT:website_decision_tree (decision_tree kind) | STD |
| 32 | choosing_social_platforms | — | R · S | M | I-5 | ENG · SEED · ACT:platform_fit_picker | STD |
| 33 | whatsapp_business_basics | — | — | M | E-3 | ENG (row exists) | STD |
| 34 | reviews_and_customer_response | factual: same rule as 29 | R · S | M | N-1 | ENG (row exists) | STD |
| 35 | local_seo_basics | — | S | M | N-1 | ENG (row exists) | STD |
| 36–41 | CP4 V1.1 rows | — | 37 R · 38 R·S · 39 R | L | V1.1-b | ENG · SEED (37, 38 exist) | 40 LEGAL · others STD |
| 42 | marketing_fundamentals | — | — | M | E-4 | ENG · SEED · ACT:one_page_marketing_plan | STD |
| 43 | advertising_fundamentals | factual: local print/digital placements exist as one option among several | — | M | E-4 | ENG (row exists) | STD |
| 44 | referrals_basics | — | S | L | N-1 | ENG (row exists) | STD |
| 45–48 | CP5 V1.1 rows | 47: factual, from CAPREG only | 45 R·S · 46 R | L | V1.1-c | ENG · SEED (48 exists) · 47 CAPREG | STD |
| 49 | hiring_readiness | — | R · S | L | V1.1-c | ENG · SEED · TRUTH | LEGAL (hr · cpa_tax) |
| 50–51 | V2 rows | — | — | L | V2 | ENG · SEED | 51 LEGAL |
| 52 | insurance_awareness | — | R · S | M | E-5 | ENG · SEED · TRUTH (later) | LEGAL (insurance) |
| 53 | tax_awareness | — | R | M | E-5 | ENG · SEED · TRUTH (later) | LEGAL (cpa_tax) |
| 54 | employees_contractors_payroll | — | R · S | M | N-2 | ENG · SEED · TRUTH (later) | LEGAL (hr · cpa_tax · attorney) |
| 55 | customer_data_protection | — | — | L | E-5 | ENG (row exists) | LEGAL (attorney) |
| 56 | scams_and_online_safety | — | — | M | I-6 | ENG · SEED · ACT:spot_the_red_flags (tap_reveal kind) | STD |
| 57 | when_to_get_professional_help | — | — | M | I-6 | ENG · SEED (reuses ACT:pro_meeting_prep) | STD |
| 58 | workers_comp_and_workplace_notices | — | R · S | L | V1.1-c | ENG · SEED · TRUTH | LEGAL |
| 59 | quarterly_business_checkup | — | — | M | V1.1-c | ENG · SEED | STD |
| 60 | how_to_move_forward | **transparent ecosystem map — only capabilities certified live in CAPREG** | — | H | I-6 | ENG · SEED · **CAPREG (D7)** | FULL |

**Every new row needs `SEED`.** The lesson page only renders a `published` database row, and the row's CHECK requires a non-empty `body_es`/`body_en`. A content batch therefore ships as (a) validated packages in code and (b) one additive, reviewed data seed inserting those rows with a plain-text rendition generated from the package (correctly accented). That seed is data-only, but it *is* a migration file — see owner decision OD-2.

---

## 6. Idea pathway order — *Tengo una idea* (20 V1 lessons)

Goal (Bible §4): *can this become a real business, and what should I understand before I spend heavily?* Tone: explore · question · define · challenge · validate cheaply.

| Order | # | lesson_key | CP | Depth | Urgency | Idea framing / recommended action |
|---|---|---|---|---|---|---|
| 1 | 1 | `what_problem_do_you_solve` | 1 | C | now | Name the problem before the product. Write the problem sentence. |
| 2 | 2 | `who_is_your_customer` | 1 | C | now | Who might feel it most? Write the customer sentence as a hypothesis. |
| 3 | 3 | `ai_basics_for_business` | 1 | C | now | You just used an AI template — learn to use it well. |
| 4 | 4 | `build_your_ai_business_coach` | 1 | C | now | Save your context once; stop retyping. |
| 5 | 5 | `ai_helps_you_verify` | 1 | C | now | Ask what it assumed before you believe it. |
| 6 | 6 | `customer_conversations` | 1 | C | now | Talk to three real people this week. |
| 7 | 7 | `know_your_competition` | 1 | C | soon | What do they use today instead of you? |
| 8 | 8 | `what_makes_you_different` | 1 | C | soon | A specific promise worth testing. |
| 9 | 9 | `validate_before_you_spend` | 1 | C | now | One cheap test, with a go/stop number decided in advance. |
| 10 | 16 | `startup_costs` | 2 | C | soon | The iceberg: what it really costs to begin. |
| 11 | 11 | `naming_your_business` | 2 | L | later | A shortlist only — nothing to file yet. |
| 12 | 12 | `branding_basics` | 2 | L | later | Three words for how it should feel. |
| 13 | 14 | `licenses_and_permits_awareness` | 2 | L | soon | What would I have to investigate where I live? |
| 14 | 17 | `pricing_basics` | 3 | L | soon | Could this ever pay for my time? |
| 15 | 18 | `revenue_vs_profit` | 3 | L | soon | A first look: would anything be left? |
| 16 | 22 | `healthy_boundaries_and_capacity` | 3 | L | later | The hours I really have. |
| 17 | 32 | `choosing_social_platforms` | 4 | L | later | Where will my customer look for me — when the time comes? |
| 18 | 56 | `scams_and_online_safety` | 6 | C | now | New registrations attract scams; pause and verify. |
| 19 | 57 | `when_to_get_professional_help` | 6 | C | soon | Know which door to knock on before committing money. |
| 20 | 60 | `how_to_move_forward` | 7 | C | — | Your first practical plan → bridge to *Estoy empezando*. |

CP5 has no Idea lesson by design ("todavía no toca anunciarte; primero valida tu idea"). V1.1 adds `simple_business_model` after order 9. **Minimum complete Idea set** (the smallest set that still honours every Idea topic in Bible §4): orders 1–10, 13–15, 18–20 = **16 lessons**; orders 11, 12, 16, 17 are the four "light" enrichments.

## 7. Starting pathway order — *Estoy empezando* (40 V1 lessons; every V1 lesson appears)

Goal: build the foundation correctly and become ready to serve customers. Tone: organise · research · prepare · turn decisions into launch actions.

CP1 → `who_is_your_customer` C · `what_problem_do_you_solve` L · `ai_basics_for_business` C · `build_your_ai_business_coach` C · `ai_helps_you_verify` C · `customer_conversations` C · `what_makes_you_different` C · `know_your_competition` L · `validate_before_you_spend` L (the soft opening is the test)
CP2 → `naming_your_business` C · `branding_basics` C · `business_structure_concepts` C · `ein_and_tax_id_awareness` C · `licenses_and_permits_awareness` C · `business_banking_basics` C · `startup_costs` C
CP3 → `pricing_basics` C · `revenue_vs_profit` C · `record_keeping_basics` C · `customer_experience_basics` C · `simple_operations_and_follow_up` C · `healthy_boundaries_and_capacity` C
CP4 → `consistent_business_information` C · `google_business_basics` C · `yelp_basics` C · `website_basics` C · `choosing_social_platforms` C · `whatsapp_business_basics` C · `reviews_and_customer_response` L · `local_seo_basics` L
CP5 → `marketing_fundamentals` C · `advertising_fundamentals` C · `referrals_basics` L
CP6 → `insurance_awareness` C · `tax_awareness` C · `employees_contractors_payroll` L · `customer_data_protection` C · `scams_and_online_safety` C · `when_to_get_professional_help` C
CP7 → `how_to_move_forward` C (launch plan → bridge to *Ya tengo un negocio*)

V1.1 slots (15): 10 · 23 · 24 · 25 · 26 · 27 · 36 · 37 · 38 · 39 · 40 · 41 · 46 · 58 · 59. Urgency "now" in Starting: 2, 13, 61, 14, 15, 17, 18, 28, 29, 52, 53.

## 8. Existing-business pathway order — *Ya tengo un negocio* (36 V1 lessons)

Goal: stronger, more modern, easier to discover, more sustainable. Tone: diagnose · compare periods · find patterns · systemise · measure. The spine order is fixed (CP1→CP7); **urgency** carries the Bible's "profitability first" emphasis: rows 18, 22, 28, 34 are flagged *now*, so the pathway page surfaces them as the recommended starting points even though CP1 is listed first.

CP1 → `who_is_your_customer` D · `ai_basics_for_business` C · `build_your_ai_business_coach` C · `ai_helps_you_verify` C · `customer_conversations` L · `know_your_competition` D · `what_makes_you_different` D
CP2 → `branding_basics` D · `business_structure_concepts` L · `ein_and_tax_id_awareness` L · `licenses_and_permits_awareness` L (renewal/expiry audit) · `business_banking_basics` L
CP3 → `pricing_basics` D · `revenue_vs_profit` C · `record_keeping_basics` C · `customer_experience_basics` C · `simple_operations_and_follow_up` C · `healthy_boundaries_and_capacity` C
CP4 → `consistent_business_information` C · `google_business_basics` C · `yelp_basics` C · `website_basics` D · `choosing_social_platforms` C · `whatsapp_business_basics` C · `reviews_and_customer_response` C · `local_seo_basics` C
CP5 → `marketing_fundamentals` C · `advertising_fundamentals` C · `referrals_basics` C
CP6 → `insurance_awareness` C · `tax_awareness` C · `employees_contractors_payroll` C · `customer_data_protection` C · `scams_and_online_safety` C · `when_to_get_professional_help` C
CP7 → `how_to_move_forward` C

V1.1 / V2 slots (20): 23 · 24 · 25 · 26 · 27 · 36–41 · 45–49 · 50 · 51 · 58 · 59. Not in this pathway: 1, 9, 10, 11, 16 (starting-from-zero topics).

The order in §6–§8 is compatible with the code-owned map in `learningJourneys.ts` today (published lessons keep their relative order in all three journeys), so adopting it is additive.

---

## 9. AI-development map

### 9.1 Template set per lesson (coded)

`Q1` questions-first · `CH` assumption challenge included · `Ver` verification instruction · `Priv` privacy boundary. "Context in" is listed on each card in §5.2.

| # | lesson_key | Set | Stage | Q1 | CH | Ver | Priv |
|---|---|---|---|---|---|---|---|
| 1 | what_problem_do_you_solve | A·B·C | S2 | Y | Y | V-REAL | P-STD |
| 2 | who_is_your_customer *(live)* | A·B·C | S3 | Y | Y | V-REAL · V-DATA (N) | P-STD |
| 3 | ai_basics_for_business | E·B | S3 | Y | N | V-REAL | P-STD |
| 4 | build_your_ai_business_coach | A·F | S3 | Y | N | V-REAL | P-FIN |
| 5 | ai_helps_you_verify | C·D | S2 | Y | Y | V-OFFICIAL · V-PRO | P-FIN |
| 6 | customer_conversations | A·B(practice)·C | S3 | Y | Y | V-REAL | P-STD |
| 7 | know_your_competition | D·A·C | S3 | Y | Y | V-REAL (visit/observe) | P-STD |
| 8 | what_makes_you_different | A·B·C | S3 | Y | Y | V-REAL | P-STD |
| 9 | validate_before_you_spend | A·C·F | S2 | Y | Y | V-REAL | P-STD |
| 10 | simple_business_model | A·E | S2 | Y | N | V-REAL | P-STD |
| 11 | naming_your_business | A·D | S2 | Y | N | V-OFFICIAL | P-STD |
| 12 | branding_basics | A·B·E | S3 | Y | N | V-REAL | P-STD |
| 13 | business_structure_concepts | D·E·F | S2 | Y | N | V-PRO · V-OFFICIAL | P-FIN |
| 61 | ein_and_tax_id_awareness | E·D·F | S2 | Y | N | V-PRO · V-OFFICIAL | P-FIN |
| 14 | licenses_and_permits_awareness | D·E | S3 | Y | N | V-OFFICIAL | P-STD |
| 15 | business_banking_basics | D·F | S2 | Y | N | V-OFFICIAL (the bank) | P-FIN |
| 16 | startup_costs | A·C | S2 | Y | Y | V-REAL (real quotes) | P-FIN |
| 17 | pricing_basics | A·C·E | S3 | Y | Y | V-REAL · V-DATA | P-FIN |
| 18 | revenue_vs_profit | A·E·C | S3 | Y | Y | V-DATA | P-FIN |
| 19 | record_keeping_basics | A·D·E | S2 | Y | N | V-PRO | P-FIN |
| 20 | customer_experience_basics | A·B·C | S2 | Y | Y | V-REAL | P-STD |
| 21 | simple_operations_and_follow_up | A·B·F | S2 | Y | N | V-DATA (try it two weeks) | P-STD |
| 22 | healthy_boundaries_and_capacity | A·C·F | S3 | Y | Y | V-DATA | P-STD |
| 23 | profitable_service_basics | A·C | S1 | Y | Y | V-DATA | P-FIN |
| 24 | cash_flow_and_budgeting | A·E·D | S2 | Y | N | V-DATA · V-PRO | P-FIN |
| 25 | payments_and_contact_channels | D·F | S2 | Y | N | V-PLATFORM | P-FIN |
| 26 | estimates_and_contracts_awareness | E·D·F | S2 | Y | N | V-PRO | P-STD |
| 27 | ai_for_operations | A·B | S2 | Y | N | V-DATA | P-STD |
| 28 | consistent_business_information | A·D | S2 | Y | N | V-PLATFORM | P-STD |
| 29 | google_business_basics | A·B·D | S2 | Y | N | V-PLATFORM | P-SEC |
| 30 | yelp_basics | A·D | S2 | Y | N | V-PLATFORM | P-SEC |
| 31 | website_basics | F·A·D | S2 | Y | Y | V-REAL | P-SEC |
| 32 | choosing_social_platforms | F·B·C | S3 | Y | Y | V-REAL · V-PLATFORM | P-SEC |
| 33 | whatsapp_business_basics | A·B | S2 | Y | N | V-PLATFORM | P-STD |
| 34 | reviews_and_customer_response | A·C | S2 | N (drafts from the pasted review) | Y | V-PLATFORM | P-STD (strip reviewer names) |
| 35 | local_seo_basics | A·D·E | S2 | Y | N | V-PLATFORM | P-STD |
| 36–41 | CP4 V1.1 rows | see cards | S2 | Y | 41 Y | V-PLATFORM (40: V-PRO) | P-STD / P-SEC |
| 42 | marketing_fundamentals | A·B·C | S2 | Y | Y | V-DATA | P-STD |
| 43 | advertising_fundamentals | A·C·D | S2 | Y | Y | V-DATA | P-STD |
| 44 | referrals_basics | A·B | S2 | Y | N | V-REAL | P-STD |
| 45–48, 50 | CP5 V1.1/V2 rows | see cards | S1–S2 | Y | 45, 46, 47, 48 Y | V-DATA | P-FIN where numbers appear |
| 49, 51 | people/expansion | D·E·F / C·D·F | S1 | Y | 51 Y | V-PRO · V-OFFICIAL | P-HR / P-FIN |
| 52 | insurance_awareness | D·E·F | S2 | Y | N | V-PRO · V-OFFICIAL | P-FIN |
| 53 | tax_awareness | E·D·F | S2 | Y | N | V-PRO · V-OFFICIAL | P-FIN |
| 54 | employees_contractors_payroll | E·D·F | S2 | Y | N | V-PRO · V-OFFICIAL | P-HR |
| 55 | customer_data_protection | A·D | S2 | Y | N | V-PRO | P-SEC |
| 56 | scams_and_online_safety | B·D | S1 | Y | N | V-OFFICIAL (contact the organisation yourself) | P-SEC |
| 57 | when_to_get_professional_help | F·D | S3 | Y | N | V-PRO | P-FIN |
| 58 | workers_comp_and_workplace_notices | D·E | S1 | Y | N | V-PRO · V-OFFICIAL | P-HR |
| 59 | quarterly_business_checkup | A·C·F | S1 | Y | Y | V-DATA | P-FIN |
| 60 | how_to_move_forward | F | S3 | Y | N | V-REAL | P-STD |

Template-type usage across the 40 V1 lessons: A 27 · B 14 · C 16 · D 20 · E 12 · F 14. Every V1 lesson has a set of two or three, except the capstone (one). No lesson uses all six.

### 9.2 What "stage-aware" means for each template type

| Type | Idea — *explore · question · validate* | Starting — *organise · prepare · launch actions* | Business — *diagnose · compare · find patterns* |
|---|---|---|---|
| A Develop | answers are hypotheses; "what am I still missing?"; end in what to test cheaply | answers are best assumptions; end in a short action + evidence list before launch; never invent dates, prices, requirements | answers are observations; start from "what real customer/sales information do I have?"; look for change and patterns |
| B Interview | asks about the problem and what is unknown | asks about first customers, reach and evidence so far | asks who really buys, who returns, who left, how they find you |
| C Challenge | how to check each weak assumption cheaply, before spending | what to check before launch, simplest way | what to review in sales and with current customers |
| D Research / verify | "what would I have to investigate?" checklist | the actual research plan: offices, questions, dates asked | renewal / change audit: "what changed since I last checked?" |
| E Vocabulary | terms explained with the idea as the example | terms explained with the launch as the example | terms explained with the learner's own numbers/process |
| F Next step | decide what to learn or test next | decide what to do this week, in order | decide what to fix first, by impact and effort |

Rules inherited from the flagship and enforced by the validator: every body uses every learner-context token; variants exist for `idea` / `empezando` / `negocio` plus a neutral body; the activity is the single source of truth for answers; blanks stay visible; privacy + verify on every template; no provider named; no claim of certainty.

### 9.3 Proof template sets beyond the customer lesson

The customer set (row 2) is live in `app/lib/business/learning/lessonPackage/prompts.ts`. Four more domains are written out here to prove the doctrine generalises. Each shows the **neutral body in ES and EN** plus the **stage deltas**; tokens in `[[ ]]` are filled locally from the lesson's activity. These are authoring references, not yet code.

#### Proof 1 — Pricing / money · `pricing_basics` (A · C · E)

Context block (from `unit_cost_price_builder`), shared by all three:

```text
ES                                              EN
Lo que vendo: [[offer]]                         What I sell: [[offer]]
Materiales por unidad: [[materials]]            Materials per unit: [[materials]]
Mi tiempo por unidad: [[minutes]] minutos       My time per unit: [[minutes]] minutes
Lo que quiero ganar por hora: [[hourly_value]]  What I want to earn per hour: [[hourly_value]]
Gastos fijos al mes: [[overhead]]               Fixed costs per month: [[overhead]]
Lo que cobran las alternativas: [[alternatives]]  What the alternatives charge: [[alternatives]]
El precio que estoy pensando: [[price]]         The price I am considering: [[price]]
```

**A — Desarrolla mi precio / Develop my price**
ES: "Tengo un negocio pequeño en [[city]]. Mi etapa: [[stage]]. Estos son mis números. Son mis mejores estimaciones, no datos exactos: {contexto}. Actúa como un mentor de negocios paciente y usa lenguaje sencillo. 1. Primero pregúntame por los costos que probablemente olvidé. No inventes cifras: si falta un número, pídemelo. 2. Después muéstrame, paso a paso y con mis números, cuánto me queda por unidad con el precio que estoy pensando. 3. Dime qué dos números debería confirmar con cotizaciones o recibos reales antes de confiar en este precio. No me digas cuánto cobra 'el mercado' si yo no te lo di."
EN: "I have a small business in [[city]]. My stage: [[stage]]. These are my numbers. They are my best estimates, not exact data: {context}. Act as a patient business mentor and use plain language. 1. First ask me about the costs I probably forgot. Do not invent figures: if a number is missing, ask me for it. 2. Then show me, step by step and with my numbers, what is left per unit at the price I am considering. 3. Tell me which two numbers I should confirm with real quotes or receipts before I trust this price. Do not tell me what 'the market' charges unless I gave it to you."
*Stage deltas —* Idea: opener "Estoy pensando en empezar… todavía no vendo"; step 3 → "dime qué probar con personas reales antes de gastar: ¿pagarían esto?". Starting: step 3 → "ayúdame a fijar un precio de lanzamiento y cuándo revisarlo". Business: context line added "Lo que vendí el mes pasado: [[units_sold]]"; step 1 → "pregúntame qué registros reales de costos y ventas tengo"; step 3 → "dime qué producto revisar primero y qué comprobar en mis ventas reales".

**C — Reta mi precio / Challenge my price**
ES: "{apertura} {contexto} No quiero que me des la razón. 1. Separa lo que sé (con recibo o cotización) de lo que estoy suponiendo. 2. Señala las 2 suposiciones que más cambiarían mi ganancia si estuvieran mal. 3. Dime cómo comprobar cada una esta semana. No presentes precios de mercado como hechos."
EN: "{opener} {context} I do not want you to agree with me. 1. Separate what I know (from a receipt or a quote) from what I am assuming. 2. Point out the 2 assumptions that would change my profit the most if they were wrong. 3. Tell me how to check each one this week. Do not present market prices as facts."

**E — Enséñame el vocabulario / Teach me the vocabulary**
ES: "{apertura} {contexto} Explícame con mis propios números, en lenguaje sencillo y una a la vez: costo, precio, margen, gastos fijos y punto de equilibrio. Después de cada una, pregúntame si quedó clara antes de seguir. No calcules impuestos."
EN: "{opener} {context} Using my own numbers, in plain language and one at a time, explain: cost, price, margin, fixed costs, and break-even. After each one, ask me whether it is clear before continuing. Do not calculate taxes."
Verify: `V-REAL` + `V-DATA`. Privacy: `P-FIN`.

#### Proof 2 — Licensing / research · `licenses_and_permits_awareness` (D · E) — *jurisdiction-sensitive*

Context block (from `permit_research_checklist`): `[[business_type]]` · `[[city]]`, `[[county]]`, `[[state]]` · `[[location_type]]` (home / commercial / mobile) · `[[employees]]` (yes / no / later) · `[[special_activities]]` (food, alcohol, children, vehicles, licensed trade…).

**D — Ayúdame a investigar / Help me research**
ES: "Voy a operar un negocio de [[business_type]] en [[city]], [[county]], [[state]]. Tipo de local: [[location_type]]. Empleados: [[employees]]. Actividades especiales: [[special_activities]]. Mi etapa: [[stage]]. Ayúdame a armar una lista de investigación, NO una lista de requisitos. 1. Primero pregúntame lo que necesites saber de mi negocio. 2. Organiza las áreas que debería investigar en cuatro niveles: ciudad, condado, estado y federal. 3. Para cada área dime qué tipo de oficina suele responderla y qué pregunta exacta debería hacer. 4. No me digas que 'definitivamente necesito' algo a menos que puedas señalar una fuente oficial vigente; si no puedes, márcalo como 'por verificar'. 5. Termina con una tabla para que yo anote: a quién pregunté, fecha y respuesta."
EN: "I am going to operate a [[business_type]] business in [[city]], [[county]], [[state]]. Type of location: [[location_type]]. Employees: [[employees]]. Special activities: [[special_activities]]. My stage: [[stage]]. Help me build a research list, NOT a list of requirements. 1. First ask me whatever you need to know about my business. 2. Organize the areas I should research into four levels: city, county, state, and federal. 3. For each area tell me what type of office usually answers it and the exact question I should ask. 4. Do not tell me I 'definitely need' something unless you can point to a current official source; if you cannot, mark it 'to verify'. 5. End with a table where I can write down: who I asked, the date, and the answer."
*Stage deltas —* Idea: "Estoy pensando en abrir… todavía no voy a tramitar nada; quiero saber qué tendría que investigar y qué podría costar tiempo o dinero". Starting: as above, plus "ordena la lista por lo que debo resolver antes de abrir". Business: "Ya opero… ayúdame a auditar qué licencias y permisos debería revisar por renovación, vencimiento o cambios en mi negocio; pregúntame primero qué tengo hoy y cuándo lo obtuve."

**E — Enséñame el vocabulario / Teach me the vocabulary**
ES: "{mismo contexto} Explícame en lenguaje sencillo, una a la vez, qué significan: licencia de negocio, permiso, zonificación, inspección y nombre ficticio (DBA). Usa mi tipo de negocio como ejemplo. Aclara siempre que las reglas cambian según el lugar y dime a qué tipo de oficina preguntar."
EN: "{same context} In plain language, one at a time, explain what these mean: business license, permit, zoning, inspection, and fictitious business name (DBA). Use my type of business as the example. Always make clear that rules vary by location and tell me which type of office to ask."
Verify: `V-OFFICIAL` (mandatory line: "Solo cuenta la respuesta de la oficina. Anota la fecha."). Privacy: `P-STD`. No "Develop my answer" template on purpose: an AI must not "develop" a legal requirement.

#### Proof 3 — Google / digital presence · `google_business_basics` (A · B · D)

Context (from `profile_description_builder` + the master record of row 28): `[[business_name]]` · `[[offer]]` · `[[who]]` · `[[service_area]]` · `[[difference]]` · `[[hours]]`.

**A — Redacta mi descripción / Draft my description**
ES: "Ayúdame a redactar la descripción de mi perfil de negocio usando SOLO estos datos, que son verdaderos: {contexto}. 1. Si falta un dato importante, pregúntamelo; no lo inventes. 2. Escribe 2 versiones cortas y claras, en lenguaje sencillo, sin exagerar ni prometer resultados. 3. No agregues premios, años de experiencia, certificaciones ni servicios que yo no mencioné. 4. Al final, enumera cada afirmación para que yo confirme que es cierta antes de publicarla."
EN: "Help me draft the description for my business profile using ONLY these facts, which are true: {context}. 1. If an important fact is missing, ask me; do not invent it. 2. Write 2 short, clear versions in plain language, without exaggerating or promising results. 3. Do not add awards, years of experience, certifications, or services I did not mention. 4. At the end, list every claim so I can confirm it is true before I publish it."
*Stage deltas —* Starting: "Estoy por abrir: no tengo reseñas todavía; ayúdame a describir lo que ofrezco sin aparentar trayectoria". Business: "Ya tengo un perfil: pídeme mi descripción actual y dime qué está desactualizado o poco claro antes de reescribir". (Idea: lesson not in pathway.)

**B — Entrevístame / Interview me:** "No escribas nada todavía. Hazme unas 5 preguntas, una a la vez, para descubrir qué hace diferente a mi negocio en palabras que un cliente usaría. Después resume solo lo que yo dije." / "Do not write anything yet. Ask me about 5 questions, one at a time, to discover what makes my business different in words a customer would use. Then summarize only what I said."

**D — Verifica con la plataforma / Verify with the platform:** "Dame una lista de lo que debería confirmar directamente en la ayuda oficial de la plataforma antes de publicar (categorías disponibles, reglas del nombre, fotos, verificación). No me digas cómo funciona hoy con certeza: las funciones cambian. Dime qué buscar." / "Give me a list of what I should confirm directly in the platform's official help before publishing (available categories, name rules, photos, verification). Do not tell me with certainty how it works today: features change. Tell me what to look for."
Verify: `V-PLATFORM`. Privacy: `P-SEC` (never paste login, verification codes or screenshots of the account).

#### Proof 4 — Operations / growth · `simple_operations_and_follow_up` (A · B · F)

Context (from `process_steps_writer`): `[[job_name]]` · `[[my_steps]]` (the learner's own numbered steps) · `[[who_does_it]]` · `[[tools]]` · `[[what_goes_wrong]]` · `[[follow_up_rule]]`.

**A — Convierte mis pasos en un proceso / Turn my steps into a process**
ES: "Este es un trabajo que se repite en mi negocio: [[job_name]]. Así lo hago hoy, con mis palabras: [[my_steps]]. Lo hace: [[who_does_it]]. Uso: [[tools]]. Lo que suele salir mal: [[what_goes_wrong]]. Mi etapa: [[stage]]. 1. Primero pregúntame por los pasos que parecen faltar. No los agregues tú. 2. Ordena MIS pasos en una lista clara con quién hace cada uno y qué significa 'terminado'. 3. Sugiere como máximo 2 mejoras y márcalas como sugerencias, separadas de lo que yo dije. 4. Dame una versión de una página que pueda imprimir y probar dos semanas."
EN: "This is a job that repeats in my business: [[job_name]]. This is how I do it today, in my words: [[my_steps]]. Who does it: [[who_does_it]]. I use: [[tools]]. What usually goes wrong: [[what_goes_wrong]]. My stage: [[stage]]. 1. First ask me about the steps that seem to be missing. Do not add them yourself. 2. Put MY steps into a clear list with who does each one and what 'done' means. 3. Suggest at most 2 improvements and label them as suggestions, separate from what I said. 4. Give me a one-page version I can print and try for two weeks."
*Stage deltas —* Starting: "Todavía no abro: es el proceso que planeo; ayúdame a encontrar lo que no he pensado antes del primer cliente". Business: "Ya lo hago cada semana: pregúntame dónde se atora, cuánto tarda y qué pasa cuando yo no estoy".

**B — Entrevístame sobre mi seguimiento / Interview me about my follow-up:** "Hazme 5 preguntas, una a la vez, sobre qué pasa hoy cuando alguien pregunta y no compra. Al final escribe mi regla de seguimiento con mis propias palabras." / "Ask me 5 questions, one at a time, about what happens today when someone asks and does not buy. At the end, write my follow-up rule in my own words."

**F — Ayúdame a decidir qué sigue / Help me decide the next step:** "Con lo que te conté, ayúdame a elegir UNA sola mejora para las próximas dos semanas. Pregúntame cuánto tiempo y dinero tengo antes de proponerla, y dime cómo sabré si funcionó." / "With what I told you, help me choose ONE single improvement for the next two weeks. Ask me how much time and money I have before proposing it, and tell me how I will know whether it worked."
Verify: `V-DATA` ("pruébalo dos semanas y anota qué pasó"). Privacy: `P-STD` (no customer or employee names in the steps).

**What the proofs show:** the six template types cover research-heavy (`D·E`), numbers-heavy (`A·C·E`), platform (`A·B·D`) and operational (`A·B·F`) lessons with the same mechanics as the customer lesson — activity answers as context, questions first, no invention, stage deltas as small swaps of opener and final step. The jurisdiction proof deliberately has **no** "Develop" template.

---

## 10. My Business Context map — *Mi contexto de negocio*

No storage is built. This map only records **where a field can first be produced and where it is later updated**, so that a future "Copy my business context for my AI" action has a defined source for every field. Fields are provider-neutral, live on the learner's device until an explicit save exists, and are never turned into a hidden profile (Bible §44A-G).

| Context field | First produced in | Updated / refined in |
|---|---|---|
| `business_name` | 11 `naming_your_business` | 28 `consistent_business_information` · 4 (profile) |
| `business_idea` | 1 `what_problem_do_you_solve` | 9 · 10 |
| `industry` | 4 `build_your_ai_business_coach` | 14 |
| `city` | 2 `who_is_your_customer` (AI lab field) | 14 · 28 |
| `service_area` | 14 `licenses_and_permits_awareness` | 28 · 35 |
| `business_stage` | 2 (from the journey, editable) | 4 · 59 |
| `what_i_sell` | 2 `who_is_your_customer` | 29 · 23 |
| `customer` | 2 `who_is_your_customer` | 6 (evidence) · 45 |
| `problem_solved` | 1 `what_problem_do_you_solve` | 2 · 6 |
| `offer` | 8 `what_makes_you_different` | 10 · 17 · 23 · 46 |
| `competitors` | 7 `know_your_competition` | 47 |
| `differentiation` | 8 `what_makes_you_different` | 12 · 29 |
| `pricing_assumptions` | 17 `pricing_basics` | 9 (tested) · 10 · 23 · 46 |
| `startup_costs` | 16 `startup_costs` | — |
| `operating_costs` | 18 `revenue_vs_profit` | 19 · 24 |
| `brand_voice` | 12 `branding_basics` | 33 · 34 · 41 |
| `marketing_channels` | 32 `choosing_social_platforms` | 25 · 29 · 30 · 31 · 33 · 35 · 42 · 43 · 44 |
| `goals` | 4 `build_your_ai_business_coach` | 9 · 22 · 42 · 43 · 59 · 60 |
| `challenges` | 4 `build_your_ai_business_coach` | 6 · 20 · 21 · 22 · 27 · 57 · 59 |
| `team_size` | 4 `build_your_ai_business_coach` | 21 · 54 |
| `things_ai_must_never_assume` | 3 `ai_basics_for_business` | 4 · 5 · 55 |

All **21** fields have a producing lesson inside V1. Rows 13, 61, 15, 52, 53, 54, 58 deliberately produce **no** context field: legal, tax, insurance and employment facts are never stored as reusable AI context — the learner's question sheets are, by design, taken to a professional instead. Row 4 is the assembly point and row 59 the quarterly refresh.

---

## 11. Jurisdiction-sensitive lesson register (15 lessons)

V1 maintained-source scope (decision D5): **U.S. federal · California · Santa Clara County · San José**. `MS` = a maintained current source is eventually required. No source is researched or seeded in this gate. Until the maintained-source model exists (`TRUTH`), these lessons publish as *investigation education only* — they link to no "current official" source and show no "verified" badge.

| # | lesson_key | Class | What Leonix teaches | What the learner must verify | Source / professional TYPE | MS | Cadence |
|---|---|---|---|---|---|---|---|
| 11 | `naming_your_business` | V1 | how names are tested; that DBA/fictitious-name, trademark, domain and handle checks exist | availability and filing rules for their name and location | county/state filing office · trademark search · attorney | Y | ANN |
| 13 | `business_structure_concepts` | V1 | what the common structures are and what differs | which structure fits; filing steps; state fees | cpa_tax · attorney · federal and state tax/business agencies | Y | ANN |
| 61 | `ein_and_tax_id_awareness` | V1 | what a tax ID / EIN is and is used for; who issues it; how it differs from personal identification and state registrations | whether they need one, how to apply, any cost, state-level registrations | cpa_tax · the federal tax agency's own application/help · state tax agency | Y | ANN |
| 14 | `licenses_and_permits_awareness` | V1 | the four levels; how to find the office; how to ask and record answers | every actual license, permit, zoning or inspection requirement | city · county · state licensing offices · health department · contractor board | Y | ANN |
| 15 | `business_banking_basics` | V1 | why to separate money; what banks commonly ask; which fees matter | documents and fees at the chosen bank; implications for their structure | the bank · cpa_tax | N | ANN |
| 19 | `record_keeping_basics` | V1 | a weekly habit and simple categories | how long to keep records; what is deductible | cpa_tax | N | ANN |
| 26 | `estimates_and_contracts_awareness` | V1.1 | what a clear estimate contains; deposits; change orders | contract, deposit and cancellation rules; licensed-trade limits | attorney · contractor board | N | ANN |
| 40 | `email_and_sms_basics` | V1.1 | permission first; useful messages | consent and anti-spam rules for email and text | attorney | Y | ANN |
| 49 | `hiring_readiness` | V1.1 | signs of readiness; the true cost of a first hire | wage, hour, notice and registration rules | hr · cpa_tax · attorney · labor agency | Y | ANN |
| 51 | `expansion_readiness` | V2 | systems, cash and owner capacity before scaling | permits, leases and rules for a new location | attorney · cpa_tax | N | ANN |
| 52 | `insurance_awareness` | V1 | coverage types; how to list risks; how to compare quotes | what coverage is legally required and what fits their risks | insurance professional | Y | ANN |
| 53 | `tax_awareness` | V1 | sales tax, income tax, estimated payments as concepts; which records matter | rates, dates, registrations, what they owe | cpa_tax · tax agencies | Y | ANN |
| 54 | `employees_contractors_payroll` | V1 | why classification is a legal question; what payroll involves | classification of their worker; payroll registrations and withholdings | hr · cpa_tax · attorney · labor agency | Y | ANN |
| 55 | `customer_data_protection` | V1 | data inventory; keep less; account safety | which privacy duties apply to a business of their size and location | attorney | N | ANN |
| 58 | `workers_comp_and_workplace_notices` | V1.1 | what these are; that rules depend on state and headcount | whether and what coverage/notices apply | insurer · state labor agency · hr | Y | ANN |

V1 contains **10** of the 15 (11, 13, 61, 14, 15, 19, 52, 53, 54, 55). The Idea pathway touches only **2** (11 and 14, both *light*: "what would I have to investigate?"), which is why the Idea batch can ship before the maintained-source model.

## 12. Professional-help register

16 lessons carry a `pro_help` block: the 15 above plus row 57, which teaches the pattern itself. Light professional mentions (no block): 5, 24, 60.

| Professional / agency type | Lessons where it appears |
|---|---|
| `cpa_tax` | 13 · 61 · 15 · 19 · 24 (mention) · 49 · 51 · 53 · 54 · 57 |
| `attorney` | 11 · 13 · 26 · 40 · 49 · 51 · 54 · 55 · 57 |
| `insurance` | 52 · 58 · 57 |
| `licensing_office` | 11 · 14 · 57 |
| `health_department` | 14 · 57 · Restaurant playbook |
| `labor_agency` | 49 · 54 · 58 · 57 |
| `financial` | 15 · 57 |
| `contractor_board` | 14 · 26 · 57 · Services/Trades playbook |
| `hr` | 49 · 54 · 58 · 57 |

Block content is always: what Leonix can teach · what to verify · which *type* of help · how to prepare · questions to bring. Never a named firm, never a referral, never a fee quote. Partner help, if one ever exists, is a separate configurable block (Bible §24) — **no row depends on it**.

## 13. Restaurant / Food overlay map

Overlays are example variants, "para restaurantes" callouts and investigate-items attached to universal lessons through the `categories[]` block filter — never a duplicated lesson. **24 universal targets:**

| Universal lesson | Restaurant overlay |
|---|---|
| 2 · 6 · 7 | customer/competition examples: lunch crowd vs. families vs. catering; "competitor = cooking at home / the taco truck" |
| 14 | the largest overlay — areas to *investigate*: food-handler and food-manager certification concepts, health permit and inspection, kitchen/commissary rules, zoning/occupancy, fire/safety, signage, accessibility, alcohol licensing **only if** selling alcohol |
| 16 · 17 · 18 · 23 | equipment and deposits; plate cost; food cost and labor cost as shares of price; menu items that sell but do not earn |
| 20 · 21 | order → kitchen → table/pickup path; opening/closing and prep routines; waste |
| 29 · 30 · 34 | menus, photos, hours and ordering links in profiles; food-specific review replies |
| 32 · 37 · 38 · 39 | food photography and short video; QR menus, reservations, online ordering links |
| 45 · 46 | regulars and slow-day offers with a margin check |
| 49 · 54 · 58 | tips/wage considerations, scheduling, notices — all "investigate and verify" |
| 52 · 53 | food-business risks; sales tax on prepared food as a question for a tax professional |

**Genuinely category-specific lessons (not overlays), V1.1:** `restaurant_food_cost_and_menu_pricing` · `restaurant_delivery_platform_economics` · `restaurant_permits_how_to_investigate` (a guided walk through the row-14 overlay; needs `TRUTH`) · `restaurant_photos_and_social`. Four lessons; everything else is an overlay.

## 14. Services / Trades overlay map

**23 universal targets:**

| Universal lesson | Services/Trades overlay |
|---|---|
| 2 · 6 · 7 | homeowners vs. property managers vs. businesses; "competitor = do it myself / a relative" |
| 14 | areas to investigate: trade/contractor licensing *where applicable*, bonding questions, local business license, vehicle/signage rules |
| 16 · 17 · 18 · 23 | tools and vehicle; hourly vs. per-job pricing; travel time; jobs that fill the week but lose money |
| 20 · 21 | estimate → schedule → job → follow-up path; emergency-contact expectations; job checklists |
| 26 | core for this category: estimates, deposits, change orders |
| 29 · 30 · 34 · 35 | service-area settings, before/after photos, review replies, local search by area |
| 32 · 38 | before/after content; job photos |
| 44 · 45 | referral asks after a finished job; repeat/maintenance customers |
| 49 · 54 · 58 | helpers vs. employees, workers' compensation *where applicable* |
| 52 | general liability, commercial auto, tools coverage — as questions for an insurance professional |

**Genuinely category-specific lessons, V1.1:** `trades_estimates_deposits_change_orders` · `trades_job_costing` · `trades_licensing_how_to_investigate` (needs `TRUTH`) · `trades_lead_follow_up`. Four lessons.

Both playbooks reuse one data model and one page component; every later category (beauty, auto, retail, home-based, classes…) is data only. Playbooks are V1.1 — they do not block V1.

## 15. Audio planning map (V1)

Every script follows the nine-segment structure proven in the flagship (hook · what you'll learn · story · concept · reflective question with a pause · action · *parked* instruction · recap · next) and is written for the ear, never read from the page. Target 7–9 minutes. `Handling`: **STD** standard · **WS** the activity is a worksheet/calculator — the script teaches the *thinking* with one worked story and sends the numbers to the parked segment · **JS** must never state a requirement, rate or date; teaches what to ask and who to ask, and is re-recorded when the lesson's review date passes · **PLAT** avoids click-by-click instructions (they change) and teaches what to look for.

| # | Audio teaching goal | Conversational outline (story → principle → action) | Min | Handling |
|---|---|---|---|---|
| 1 | hear the difference between a product and a problem | Marco's "everyone hates laundry" → people pay to end a pain → say your problem in one breath | 8 | STD |
| 2 | *(written)* customer ≠ everyone | Rosa → who · problem · where · why you → the sentence | 9 | STD |
| 3 | lose the fear, lose the blind trust | Luis asks twice → context, role, constraint → rewrite one question | 8 | STD |
| 4 | understand why saved context changes every answer | Rosa's page one → the 12 fields, slowly → build it when parked | 9 | WS |
| 5 | make "what did you assume?" a reflex | Marco and the permit that did not exist → fact · assumption · suggestion → three questions to ask | 8 | STD |
| 6 | rehearse asking instead of pitching | Rosa's three neighbours → listen for their words → who will you talk to this week? | 9 | STD |
| 7 | widen what "competitor" means | the customer at the fork, "do nothing" included → compare on what *they* value → visit one alternative | 8 | STD |
| 8 | tell a slogan from a promise | ten identical storefronts → for whom · result · unlike · because → say yours aloud | 8 | STD |
| 9 | make a small test feel safer than a big leap | ten pre-orders before the oven → decide the go number first → your test this week | 8 | STD |
| 11 | avoid the expensive rename | three crossed-out names → say it, spell it, check it → what to verify, with whom | 7 | JS |
| 12 | brand is how it feels everywhere | one business shown twice → three words, two colours, one voice → look at your own signs | 8 | STD |
| 13 | arrive prepared at a CPA/attorney | one figure vs. two → what differs between structures, no recommendation → six facts and your questions | 9 | JS |
| 61 | a number for the business, not a mystery | Rosa asked for "her EIN" at the bank → what a tax ID is for, who issues it, what it is not → what to ask, and to use only the official source | 8 | JS |
| 14 | replace fear of permits with a research method | the four layers → which office answers what → write down who you asked and when | 9 | JS |
| 15 | separate the jars | the owner who could not tell if she was earning → why separation matters → two banks, one question list | 7 | JS |
| 16 | see the iceberg under the oven | Rosa's forgotten three slow months → one-time vs. monthly vs. runway → list it when parked | 8 | WS |
| 17 | price without apology | the $25 cake that paid $3 → cost · time · overhead · profit → your one product, when parked | 9 | WS |
| 18 | busy is not profitable | full register, empty jar → revenue minus every cost → one month, honestly | 8 | WS |
| 19 | a 20-minute weekly habit | the shoebox in March → one page, a few categories → pick your day; ask your accountant what to keep | 7 | JS |
| 20 | walk your own customer path | the order lost between "how much?" and the reply → five moments → be your own customer today | 8 | STD |
| 21 | get the business out of your head | the day Marco was sick → steps, owner, "done" → write one job when parked | 8 | WS |
| 22 | permission to say "not yet" | the overflowing glass → hours, quality, health → your weekly number | 8 | STD |
| 28 | one truth, copied everywhere | three phone numbers → the master record → check two places today | 7 | STD |
| 29 | what a stranger sees first | the empty pin → complete, true, current → what to look for in the official help | 9 | PLAT |
| 30 | the window you never looked through | customers already talking → claim, complete, respond; paid is a separate choice → look yourself up | 7 | PLAT |
| 31 | maybe not yet, maybe one page | the owner who paid for a site nobody visits → three exits → what one page must say | 8 | STD |
| 32 | one living profile beats five dead ones | five doors → where is your customer → a rhythm you can keep | 8 | PLAT |
| 33 | the five-minute reply | two phones → welcome, away, quick replies → your three most asked questions | 7 | PLAT |
| 34 | reply for the next reader | one angry review, two replies → calm, brief, private details offline → wait before answering | 8 | STD |
| 35 | agree with yourself everywhere | three matching pieces → the words customers type → no one can promise a ranking | 9 | PLAT |
| 42 | the chain, and its broken link | customer → message → place → offer → follow-up → one goal for 90 days | 9 | STD |
| 43 | one arrow, one target | the ad that tried to do everything → goal · message · action · place · measure → start small | 8 | STD |
| 44 | ask at the happy moment | the customer who would have recommended you, if asked → your words, the right moment → three asks this week | 7 | STD |
| 52 | the missing umbrella panel | the accident that ended a good business → coverage types as questions → list your risks; ask two agents | 8 | JS |
| 53 | no surprise in April | four flagged dates → concepts, not calculations → what to bring to a tax professional | 9 | JS |
| 54 | same job, different obligations | the helper paid in cash → why it is a legal question → ask *before* you pay anyone regularly | 8 | JS |
| 55 | the notebook on the counter | what you keep, where, who can see it → keep less, lock more → one fix this week | 7 | JS |
| 56 | pause and verify | "Google is calling about your listing" → four red flags → look up the number yourself | 8 | STD (alerts live in §20) |
| 57 | nine doors, and how to knock | the owner who waited too long → what each professional does → a one-page brief | 8 | STD |
| 60 | you have the tools | what you can now do → four honest options → your 90 days | 8 | STD — script depends on CAPREG |

V1.1/V2 rows inherit the handling of their domain (24 `WS` · 26/40/49/51/58 `JS` · 36/37/39 `PLAT`). No recording exists for any lesson; a player renders only when an asset with the matching `scriptVersion` is added (decision D6).

## 16. V1 / V1.1 / V2 classification

| Class | Count | Rows |
|---|---|---|
| **V1** | **40** | 1–9 · 11–22 · 61 · 28–35 · 42–44 · 52–57 · 60 — *8 published to upgrade · 4 planned seed rows (12, 35, 44, 55) · 28 new* |
| **V1.1** | **19** | 10 · 23–27 · 36–41 · 45–49 · 58 · 59 — *4 planned seed rows (23, 37, 38, 48) · 15 new* |
| **V2** | **2** | 50 · 51 |
| **Universal total** | **61** | |
| Category-specific (V1.1, outside the universal count) | 8 | 4 Restaurant + 4 Services/Trades (§13–§14) |
| Recurring / current streams (not lessons) | 8 | §20 |

V1 by checkpoint: CP1 9 · CP2 7 · CP3 6 · CP4 8 · CP5 3 · CP6 6 · CP7 1. V1 by pathway: Idea 20 · Starting 40 · Business 36.

## 17. Shared-lesson reuse map

- **55 of 61** lessons serve two or more pathways; **6** are single-pathway (Business only: 45, 47, 48, 49, 50, 51).
- **16 lessons serve all three pathways** — author once, unlock three: 2 · 3 · 4 · 5 · 6 · 7 · 8 · 12 · 14 · 17 · 18 · 22 · 32 · 56 · 57 · 60.
- **Finishing the Idea pathway (20 lessons) completes 20 of Starting's 40 and 16 of Business's 36.** Every Business V1 lesson is also a Starting lesson, so after Idea only 20 more V1 lessons exist to author — and they finish both remaining pathways.
- Per-pathway variation for a shared lesson is *data*, never a copy: depth · urgency · framing · recommended action (journey map) · example variant (`example.variants[]`) · AI template variant (`prompt.variants`).
- Highest-leverage rows (three pathways **and** context-producing): 2, 4, 8, 17, 12.

## 18. First complete Idea-pathway build batches

Lessons already contributing: **`who_is_your_customer`** (done), **`revenue_vs_profit`** and **`healthy_boundaries_and_capacity`** (published; render through the legacy adapter today, upgraded to full packages in I-5). Planned seed row used: **`branding_basics`** (row exists, content is new). **16 lessons need a new database row.** Packages to build for the Idea pathway: 16 new + `branding_basics` + 2 upgrades = **19**.

| Batch | Lessons (in authoring order) | New activities | Notes |
|---|---|---|---|
| **I-1** | `what_problem_do_you_solve` · `customer_conversations` · `know_your_competition` | problem_statement_builder · conversation_plan_builder · alternatives_grid | All evergreen, `guided_fields` kind already proven. Smallest batch that proves the engine beyond the flagship. Needs the first `SEED`. **AUTHORED in Gate G4-I1 (2026-09-18):** packages, generic guided activity, 3 template sets, audio scripts; reviewed seed `supabase/reviewed-seeds/learning-center/20260918_content_batch_i1.sql` written — quarantined outside `supabase/migrations/` so no `supabase db push` can apply it (Gate G4-I1.1; runbook: `docs/learning-center-i1-staging-apply-runbook.md`) — (includes the D3 accent repair and the four reviewed English grammar repairs, Part C) and **not applied** — the lessons go live only when the owner applies it, staging first. |
| **I-2** | `ai_basics_for_business` · `build_your_ai_business_coach` · `ai_helps_you_verify` | bare_vs_context_compare · ai_starter_profile_builder · fact_assumption_sorter | The AI unit. Owner QA `FULL` — this is doctrine. |
| **I-3** | `what_makes_you_different` · `validate_before_you_spend` · `startup_costs` · `pricing_basics` | value_statement_builder · cheap_test_planner · startup_cost_list · unit_cost_price_builder | Money lessons work as guided fields first; `CALC` is an enhancement, not a blocker. |
| **I-4** | `naming_your_business` · `branding_basics` · `licenses_and_permits_awareness` | name_shortlist_tester · brand_basics_sheet · permit_research_checklist | The two `JS` rows of the Idea pathway. `LEGAL` read recommended. Publish as investigation education only (no maintained sources). |
| **I-5** | upgrade `revenue_vs_profit` · upgrade `healthy_boundaries_and_capacity` · `choosing_social_platforms` | month_profit_snapshot · weekly_capacity_check · platform_fit_picker | Replaces two legacy-adapter lessons with full packages. |
| **I-6** | `scams_and_online_safety` · `when_to_get_professional_help` · `how_to_move_forward` | spot_the_red_flags (tap_reveal) · pro_meeting_prep · next_90_days_plan | **Row 60 is blocked on decision D7** (capability registry). Until then the Idea pathway closes on row 57 plus the bridge. |

Jurisdiction-sensitive lessons that can safely wait until the Starting batches: 13, 61, 15, 19, 52, 53, 54, 55 (none is in the Idea pathway).

## 19. Authoring batches after Idea

| Batch | Lessons | Notes |
|---|---|---|
| **E-1** | `business_structure_concepts` · `ein_and_tax_id_awareness` · `business_banking_basics` · `record_keeping_basics` | `JS`; review per OD-4 (cpa_tax · attorney) |
| **E-2** | `customer_experience_basics` · `simple_operations_and_follow_up` | evergreen |
| **E-3** | upgrade `consistent_business_information` · upgrade `google_business_basics` · `yelp_basics` · `website_basics` · upgrade `whatsapp_business_basics` | platform review cadence starts here |
| **E-4** | `marketing_fundamentals` · upgrade `advertising_fundamentals` | |
| **E-5** | `insurance_awareness` · `tax_awareness` · `customer_data_protection` | `JS`; the maintained-source model (`TRUTH`) should exist before any official link is shown |
| **N-1** | upgrade `reviews_and_customer_response` · `local_seo_basics` · `referrals_basics` | completes Business CP4–CP5 |
| **N-2** | `employees_contractors_payroll` | `JS`; completes V1 |
| **V1.1-a / b / c** | CP3 extras · CP4 extras · CP5–CP7 extras | after V1 |
| **Playbooks** | Restaurant, then Services/Trades (8 category lessons + overlays) | needs playbook data model + `TRUTH` for the two "how to investigate" lessons |
| **V2** | 50 · 51 | |

After I-1…I-6 and E-1…E-5, 36 of the 40 V1 lessons exist. The last four (34, 35, 44, 54) are *light* in Starting and *core* in Business; N-1 and N-2 author them and complete Starting (40), Business (36) and V1 (40) together.

## 20. Deferred / current / recurring content (not lessons)

Eight streams live in a secondary "Al día" layer, never inside the permanent pathways. Every item carries `last_verified_at`, `review_by`, a source when factual, and expires visibly.

| Stream | Cadence | Anchored to |
|---|---|---|
| monthly reminder | monthly | 59 |
| quarterly business checkpoint | quarterly | 59 (the evergreen method) |
| annual review (tax season, notices, insurance, information audit) | annual | 53 · 52 · 28 |
| platform update (Google, Yelp, social, WhatsApp) | as needed | 29 · 30 · 32 · 33 |
| AI development update | as needed | 3 · 4 · 5 |
| scam alert | as needed | 56 |
| seasonal marketing reminder | seasonal | 42 · 46 |
| business-information audit prompt | every 3–4 months | 28 |

Also deferred, by design: the maintained-source model and any official links (`TRUTH`) · audio recordings (D6) · *Mi contexto de negocio* storage · the content editor · analytics · partner and success-story modules (only with a real partner) · podcast / video distribution · progress semantics (G5).

## 21. Owner decisions

**Resolved (2026-09-18, Gate G4-I1):**
- **OD-1A — REJECTED.** `ein_and_tax_id_awareness` stays its own canonical lesson (row 61). Universal total 61, V1 40.
- **OD-1B — APPROVED.** `customer_conversations` is V1 and belongs to all three pathways.
- **OD-2 — APPROVED.** One additive, reviewed data seed per content batch; staging first; never applied by an authoring gate.
- **OD-3 — APPROVED.** The Idea pathway target is the full 20-lesson experience.
- **OD-4 — Jurisdiction-sensitive publishing rule.** Coach + owner review against current authoritative sources before publishing; professional review when material crosses from general education into consequential legal, tax, licensing, labor/employment, insurance or regulated interpretation. Evergreen lessons need neither.
- **OD-5 — APPROVED.** The G2.1 AI-development architecture may propagate to other lessons; exact wording stays subject to normal lesson QA.
- **D3 — APPROVED.** Seeded Spanish accents are repaired in the first reviewed content seed (Batch I-1), with an explicit before → after ledger.

**Still open:**
- **D6 — audio voice/provider.** Scripts are authored per batch regardless; no player renders without a recording.
- **D7 — Leonix capability truth registry** for row 60 and the factual mentions in rows 28, 29, 30, 34, 43, 47. Row 60 cannot be authored without it.
- *(Resolved, Gate G4-I1.2.)* The four TODAY-1 English possessive-apostrophe defects (`proteccion_y_datos.summary_en`, `customer_data_protection.summary_en`, and two in `reviews_and_customer_response.body_en`) are repaired by **Part C** of the reviewed I-1 seed — grammar only, guarded. One further instance in that body ("its customers opinions") is not among the four approved pairs and remains open.

## 22. Definition of curriculum completeness

A **lesson** is complete when: its row here is filled; its LessonPackage passes `validateLessonPackage` with zero errors; ES and EN are at parity; it has a hook with a text alternative, outcomes, short explanation chunks, an example with journey variants (and a neutral one), an activity **with a result bridge**, a stage-aware AI template set drawing on the activity, a checklist or equivalent, a verify block, a recap and a journey-aware next step; `JS` lessons also carry `pro_help` and no asserted requirement; its audio script exists in both languages; its glossary terms exist as real resource rows; owner QA at the level in §5.5 has passed.

A **pathway** is complete when every V1 lesson in its order (§6–§8) is published as a full package, no checkpoint it uses shows "En preparación", and its bridge leads to a live next pathway.

**V1 curriculum** is complete when all 40 V1 rows are complete, the three pathways are complete, every one of the 21 business-context fields has a live producing lesson, no published lesson renders through the legacy adapter, and no published lesson states a legal, tax, licensing, insurance or employment requirement as fact.

The **school** is complete — never finished — when V1.1 and the two first playbooks are live, the recurring layer is publishing on its cadences, every `JS` lesson is inside its review date, and a first-time entrepreneur can honestly say the nine statements of Bible §42.
