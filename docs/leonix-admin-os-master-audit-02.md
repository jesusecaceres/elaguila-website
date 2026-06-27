# Leonix Admin OS Master Audit 02

Audit gate: `ADMIN-OS-MASTER-AUDIT-02`  
Date: 2026-06-26  
Scope: audit-only architecture gate for the Leonix Admin OS. No public page changes. No schema changes. No staging.

## 1. Executive Summary

The current admin already has the beginning of a real Leonix Website Operating System. The strongest real areas are the executive command center, launch leads, classifieds operations, reports, users, support tickets, staff roster, Tienda, promo/package/payment trackers, site section editing, magazine issue lifecycle, activity log, and several admin API mutation routes. These areas use server-side Supabase clients, admin cookie or permission gates, audit writes in many write paths, and explicit unavailable states instead of fake counts.

What feels real:
- `/admin` reads live dashboard counts from Supabase-backed sources where available: reports, listings, leads, package entitlements, promo codes, payment tracker, Tienda catalog, and category registry.
- `/admin/leads/inbox`, `/admin/leads/newsletter`, and `/admin/leads/media-kit` read real lead tables and expose lifecycle/export behavior.
- `/admin/workspace/clasificados` and category operation pages have real listing queues, owner links, public links, lifecycle actions, AI review routes, and action-proof feedback.
- `/admin/reportes`, `/admin/usuarios`, `/admin/support`, `/admin/team/roster`, `/admin/activity-log`, `/admin/tienda`, `/admin/workspace/revista`, and `/admin/workspace` have real Supabase or server-action wiring.

What feels partial:
- The admin is a strong operations dashboard, but it is not yet a complete OS. Bug Finder, System Health, Listing Visibility Checker, Website Control rollback, Concierge, system alert emailing, and Viajes affiliate operations tables are not fully backed.
- Some pages are read models, placeholders, aliases, or planning surfaces. They must stay labeled partial or UI-only until live Supabase proof exists.
- The permission model exists, but role naming does not yet match the final desired owner/admin/moderator/sales/content_manager/support/viewer map.

What is confusing:
- There are overlapping route families: `/admin/workspace/clasificados/travel`, `/admin/clasificados/viajes`, and requested `/admin/workspace/clasificados/viajes`.
- Website Control is split across `/admin/workspace`, `/admin/site-sections`, `/admin/site-settings`, `/admin/settings`, `/admin/website-content`, and individual workspace content pages.
- Magazine exists at both `/admin/magazine` and `/admin/workspace/revista`; the real mutation actions target the revista workspace.
- Payments/revenue tools are spread across `/admin/payments`, `/admin/workspace/payment-tracker`, `/admin/workspace/sales-tracker`, `/admin/workspace/promo-codes`, `/admin/workspace/package-entitlements`, and staff sales pages.

Mobile risks:
- The shell is mobile-aware and uses `overflow-x-hidden`, mobile drawer, responsive cards, and desktop/table split helpers. Risk remains in dense tables, many action buttons per listing, long IDs, long route labels, and desktop-first admin pages that still rely on `overflow-x-auto`.
- 390px review is required before rebuilding the UI. The highest risk pages are classifieds queue rows, activity log, reports, user detail, Tienda orders/catalog, category registry, and Viajes subpages.

Supabase risks:
- Service role is used server-side, which is correct, but the admin needs live schema proof before any major UI rebuild.
- Missing future tables include `admin_system_alerts`, `affiliate_partners`, `travel_offers`, `travel_inquiries`, `affiliate_click_events`, `concierge_requests`, homepage/banner/announcement/theme tables, and a final Listing Visibility Checker read model.
- Any local notes or uploads containing API keys must be rotated and moved to environment variables. This audit does not reproduce any secret values.

Before major UI rebuild:
- Run `ADMIN-SUPABASE-BACKING-MATRIX-01` with live table/column proof.
- Run `ADMIN-ACTION-TRUTH-MAP-01` to prove every button has a real handler, confirmation, audit log, failure state, and notification status.
- Add page purpose cards before changing visual hierarchy.
- Resolve route architecture and final sidebar grouping.

## 2. Uploaded Screenshot UX Review

No dashboard-specific screenshot folder was found in the repo context. Available screenshot references are Tienda design samples under `design-references/tienda-samples`. Therefore this section is based on those available visual references plus code-level UI evidence from `app/admin`.

Repeated visual issues:
- Several admin pages mix rounded pill chips, rounded-2xl/3xl cards, rectangular CTA helpers, and plain links. The admin is closer to Leonix than before, but still not fully consistent.
- Some pages use semantic CTA colors from `adminTheme.ts`; others still use local `bg-*`, `text-*`, and `border-*` choices.
- Several pages need top purpose cards explaining "what this page controls", "what data is real", and "what action is safe".

Mobile risks:
- Tables are often wrapped in horizontal scroll. This prevents breakage, but it is not a full 390px operations experience.
- Long UUIDs, Leonix Ad IDs, action proof text, and route labels can crowd cards.
- Classifieds rows expose many actions. Mobile card grouping helps, but destructive and safe actions need stronger separation everywhere.

Table/card problems:
- Activity log and reports still depend on table layouts.
- User detail contains many sections and cross-links; it needs a support-safe mobile card structure.
- Category command centers and registries can become too dense without progressive disclosure.

Inconsistent buttons:
- Burgundy, green, blue, orange, gold, and red are present in the shared admin CTA layer, but individual pages still need cleanup.
- Some "view" links are plain text instead of royal blue inspect/view CTAs.
- Some neutral utility buttons look as important as revenue or lifecycle actions.

Unclear page purpose:
- `/admin/website-content`, `/admin/site-settings`, `/admin/settings`, `/admin/workspace`, `/admin/site-sections`, `/admin/magazine`, `/admin/workspace/revista`, and `/admin/draw` need purpose cards or merge decisions.

Pages that look UI-only or planning-heavy:
- `/admin/draw`
- several `/admin/clasificados/viajes/*` planning/affiliate/editorial/campaign pages
- `/admin/website-content`
- `/admin/magazine` if it does not share the real `magazine_issues` action flow

Leonix style gaps:
- Icons in global nav are mixed symbols/emoji and should become consistent Leonix-branded glyphs later.
- Red is used in errors and danger, which is right, but urgent review red should not become general status decoration.
- Cream/ivory surfaces are present; final pass should remove color chaos from local page-level classes.

## 3. Admin Route Inventory

Legend: `real / partial / UI-only / unknown` is the required status taxonomy. Real = live Supabase/server action evidence found. Partial = some backing exists but not complete. UI-only = no backing found in this audit. Unknown = route exists but backing was not fully inspected.

| Route | Nav label if known | Page title | Business purpose | Primary user | Data source | Supabase backing status | Actions present | Actions verified | Mobile status | Leonix style status | Risk | Recommended next fix |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/admin/login` | Login | Admin login | Staff/admin entry | Owner/staff | Admin cookie/auth route | Partial | Login | Partial | Simple | Basic | Cookie-only admin history | Keep, audit auth separately |
| `/admin` | Dashboard | Command center | Executive daily command | Chuy/owner | Supabase snapshots | Real | CTAs | Partial | Card-first | Strong | Missing OS modules | Add OS purpose card |
| `/admin/ops` | Customer Ops | Global lookup | Unified customer/listing lookup | Support/owner | Admin search helpers | Partial | Search/navigation | Partial | Risky dense results | Good | Needs support workflow proof | Fold into Support Center |
| `/admin/activity-log` | Activity Log | Activity log | Audit trail | Owner | `admin_audit_log` | Real/partial | View only | Real read | Table scroll risk | Mixed chips | Missing actor context | Expand audit schema proof |
| `/admin/leads` | Launch leads group | Leads hub | Lead ops hub | Sales/owner | Links/lead summaries | Partial | Navigation | Partial | Card likely | Good | Hub may duplicate inbox | Add purpose card |
| `/admin/leads/inbox` | Launch Leads | Launch Leads command center | Inquiry follow-up | Sales/support | `leonix_leads` | Real | Archive/restore/delete/mark contacted/export/mailto/copy | Partial | Client cards present | Good | Mail is not server-sent | Label mailto vs sent |
| `/admin/leads/inbox?view=promo` | Promocionales | Promo view | Promo/print quote queue | Sales | `leonix_leads` filtered | Real/partial | Same as inbox | Partial | Good | Good | Query-only route can be hidden | Promote as Revenue subitem |
| `/admin/leads/newsletter` | Newsletter | Newsletter subscribers | Audience list ops | Content/sales | `leonix_newsletter_subscribers` | Real | Archive/restore/delete/export | Partial | Drawer/cards | Good | Needs campaign integration | Add lifecycle proof |
| `/admin/leads/media-kit` | Media Kit | Media kit leads | Advertiser/media requests | Sales | `leonix_media_kit_leads` | Real | Archive/restore/delete/export | Partial | Drawer/cards | Good | Not tied to sales pipeline | Add sales handoff status |
| `/admin/workspace` | Site Sections | Website workspace | Website module control hub | Content/owner | `site_section_content`, scaffolds | Real/partial | Navigate/edit module content | Partial | Card-first likely | Good | Split routes confuse | Rename Website Control |
| `/admin/site-sections` | Website Sections | Alias | Owner-friendly alias | Content/owner | Redirect | Partial | Redirect | Real | Safe | Good | Alias may confuse route inventory | Keep as alias |
| `/admin/site-settings` | Site settings | Site settings | Global site settings | Owner/content | Settings helpers | Partial | Settings forms | Partial | Unknown | Good | Overlaps `/admin/settings` | Merge/rename |
| `/admin/settings` | Settings | Settings | Admin/global settings | Owner | Admin settings helpers | Partial | Forms/navigation | Partial | Unknown | Good | Duplicates site-settings | Define boundary |
| `/admin/website-content` | None | Website content | Content control | Content | Scaffold/content helpers | Partial | Unknown | Unknown | Unknown | Unknown | Duplicate workspace | Merge into Website Control |
| `/admin/workspace/home` | Workspace | Home | Home module | Content | Site content scaffold | Partial | Open content | Partial | Card | Good | Needs preview/rollback | Purpose card |
| `/admin/workspace/home/content` | Workspace | Home content | Edit home payload | Content | `site_section_content` | Real/partial | Save content | Partial | Form risk | Good | Schema payload loose | Add preview/rollback |
| `/admin/workspace/contacto` | Workspace | Contact | Contact module | Content | Section actions | Partial | Open content | Partial | Card | Good | Split content route | Purpose card |
| `/admin/workspace/contacto/content` | Workspace | Contact content | Edit contact payload | Content | `site_section_content` | Real/partial | Save content | Partial | Form risk | Good | Needs audit log proof | Add action truth |
| `/admin/workspace/nosotros` | Workspace | Nosotros | About module | Content | Section actions | Partial | Open content | Partial | Card | Good | Needs preview | Purpose card |
| `/admin/workspace/nosotros/content` | Workspace | Nosotros content | Edit about payload | Content | `site_section_content` | Real/partial | Save content | Partial | Form risk | Good | Needs rollback | Add revision model |
| `/admin/workspace/noticias` | Workspace | Noticias | News module | Content | Section actions | Partial | Open content | Partial | Unknown | Good | News vs magazine overlap | Define module |
| `/admin/workspace/noticias/content` | Workspace | Noticias content | Edit news payload | Content | `site_section_content` | Real/partial | Save content | Partial | Form risk | Good | Needs publish state | Add preview/archive |
| `/admin/workspace/cupones` | Workspace | Coupons | Coupons content | Content/sales | Section actions | Partial | Open content | Partial | Unknown | Good | Promo codes overlap | Separate content vs codes |
| `/admin/workspace/cupones/content` | Workspace | Coupons content | Edit coupons content | Content | `site_section_content` | Real/partial | Save content | Partial | Form risk | Good | Needs rollback | Add revision model |
| `/admin/workspace/iglesias` | Workspace | Iglesias | Churches/community module | Content | Section actions | Partial | Open content | Partial | Unknown | Good | Needs module purpose | Purpose card |
| `/admin/workspace/iglesias/content` | Workspace | Iglesias content | Edit church content | Content | `site_section_content` | Real/partial | Save content | Partial | Form risk | Good | Needs preview | Add preview |
| `/admin/workspace/anunciate` | Workspace | Advertise | Advertising page control | Sales/content | Section actions | Partial | Edit/navigation | Partial | Unknown | Good | Sales/revenue boundary unclear | Move under Revenue + Website |
| `/admin/workspace/revista` | Workspace | Revista | Magazine issue manager | Content | `magazine_issues` | Real | Upsert/publish/archive/current/delete draft/upload | Partial | Form/table risk | Good | Also `/admin/magazine` exists | Make canonical Magazine Manager |
| `/admin/magazine` | None | Magazine | Magazine admin | Content | `magazineAdminData` | Partial/unknown | Unknown | Unknown | Unknown | Unknown | Duplicate with revista | Merge or redirect |
| `/admin/workspace/language-audit` | Language Audit | Language audit | Translation QA | Content | Translation records/scripts | Partial | View audit | Partial | Unknown | Good | May not belong in final nav | Move under System |
| `/admin/categories` | Categories active prefix | Categories registry | Category registry | Owner/content | Category registry + Supabase config | Real/partial | Save category config | Partial | Dense table risk | Good | Duplicates workspace categories | Merge into Marketplace Ops |
| `/admin/workspace/clasificados` | Categories | Clasificados | Marketplace ops hub/queue | Moderator/owner | `listings`, flags, reports, AI reviews | Real | Filter, edit, view, owner, contact, lifecycle, AI | Partial | Mobile card + table | Strong | Action overload | Action truth gate |
| `/admin/workspace/clasificados?status=flagged#queue` | Review queue | Filtered queue | Trust queue | Moderator | `listings`, reports, `listing_moderation_reviews` | Real/partial | Queue actions | Partial | High risk | Strong | Anchor/query behavior must be proven | Browser proof 390px |
| `/admin/workspace/clasificados/listings/[id]/edit` | Hidden action | Edit listing | Staff edit listing | Moderator/support | Listing source support map | Partial | Edit fields | Unknown | Form risk | Unknown | Not all categories support true edit | Label true edit vs manage |
| `/admin/workspace/clasificados/category/[slug]` | Category | Category ops | Category command page | Moderator | Category registry/listings | Partial | Navigate/filter | Partial | Card/table risk | Good | Slug source varies | Normalize category routes |
| `/admin/workspace/clasificados/category/editor/[slug]` | Category editor | Category editor | Category content edit | Content | Category config/content | Partial | Save editor fields | Partial | Form risk | Good | Needs rollback/audit | Add preview |
| `/admin/workspace/clasificados/en-venta` | Category | En Venta ops | En Venta moderation | Moderator | `listings` | Real/partial | Queue actions | Partial | High risk | Good | Free/pro monetization nuance | Add monetization purpose |
| `/admin/workspace/clasificados/servicios` | Category | Servicios ops | Services moderation | Moderator/sales | `servicios_public_listings` | Real/partial | Staff actions, monetization panel | Partial | Card-first pieces | Good | Paid business only nuance | Add live table proof |
| `/admin/workspace/clasificados/servicios/sandbox` | Hidden | Servicios sandbox | Test surface | Dev/admin | Local/component | UI-only/unknown | Unknown | Unknown | Unknown | Unknown | Should not be in final nav | Remove later |
| `/admin/workspace/clasificados/autos` | Category | Autos ops | Auto listing ops | Moderator/sales | `autos_classifieds_listings` | Real/partial | Staff actions | Partial | High risk | Good | Private/business paid nuance | Add action proof |
| `/admin/workspace/clasificados/restaurantes` | Category | Restaurantes ops | Restaurant ops | Moderator/sales | `restaurantes_public_listings` | Real/partial | Staff actions | Partial | High risk | Good | Paid-only category | Add payment entitlement proof |
| `/admin/workspace/clasificados/travel` | Category | Travel/Viajes workspace | Travel queue in workspace | Moderator/sales | likely `viajes_staged_listings` | Partial | Staff actions | Partial | High risk | Mixed naming | Route mismatch with `/viajes` | Rename/redirect |
| `/admin/workspace/clasificados/viajes` | Requested | Missing | Requested workspace Viajes | Sales/ops | None | Missing | None | No | Missing | Missing | Broken route if linked | Add alias after nav gate |
| `/admin/workspace/clasificados/rentas` | Category | Rentas ops | Rental ops | Moderator/sales | `listings` | Real/partial | Staff actions | Partial | High risk | Good | Paid private/business nuance | Add visibility checker |
| `/admin/workspace/clasificados/rentas/[id]` | Hidden | Rentas inspector | Rental detail inspector | Moderator | `listings` detail | Partial | Inspect | Partial | Detail risk | Good | Inspector not generalized | Fold into listing support view |
| `/admin/workspace/clasificados/bienes-raices` | Category | Bienes Raices ops | Real estate ops | Moderator/sales | `listings` | Real/partial | Staff actions | Partial | High risk | Good | Paid private/business nuance | Add live proof |
| `/admin/workspace/clasificados/empleos` | Category | Empleos ops | Jobs ops | Moderator/sales | `empleos_public_listings` | Real/partial | Staff actions/moderate API | Partial | High risk | Good | Paid-only category | Add payment proof |
| `/admin/workspace/clasificados/comida-local` | Category | Comida Local ops | Local food ops | Moderator/sales | `comida_local_public_listings` | Real/partial | Actions | Partial | High risk | Good | Category future unclear | Define monetization |
| `/admin/workspace/clasificados/ofertas-locales` | Category | Ofertas Locales ops | Offer review | Moderator/sales | `ofertas_locales`, AI scan items | Real/partial | Review/AI item sections | Partial | High risk | Good | AI workflow proof needed | Action truth gate |
| `/admin/workspace/clasificados/mascotas-y-perdidos` | Category | Pets/lost ops | Community listings | Moderator | `listings` | Partial | Queue actions | Partial | Unknown | Good | Free/community nuance | Live proof |
| `/admin/workspace/clasificados/comunidad` | Category | Comunidad ops | Community listings | Moderator | `listings` | Partial | Queue actions | Partial | Unknown | Good | Free category | Live proof |
| `/admin/workspace/clasificados/clases` | Category | Clases ops | Classes ops | Moderator/sales | `listings` | Partial | Queue actions | Partial | Unknown | Good | Free vs paid class nuance | Monetization proof |
| `/admin/workspace/clasificados/busco` | Category | Busco ops | Wanted ads | Moderator | `listings` | Partial | Queue actions | Partial | Unknown | Good | Need visibility logic | Live proof |
| `/admin/clasificados` | Secondary | Clasificados | Secondary classifieds hub | Moderator | Unknown | Partial/unknown | Navigation | Unknown | Unknown | Unknown | Duplicates workspace | Merge/redirect |
| `/admin/clasificados/servicios` | Secondary | Servicios | Secondary services ops | Moderator | Unknown | Partial/unknown | Unknown | Unknown | Unknown | Unknown | Duplicate route family | Merge |
| `/admin/clasificados/viajes` | Viajes | Viajes overview | Affiliate/travel ops hub | Sales/owner | Mocks + staged listings | Partial | Navigation/planning | Partial | Card | Mixed | Not final revenue grouping | Move under Revenue |
| `/admin/clasificados/viajes/affiliate-cards` | Viajes | Affiliate cards | Affiliate card management | Sales | Mock/partial offer data | UI-only/partial | Create/edit | Unknown | Unknown | Mixed | Expected tables missing | Back with affiliate tables |
| `/admin/clasificados/viajes/affiliate-cards/new` | Viajes | New affiliate card | Create affiliate card | Sales | Mock/partial | UI-only/partial | Form | Unknown | Form risk | Mixed | Missing table | Add schema later |
| `/admin/clasificados/viajes/affiliate-cards/[id]/edit` | Viajes | Edit affiliate card | Edit affiliate card | Sales | Mock/partial | UI-only/partial | Form | Unknown | Form risk | Mixed | Missing table | Add schema later |
| `/admin/clasificados/viajes/business-offers` | Viajes | Business offers | Travel partner offers | Sales | Partial/mock | Partial | Moderate/review | Unknown | Unknown | Mixed | Expected `travel_offers` missing | Add backing proof |
| `/admin/clasificados/viajes/businesses` | Viajes | Businesses | Partner profiles | Sales | Partial/mock | Partial | Table/actions | Unknown | Table risk | Mixed | Expected `affiliate_partners` missing | Add partner table |
| `/admin/clasificados/viajes/editorial` | Viajes | Editorial | Travel content planning | Content | Mock/planning | UI-only/partial | Planning | Unknown | Unknown | Mixed | Needs Website vs Revenue boundary | Define ownership |
| `/admin/clasificados/viajes/campaigns` | Viajes | Campaigns | Seasonal campaigns | Sales/content | Mock/planning | UI-only/partial | Planning | Unknown | Unknown | Mixed | Missing campaign schema | Back later |
| `/admin/clasificados/viajes/settings` | Viajes | Settings | Travel rules | Owner/sales | Mock/config | UI-only/partial | Settings | Unknown | Unknown | Mixed | Missing rules source | Back later |
| `/admin/reportes` | Reports | Reports & complaints | Trust/safety report queue | Moderator | `listing_reports` | Real | Search/view table | Partial | Table scroll risk | Good | Need resolve/dismiss action proof | Add report actions |
| `/admin/team` | Team | Staff workspace | Staff tools hub | Staff/sales | Access context | Real/partial | Navigate | Partial | Cards | Good | Role model mismatch | Permissions truth gate |
| `/admin/team/roster` | Team | Team roster | Staff manager | Owner | `admin_team_members` | Real | Activate/deactivate/edit? | Partial | Table risk | Good | Needs final role map | Permissions truth gate |
| `/admin/team/users/new` | Team | Create staff login | Staff provisioning | Owner | Supabase Auth + `admin_team_members` | Real/partial | Create staff | Partial | Form risk | Good | Sensitive action | Add confirmation/audit proof |
| `/admin/team/customers/new` | Team | Create customer | Customer provisioning | Sales/support | Supabase Auth + `profiles` | Real/partial | Create customer | Partial | Form risk | Good | Must not create admin roles | Keep strict |
| `/admin/team/website-preview` | Team | Website preview | Staff preview links | Staff | Static preview links | Partial/UI-only | Open links | Real nav | Card | Good | Not operational control | Keep under People/System |
| `/admin/team/promo-codes` | Team | Promo codes | Sales rep code tools | Sales | `leonix_promo_codes` | Real/partial | Create/manage own | Partial | Form/table risk | Good | Duplicates workspace promo codes | Merge under Revenue |
| `/admin/team/clients` | Team | My clients | Sales client list | Sales | Promo/payment links | Partial | View clients | Partial | Unknown | Good | Needs CRM backing | Add sales CRM proof |
| `/admin/team/sales-tracker` | Team | Sales tracker | Rep sales tracking | Sales | `leonix_payment_records`, promo/entitlements | Real/partial | View | Partial | Table risk | Good | Commission proof needed | Revenue gate |
| `/admin/usuarios` | Users | Users | User/client list | Support/owner | `profiles` | Real | View detail | Partial | Table/card risk | Good | Support workflows incomplete | User Support View gate |
| `/admin/usuarios/[id]` | Users | Admin User Detail | Safe support/account view | Support/owner | `profiles`, listings, reports, orders, analytics, entitlements | Real/partial | Enable/disable, account type/tier, links | Partial | Dense high risk | Good | Reset link not implemented | Support view gate |
| `/admin/support` | Support | Support | Internal support log | Support/owner | `support_tickets` | Real/partial | Create/update ticket | Partial | Form/table risk | Good | Not full helpdesk | Build support center |
| `/admin/payments` | Payments | Payments | Revenue hub | Owner/sales | Payment/promo/entitlement summaries | Partial | Navigation | Partial | Cards | Good | Spread revenue tools | Revenue cockpit gate |
| `/admin/workspace/payment-tracker` | Payments active prefix | Payment tracker | Payment tracking | Owner | `leonix_payment_records` | Real/partial | View/filter | Partial | Table risk | Good | Needs Stripe reconciliation proof | Revenue gate |
| `/admin/workspace/sales-tracker` | Payments active prefix | Sales tracker | Sales tracking | Owner/sales | `leonix_payment_records`, promo codes | Real/partial | View/filter | Partial | Table risk | Good | Commission model proof | Revenue gate |
| `/admin/workspace/promo-codes` | Payments active prefix | Promo codes | Promo code lifecycle | Sales/owner | `leonix_promo_codes` | Real | Create/update lifecycle | Partial | Form/table risk | Good | Activation action proof needed | Action truth gate |
| `/admin/workspace/package-entitlements` | Payments active prefix | Package entitlements | Paid package fulfillment | Sales/owner | `listing_package_entitlements` | Real | Generate/attach/revoke? | Partial | Table risk | Good | Payment/package alignment | Revenue gate |
| `/admin/tienda` | Tienda | Tienda hub | Store ops | Owner/staff | `tienda_orders`, catalog | Real/partial | Navigate | Partial | Cards | Good | Lower priority but real | Keep under Revenue or Marketplace |
| `/admin/tienda/catalog` | Tienda | Catalog | Product catalog | Store admin | `tienda_catalog` | Real | Create/edit | Partial | Table/card risk | Good | Product ops only | Keep |
| `/admin/tienda/catalog/new` | Tienda | New catalog item | Create product | Store admin | `tienda_catalog` | Real | Create | Partial | Form risk | Good | Needs image proof | Action truth |
| `/admin/tienda/catalog/[id]` | Tienda | Edit catalog item | Edit product | Store admin | `tienda_catalog` | Real | Update | Partial | Form risk | Good | Need publish status proof | Action truth |
| `/admin/tienda/orders` | Tienda | Orders | Order inbox | Store admin/support | `tienda_orders`, assets | Real | View/update/internal notes | Partial | Table risk | Good | Asset fulfillment proof | Revenue/support gate |
| `/admin/tienda/orders/[id]` | Tienda | Order detail | Fulfillment detail | Store admin/support | `tienda_orders`, assets | Real | Status/notes | Partial | Dense detail risk | Good | Missing customer notification proof | Action truth |
| `/admin/workspace/tienda` | Workspace | Tienda workspace | Storefront content | Content/store | Site section/storefront actions | Partial | Edit storefront | Partial | Unknown | Good | Duplicates Tienda hub | Merge under Website Control/Tienda |
| `/admin/workspace/tienda/storefront` | Workspace | Storefront | Tienda storefront editor | Content/store | `site_section_content` | Real/partial | Save storefront | Partial | Form risk | Good | Needs preview/rollback | Website Control gate |
| `/admin/draw` | None | Draw | Unknown/internal drawing | Owner/dev | Unknown | UI-only/unknown | Unknown | Unknown | Unknown | Unknown | Not OS-critical | Remove later or document |

## 4. Sidebar/Nav Truth Map

Current sidebar from `ADMIN_GLOBAL_NAV`:

| Current item | Current route | Truth | Decision | Needs purpose card |
|---|---|---|---|---|
| Dashboard | `/admin` | Real command center | Keep, rename Command Center | Yes |
| Launch Leads | `/admin/leads/inbox` | Real lead inbox | Keep under Revenue/People | Yes |
| Categories | `/admin/workspace/clasificados` | Real marketplace ops | Rename Marketplace Ops | Yes |
| Customer Ops | `/admin/ops` | Partial unified lookup | Merge into People Support | Yes |
| Payments | `/admin/payments` | Partial revenue hub | Rename Revenue Cockpit | Yes |
| Team | `/admin/team/roster` | Real/partial staff manager | Keep under People | Yes |
| Users | `/admin/usuarios` | Real user/client list | Rename Clients & Users | Yes |
| Support | `/admin/support` | Real internal ticket log | Keep under People | Yes |
| Site Sections | `/admin/workspace` | Real/partial website control | Rename Website Control | Yes |
| Viajes | `/admin/clasificados/viajes` | Partial affiliate ops | Move under Revenue | Yes |
| Activity Log | `/admin/activity-log` | Real/partial audit log | Move under System | Yes |
| Settings | `/admin/settings` | Partial | Move under System | Yes |
| Language Audit | `/admin/workspace/language-audit` | Partial | Move under System | Yes |
| Tienda | `/admin/tienda` | Real/partial store ops | Move under Revenue or Marketplace | Yes |

Final grouped architecture:

| Group | Item | Action | Notes |
|---|---|---|---|
| Command | Command Center | Keep/rename | `/admin`; mobile-first daily command |
| Command | Activity Log | Move | System event trail available to owner |
| Command | System Health | Rebuild | New `/admin/system-health` |
| Revenue | Revenue Cockpit | Rebuild | Payments, sales, packages, promo codes |
| Revenue | Launch Leads | Move | Lead follow-up is revenue intake |
| Revenue | Promo Leads | Keep as query route | `/admin/leads/inbox?view=promo` |
| Revenue | Tienda | Move | Store orders/catalog revenue |
| Revenue | Viajes Affiliate | Move/rebuild | Belongs under Revenue because partner offers, clicks, leads, and affiliate conversion are revenue ops |
| Revenue | Business Concierge | Rebuild | New concierge queue |
| Marketplace Ops | Clasificados Queue | Keep/rename | All categories, review queue, visibility checker |
| Marketplace Ops | Reports & Complaints | Move | Trust/moderation |
| Marketplace Ops | AI Trust Center | Rebuild | AI moderation status and proof |
| People | Clients & Users | Keep/rename | User support view |
| People | Support Center | Merge | `/admin/ops` + `/admin/support` + user detail |
| People | Team Manager | Keep | Roster, staff creation, permissions |
| Website Control | Site Modules | Keep/rename | Workspace/site sections |
| Website Control | Magazine | Merge/rebuild | One canonical manager |
| Website Control | Homepage/Banners/Announcements/Themes | Rebuild | Controlled modules only |
| System | Settings | Keep/move | Technical controls |
| System | Language Audit | Move | QA tooling |
| System | Bug Finder | Rebuild | New `/admin/bug-finder` |

## 5. Supabase Backing Matrix

| Feature/tool | Expected table(s) | Table found yes/no/unknown | Columns found yes/no/unknown | Action found yes/no/unknown | Status | Risk | Next gate |
|---|---|---|---|---|---|---|---|
| Classified listings | `listings`, category public tables | Yes | Partial yes | Yes | Real/partial | Multiple category sources | `ADMIN-SUPABASE-BACKING-MATRIX-01` |
| Listing moderation reviews | `listing_moderation_reviews` | Yes | Yes from migration signal | Yes | Real/partial | AI proof must be live | `ADMIN-ACTION-TRUTH-MAP-01` |
| Reports | `listing_reports` | Yes | Yes | Partial | Real read, partial actions | Resolve/dismiss missing | `ADMIN-ACTION-TRUTH-MAP-01` |
| Leads | `leonix_leads` | Yes | Yes | Yes | Real | Email is mailto/copy, not sent | Lead action proof |
| Promo leads | `leonix_leads` filtered | Yes | Yes | Yes | Real/partial | Query-only route | Revenue nav gate |
| Newsletter | `leonix_newsletter_subscribers` | Yes | Yes | Yes | Real | Campaign integration missing | Lead lifecycle gate |
| Media kit | `leonix_media_kit_leads` | Yes | Yes | Yes | Real | Sales pipeline handoff missing | Lead lifecycle gate |
| Users | `profiles`, auth users | Yes | Partial yes | Partial | Real/partial | No uncontrolled impersonation, reset not implemented | `ADMIN-USER-SUPPORT-VIEW-01` |
| Staff/team | `admin_team_members` | Yes | Yes | Yes | Real/partial | Final role map mismatch | `ADMIN-TEAM-PERMISSIONS-TRUTH-01` |
| Reset password support | Supabase Auth | Unknown/local link only | Unknown | No | Missing | User support blocked | `ADMIN-USER-SUPPORT-VIEW-01` |
| Support view | `support_tickets`, `profiles`, listings, orders | Yes | Partial yes | Yes | Partial | Not a full helpdesk | Support view gate |
| Promo codes | `leonix_promo_codes` | Yes | Yes | Yes | Real/partial | Activation/deactivation proof needed | Action truth |
| Package entitlements | `listing_package_entitlements` | Yes | Yes | Yes | Real/partial | Payment attachment proof | Revenue gate |
| Payment tracker | `leonix_payment_records` | Yes | Yes | Read found | Real/partial | Stripe reconciliation proof | Revenue gate |
| Sales tracker | `leonix_payment_records`, promo codes | Yes | Partial yes | Read found | Real/partial | Commission proof | Revenue gate |
| Site sections | `site_section_content` | Yes | Yes | Yes | Real/partial | JSON payload lacks rollback | Website Control gate |
| Magazine manager | `magazine_issues` | Yes | Yes | Yes | Real/partial | Duplicate route family | `ADMIN-MAGAZINE-MANAGER-01` |
| Homepage manager | `site_section_content` or future `homepage_modules` | Partial | Partial | Partial | Partial | Needs preview/rollback | Website Control gate |
| Announcements | `announcements` | No/unknown | No/unknown | No/unknown | Missing | Cannot fake alerts | Website Control gate |
| Themes | `site_themes` | No/unknown | No/unknown | No/unknown | Missing | Brand controls not durable | Website Control gate |
| Viajes affiliate | `affiliate_partners`, `travel_offers`, `travel_inquiries`, `affiliate_click_events` | No for expected tables, yes for staged/inquiries | Partial | Partial | Partial/UI-only | Affiliate ops not backed | Viajes gate |
| Concierge requests | `concierge_requests` | No/unknown | No/unknown | No/unknown | Missing | Concierge cannot launch | Concierge gate |
| System alerts | `admin_system_alerts` | No | No | No | Missing | Bug Finder impossible | `ADMIN-SYSTEM-ALERTS-SCHEMA-01` |
| Activity log | `admin_audit_log` | Yes | Yes | Yes in many writes | Real/partial | Actor is often server/null | Activity log gate |

## 6. Action Truth Map

| Action | Where it appears | What it should do | Table touched | Permission required | Confirmation required | Audit log required | Current status | Failure behavior | Notification behavior | Next fix |
|---|---|---|---|---|---|---|---|---|---|---|
| View public | Classified rows/user detail | Open public listing | None | Admin cookie | No | No | Real link | Broken URL possible | None | Visibility checker |
| Edit listing | Classified rows/user detail | Staff edit supported listing | Source listing table | Moderator/admin | No | Yes if write | Partial | Unsupported categories need label | None | Action truth |
| Open owner/user | Classified rows | Open `/admin/usuarios/[id]` | `profiles` read | Support/admin | No | No | Real link | Missing owner -> hidden | None | Support view |
| Contact owner/seller | Classified rows/leads | Copy email or mailto | None | Support/admin | No | No | Partial | Clipboard/mail client fail | None | Label not sent |
| Archive | Classified rows/leads/magazine/support | Remove from public or archive record | Listing/lead/magazine table | Moderator/admin | Yes for listings | Yes | Real/partial | Redirect/action proof or error param | None | Standardize |
| Restore | Classified rows/leads | Unarchive/unsuspend | Listing/lead table | Moderator/admin | Yes for dangerous restores maybe | Yes | Real/partial | Action proof/error | None | Standardize |
| Soft delete | Leads | Set deleted fields | Lead tables | Admin | Yes | Yes | Partial | API/server error | None | Confirm everywhere |
| Permanent delete | Magazine draft only | Delete draft | `magazine_issues` | Magazine admin | Yes | Yes | Partial | Redirect error | None | Keep rare |
| Republish | Classified rows | Move listing to top/update republish fields | Listing tables | Moderator/admin | Yes recommended | Yes | Real for several sources | API error proof | None | Eligibility proof |
| Move to top | Same as republish | Refresh sort/visibility | Listing tables | Moderator/admin | Yes | Yes | Partial | Same | None | Rename consistently |
| Feature/promote | Classified rows | Toggle featured/admin promoted | Listing tables | Sales/admin | No | Yes | Real/partial | API error proof | None | Monetization proof |
| Verify Leonix | Classified rows | Toggle `leonix_verified` | Listing tables | Moderator/admin | No | Yes | Real/partial | API error proof | None | Define verified policy |
| Suspend/pause | Classified rows | Hide public listing | Listing tables | Moderator/admin | Yes recommended | Yes | Real/partial | API error proof | None | Confirm everywhere |
| Mark reviewed | Reports/AI/reviews | Mark flag/report reviewed | `listing_reports` or `listing_moderation_reviews` | Moderator | No | Yes | Missing/partial | Unknown | None | Add report action |
| Clear flag | Queue/reports | Clear flagged status/review | Listing/report tables | Moderator | Yes | Yes | Missing/partial | Unknown | None | Add explicit action |
| Run AI review | Queue | Run single AI moderation, store review | `listing_moderation_reviews` | Admin/moderator | No | Yes | Real/partial | JSON error | None | Live provider proof |
| Bulk AI review | Queue bulk bar | Review selected listings | `listing_moderation_reviews` | Admin/moderator | Yes | Yes | Real/partial | Completed/failed counts | None | Rate/dedupe guard |
| Assign staff | Future support/moderation | Assign owner | Future columns/tables | Owner/admin | No | Yes | Missing | None | Optional email | Staff assignment schema |
| Export CSV | Leads/newsletter/media kit | Download CSV | Lead tables read | Admin/sales | No | Yes optional | Real/partial | Route error | Download only | Add audit log |
| Send password reset | User support | Send Supabase reset link | Supabase Auth | Support/admin | Yes + reason | Yes | Missing | Not available | Email via Supabase/Resend | Support view gate |
| Publish magazine | Revista | Publish issue | `magazine_issues` | Content manager/admin | Yes recommended | Yes | Real | Redirect error | None | Add preview proof |
| Archive magazine | Revista | Archive issue | `magazine_issues` | Content manager/admin | Yes | Yes | Real | Redirect error | None | Add confirmation |
| Activate promo code | Promo codes | Enable code | `leonix_promo_codes` | Sales/admin | No | Yes | Partial | Redirect/error | None | Action proof |
| Disable staff | Roster | Deactivate staff | `admin_team_members` | Owner | Yes | Yes | Partial | Redirect/error | None | Permissions gate |
| Resolve alert | Future Bug Finder | Mark system alert resolved | `admin_system_alerts` | Owner/admin | No | Yes | Missing | None | Optional email | System alerts schema |

## 7. Mobile Issue Matrix

| 390px risk | Current evidence | Impact | Priority | Next fix |
|---|---|---|---|---|
| Wide tables | Reports, activity log, users, Tienda, category registries use table/overflow patterns | Horizontal scrolling slows mobile admin | P0 | Card-first mobile replacements |
| Clipped nav | Mobile drawer width is capped at `min(20rem,92vw)` | Safer, but long labels can wrap | P1 | Short labels + grouped nav |
| Too many buttons | Classified row actions have lifecycle, seller, monetization, AI, danger | Action overload | P0 | Priority actions + details |
| Crowded cards | User detail, order detail, queue cards | Hard to scan in field | P1 | Purpose card + section cards |
| Action overload | Same listing can show edit, public, owner, email, restore/suspend/archive, feature, verify, AI | Mistap risk | P0 | Sticky primary + grouped secondary |
| Unreadable small text | Many `text-[10px]`/`text-xs` chips | Status metadata can become unreadable | P1 | Mobile typography floor |
| Horizontal overflow risk | UUIDs, JSON summaries, emails, long filenames | Layout bleed | P0 | Break-all wrappers and card labels |
| Missing sticky primary action | Most pages rely on local buttons | Slow on long mobile pages | P2 | Add per-page mobile action dock only after truth map |
| Destructive actions too close to safe actions | Classified mobile details separate danger, but not all pages do | Dangerous tap risk | P0 | Universal danger section and confirm |

## 8. Leonix Style Issue Matrix

| Style issue | Where seen | Current status | Risk | Next fix |
|---|---|---|---|---|
| Color chaos | Local page classes outside `adminTheme.ts` | Partial | Admin loses premium feel | Centralize CTA/status tokens |
| Button inconsistency | Mix of text links, rounded chips, CTA buttons | Partial | Actions feel unequal | Semantic CTA pass |
| Unclear status chips | Activity/log/lead/status labels vary | Partial | Operators misread state | Status taxonomy |
| Weak hierarchy | Dense detail pages | Partial | Hard on mobile | Purpose cards + section grouping |
| Page feels unfinished | Viajes affiliate/editorial/campaign/settings, draw | Partial/UI-only | Fake readiness risk | Label UI-only or back with schema |
| Needs purpose card | Most admin pages | Missing | Unknown page ownership | `ADMIN-OS-PAGE-PURPOSE-CARDS-01` |
| Needs card-first layout | Reports/activity/users/Tienda/category registry | Partial | 390px risk | Mobile card pass |
| Needs section grouping | Sidebar and revenue tools | Partial | OS feels like route list | Nav architecture gate |

## 9. Bug Finder Architecture

Future routes:
- `/admin/system-health`
- `/admin/bug-finder`
- `/admin/system-alerts/[id]`

Expected table: `admin_system_alerts`

Suggested fields:
- `id uuid primary key`
- `severity text` values: `critical`, `high`, `medium`, `low`, `info`
- `status text` values: `open`, `acknowledged`, `resolved`, `ignored`
- `area text` values: `publishing`, `uploads`, `storage`, `visibility`, `payments`, `leads`, `magazine`, `auth`, `supabase`, `build`, `api`
- `title text`
- `safe_summary text`
- `safe_debug_context jsonb`
- `source text`
- `dedupe_key text`
- `first_seen_at timestamptz`
- `last_seen_at timestamptz`
- `acknowledged_at timestamptz`
- `acknowledged_by uuid/text`
- `resolved_at timestamptz`
- `resolved_by uuid/text`
- `notification_sent_at timestamptz`

Workflow:
- Detect safe operational failures server-side.
- Insert or update by `dedupe_key`; never store secrets, raw cards, service role keys, bearer tokens, full request bodies, or private customer payloads.
- Show severity cards on `/admin/system-health`.
- Show actionable alert queue on `/admin/bug-finder`.
- Detail page `/admin/system-alerts/[id]` supports acknowledge and resolve.
- Every acknowledge/resolve writes `admin_audit_log`.

## 10. High-Priority Email Alert Plan

Recipient: `chuy@leonixmedia.com`

Urgent subject format:
- `[Leonix Admin Alert][CRITICAL][Publishing] Listing saved but invisible`
- `[Leonix Admin Alert][HIGH][Uploads] Storage upload failed`
- `[Leonix Admin Alert][HIGH][Magazine] PDF upload failed`

Severity rules:
- Critical: money/user-facing publishing failure, saved-but-invisible listing, missing owner, broken paid listing, checkout/order verification failure.
- High: upload/storage failure, missing Leonix Ad ID, broken public URL after publish, failed magazine PDF upload.
- Medium: admin action failed but user-facing state unchanged.
- Low/info: recovered transient issue or debug-only signal.

Dedupe/spam protection:
- Use `dedupe_key` per area/entity/error type.
- Send first urgent email immediately.
- Do not resend within a cooldown window unless severity escalates.
- Track `notification_sent_at` and `last_seen_at`.

Include:
- Alert id, severity, area, safe title, entity type/id, Leonix Ad ID if present, route, timestamp, suggested next admin action.

Do not include:
- API keys, service role keys, JWTs, cookies, raw card/payment data, full request payloads, private uploaded files, or stack traces containing secrets.

Dependency:
- Use Resend only from server-side code with env vars.
- If Resend is not configured, alert remains visible in Admin System Health with `notification_sent_at = null`.

## 11. Publishing/Upload Error Alert Architecture

Must detect:
- Publish failed
- Preview failed
- Listing saved but invisible
- Listing has no Leonix Ad ID
- Missing slug
- Missing owner
- Upload failed
- Storage failed
- Image exists but not attached
- Magazine PDF upload failed
- Broken image URL

Architecture:
- Publishing endpoints and server actions emit safe alert events to `admin_system_alerts`.
- Upload endpoints include storage operation status, target table, entity id, asset count, and attachment result.
- Visibility checker runs after publish for paid/important categories: database exists, public URL expected, listing is queryable, image URLs are attached.
- Magazine uploads check PDF URL, cover URL, issue row status, and public manifest impact.
- All events use dedupe keys and safe summaries.

## 12. Listing Visibility Checker Architecture

Future tool route: `/admin/listing-visibility`

Search by Leonix Ad ID and show:
- Exists in database
- Source table
- Owner
- Status
- Public URL works
- Results visibility
- Search visibility
- City/category visibility
- Expiration
- Republish state
- Featured state
- Verified state
- AI/report/payment blockers

Implementation notes:
- Start read-only.
- Resolve across `listings`, `restaurantes_public_listings`, `servicios_public_listings`, `empleos_public_listings`, `autos_classifieds_listings`, `viajes_staged_listings`, `ofertas_locales`, and future category tables.
- Do not fake public URL checks; label as "not checked" unless a real fetch/read proof runs.
- Add "repair suggestions" only after action truth exists.

## 13. Viajes Affiliate Ops Architecture

Future routes:
- `/admin/viajes`
- `/admin/viajes/partners`
- `/admin/viajes/offers`
- `/admin/viajes/leads`
- `/admin/viajes/clicks`
- `/admin/viajes/health`

Expected tables:
- `affiliate_partners`
- `travel_offers`
- `travel_inquiries`
- `affiliate_click_events`

Why Viajes belongs under Revenue:
- The main operational unit is partner/affiliate monetization, not just classified moderation.
- It needs partner onboarding, offer publishing, click tracking, lead attribution, payout/commission review, and broken-offer health checks.
- Editorial travel content can belong to Website Control, but partner offers and affiliate performance belong in Revenue.

Current truth:
- Existing `viajes_staged_listings` and `viajes_public_inquiries` provide partial Viajes marketplace backing.
- Existing `/admin/clasificados/viajes/*` pages are partial and may use mock/planning data. They must be labeled partial/UI-only until expected affiliate tables are present.

## 14. Website Control Architecture

Future controlled modules:
- `/admin/site-sections`
- `/admin/magazine`
- `/admin/homepage`
- `/admin/banners`
- `/admin/announcements`
- `/admin/themes`
- `/admin/category-visibility`

Rules:
- This should not become Wix-style freeform editing.
- Each module has a defined schema/payload contract, preview, publish/archive, rollback, and audit logs.
- Content managers can edit content modules; owner/admin controls themes, category visibility, and global settings.
- Public page modules must be controlled through approved fields, not arbitrary HTML.

Controlled modules:
- Homepage: hero, featured sections, CTA blocks, trusted categories.
- Banners: top announcements, campaign promos, paid placements.
- Announcements: operational/site notices.
- Themes: Leonix-approved tokens only.
- Category visibility: enable/disable category surfaces safely.
- Magazine: issue registry and featured issue.

## 15. Magazine Manager Architecture

Expected table: `magazine_issues`

Required fields:
- `id`
- `title`
- `slug`
- `language`
- `issue_date`
- `cover_image_url`
- `pdf_url`
- `status`
- `featured_on_home`
- `published_at`
- `archived_at`
- `created_by`
- `updated_by`

Current note:
- Existing migration/action fields use `year`, `month_slug`, `title_es`, `title_en`, `cover_url`, `pdf_url`, `flipbook_url`, `status`, `is_featured`, `published_at`, `display_order`, and `internal_notes`.
- Next gate should decide whether to evolve existing columns or map them to the final manager terminology. Do not add schema in this audit.

## 16. User Support View Architecture

Safe support view requirements:
- No uncontrolled impersonation.
- Reason required before sensitive support actions.
- Role permission required.
- Audit log required.
- No passwords shown or edited.
- No raw cards, payment secrets, or private tokens.
- Send reset link only through audited Supabase Auth/Resend flow.
- View user ads, leads, payment status, support tickets, reports, and order history.
- Edit/pause/republish ads only if category support exists and permission allows it.

Current truth:
- `/admin/usuarios/[id]` already avoids impersonation language and says password reset is not generated from the panel.
- It reads profile, ads, reports, orders, package entitlements, and analytics rollups.
- Account type/tier update is real against `profiles`.
- Enable/disable exists via `AdminUserActions`, but must be verified in the action truth gate.

## 17. Staff/Permissions Architecture

Final roles:
- `owner`
- `admin`
- `moderator`
- `sales`
- `content_manager`
- `support`
- `viewer`

Permission needs:
- Owner: all routes, settings, billing/payment tracker, staff roles, schema-backed system alerts.
- Admin: most operations, no owner-only secrets/config unless granted.
- Moderator: marketplace queue, reports, AI trust/moderation, visibility checker.
- Sales: leads, promo codes, package entitlements, sales tracker scoped as needed, Viajes partners/offers.
- Content manager: Website Control, magazine, homepage, announcements, language audit.
- Support: users, support tickets, safe reset links, owner/listing context, no destructive deletes by default.
- Viewer: read-only dashboards and reports.

Current mismatch:
- Existing normalized roles include `owner_admin`, `admin_manager`, `sales_manager`, `sales_rep`, `support_admin`, and `content_admin`.
- Some roster roles map back to owner-level access for legacy behavior. This must be revisited before expanding the OS.

## 18. Monetization/Revenue Architecture

Respect listing/category-level monetization:
- Restaurantes paid only
- Servicios paid business only
- Empleos paid only
- En Venta free/pro
- Autos private/business paid
- Rentas paid private/business
- Bienes Raices paid private/business
- Clases free if free class, paid if paid class
- Comunidad free
- Viajes paid/affiliate

Revenue tools:
- Packages: `listing_package_entitlements`
- Promo codes: `leonix_promo_codes`
- Payments: `leonix_payment_records`
- Sales tracker: payment + promo + package attribution
- Revenue opportunity finder: future read model that flags unpaid eligible listings, expiring paid placements, high-performing unfeatured ads, lead follow-up gaps, and category monetization mismatches.

Rules:
- Do not attach account membership as the source of truth for listing monetization.
- Listing/category plan decides the listing-level revenue behavior.
- Promo code and package application needs audit logs and payment proof.

## 19. Business Concierge Architecture

Expected table: `concierge_requests`

Statuses:
- `new`
- `needs_contact`
- `quoted`
- `in_progress`
- `waiting_on_client`
- `completed`
- `cancelled`

Packages:
- Starter setup
- Website content help
- Listing publish help
- Ad campaign help
- Print/digital bundle
- Growth Center package

Admin queue:
- `/admin/concierge` or `/admin/revenue/concierge`
- Shows client, package, requested service, priority, owner/staff assignment, status, next follow-up, linked user, linked lead, linked listing/order/payment.

Public CTA:
- "Need Leonix to do it for you?" routes into Concierge request capture.

Client Growth Center tie-in:
- User dashboard can show active Concierge requests and next steps.
- Admin controls assignment and fulfillment status.

## 20. Prioritized Roadmap

P0:
- Supabase backing proof for every existing admin tool.
- Action truth map for every visible button.
- Route/nav architecture cleanup.
- 390px mobile review for command, queue, user support, revenue, and support pages.
- Permission truth gate before new sensitive tools.

P1:
- Page purpose cards across admin.
- User Support View with audited reset-link flow.
- Listing Visibility Checker read-only tool.
- System alerts schema and Bug Finder dashboard.
- Magazine Manager canonical route.

P2:
- Revenue cockpit consolidation.
- Viajes affiliate tables and operations.
- Website Control preview/archive/rollback.
- Support Center merge of ops/support/users.

P3:
- Business Concierge platform.
- AI Trust Center with provider proof, cost/rate controls, and moderation history.
- Revenue opportunity finder.

P4:
- Advanced automation, staff assignment, notification preferences, analytics forecasting, and deeper mobile polish.

## 21. Recommended Next 10 Gates

1. `ADMIN-SUPABASE-BACKING-MATRIX-01`
2. `ADMIN-ACTION-TRUTH-MAP-01`
3. `ADMIN-OS-PAGE-PURPOSE-CARDS-01`
4. `ADMIN-OS-NAV-ARCHITECTURE-01`
5. `ADMIN-TEAM-PERMISSIONS-TRUTH-01`
6. `ADMIN-USER-SUPPORT-VIEW-01`
7. `ADMIN-LISTING-VISIBILITY-CHECKER-01`
8. `ADMIN-SYSTEM-ALERTS-SCHEMA-01`
9. `ADMIN-BUG-FINDER-DASHBOARD-01`
10. `ADMIN-MAGAZINE-MANAGER-01`

Exact next recommended gate: `ADMIN-SUPABASE-BACKING-MATRIX-01`.

## Routes Found

Found route references include:
`/admin/login`, `/admin`, `/admin/ops`, `/admin/activity-log`, `/admin/leads`, `/admin/leads/inbox`, `/admin/leads/inbox?view=promo`, `/admin/leads/newsletter`, `/admin/leads/media-kit`, `/admin/workspace`, `/admin/site-sections`, `/admin/site-settings`, `/admin/settings`, `/admin/website-content`, `/admin/workspace/home`, `/admin/workspace/home/content`, `/admin/workspace/contacto`, `/admin/workspace/contacto/content`, `/admin/workspace/nosotros`, `/admin/workspace/nosotros/content`, `/admin/workspace/noticias`, `/admin/workspace/noticias/content`, `/admin/workspace/cupones`, `/admin/workspace/cupones/content`, `/admin/workspace/iglesias`, `/admin/workspace/iglesias/content`, `/admin/workspace/anunciate`, `/admin/workspace/revista`, `/admin/magazine`, `/admin/workspace/language-audit`, `/admin/categories`, `/admin/workspace/clasificados`, `/admin/workspace/clasificados?status=flagged#queue`, `/admin/workspace/clasificados/listings/[id]/edit`, `/admin/workspace/clasificados/category/[slug]`, `/admin/workspace/clasificados/category/editor/[slug]`, `/admin/workspace/clasificados/en-venta`, `/admin/workspace/clasificados/servicios`, `/admin/workspace/clasificados/servicios/sandbox`, `/admin/workspace/clasificados/autos`, `/admin/workspace/clasificados/restaurantes`, `/admin/workspace/clasificados/travel`, `/admin/workspace/clasificados/rentas`, `/admin/workspace/clasificados/rentas/[id]`, `/admin/workspace/clasificados/bienes-raices`, `/admin/workspace/clasificados/empleos`, `/admin/workspace/clasificados/comida-local`, `/admin/workspace/clasificados/ofertas-locales`, `/admin/workspace/clasificados/mascotas-y-perdidos`, `/admin/workspace/clasificados/comunidad`, `/admin/workspace/clasificados/clases`, `/admin/workspace/clasificados/busco`, `/admin/clasificados`, `/admin/clasificados/servicios`, `/admin/clasificados/viajes`, `/admin/clasificados/viajes/affiliate-cards`, `/admin/clasificados/viajes/affiliate-cards/new`, `/admin/clasificados/viajes/affiliate-cards/[id]/edit`, `/admin/clasificados/viajes/business-offers`, `/admin/clasificados/viajes/businesses`, `/admin/clasificados/viajes/editorial`, `/admin/clasificados/viajes/campaigns`, `/admin/clasificados/viajes/settings`, `/admin/reportes`, `/admin/team`, `/admin/team/roster`, `/admin/team/users/new`, `/admin/team/customers/new`, `/admin/team/website-preview`, `/admin/team/promo-codes`, `/admin/team/clients`, `/admin/team/sales-tracker`, `/admin/usuarios`, `/admin/usuarios/[id]`, `/admin/support`, `/admin/payments`, `/admin/workspace/payment-tracker`, `/admin/workspace/sales-tracker`, `/admin/workspace/promo-codes`, `/admin/workspace/package-entitlements`, `/admin/tienda`, `/admin/tienda/catalog`, `/admin/tienda/catalog/new`, `/admin/tienda/catalog/[id]`, `/admin/tienda/orders`, `/admin/tienda/orders/[id]`, `/admin/workspace/tienda`, `/admin/workspace/tienda/storefront`, `/admin/draw`.

## Routes Missing

Requested or future routes not found as current pages:
- `/admin/workspace/clasificados/viajes` (current workspace route is `/admin/workspace/clasificados/travel`; separate Viajes admin is `/admin/clasificados/viajes`)
- `/admin/system-health`
- `/admin/bug-finder`
- `/admin/system-alerts/[id]`
- `/admin/viajes`
- `/admin/viajes/partners`
- `/admin/viajes/offers`
- `/admin/viajes/leads`
- `/admin/viajes/clicks`
- `/admin/viajes/health`
- `/admin/homepage`
- `/admin/banners`
- `/admin/announcements`
- `/admin/themes`
- `/admin/category-visibility`
- `/admin/listing-visibility`
- `/admin/concierge`

## Files Inspected

Key files inspected:
- `package.json`
- `app/admin/_lib/adminGlobalNav.ts`
- `app/admin/_lib/adminNavOps.ts`
- `app/admin/_lib/adminDashboardRoutes.ts`
- `app/admin/_lib/adminDashboardData.ts`
- `app/admin/_lib/adminAccessControl.ts`
- `app/admin/_lib/staffAdminAccess.ts`
- `app/admin/_lib/leonixLeadsData.ts`
- `app/admin/_components/AdminShell.tsx`
- `app/admin/_components/AdminSidebar.tsx`
- `app/admin/_components/adminTheme.ts`
- `app/admin/(dashboard)/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx`
- `app/admin/(dashboard)/leads/inbox/page.tsx`
- `app/admin/(dashboard)/reportes/page.tsx`
- `app/admin/(dashboard)/team/page.tsx`
- `app/admin/(dashboard)/usuarios/[id]/page.tsx`
- `app/admin/(dashboard)/activity-log/page.tsx`
- `app/admin/(dashboard)/site-sections/page.tsx`
- `app/lib/supabase/server.ts`
- `app/api/admin/clasificados/listings/[id]/route.ts`
- `app/api/admin/clasificados/listings/[id]/ai-review/route.ts`
- `app/api/admin/clasificados/listings/ai-review/bulk/route.ts`
- `app/admin/magazineIssuesActions.ts`
- `app/admin/supportTicketActions.ts`
- `supabase/migrations/*` table signals
- `scripts/verify-leonix-admin-command-center-master-audit.mjs`
- `scripts/verify-admin-dashboard-mobile-command-center.mjs`

## Final True/False Audit

- git status checked: TRUE
- no git add: TRUE
- no staging: TRUE
- no commit: TRUE
- no push: TRUE
- no public pages changed: TRUE
- no schema added: TRUE
- screenshots considered: TRUE
- admin routes inventoried: TRUE
- Supabase backing matrix included: TRUE
- action truth map included: TRUE
- mobile matrix included: TRUE
- Leonix style matrix included: TRUE
- Bug Finder architecture included: TRUE
- Viajes affiliate architecture included: TRUE
- Website Control architecture included: TRUE
- User Support View architecture included: TRUE
- verify script added: TRUE
- verify passed: PENDING
- build passed: PENDING
