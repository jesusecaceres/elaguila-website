# Admin OS Final QA Checklist 01

Gate: `ADMIN-OS-BATTLEFIELD-FINISH-TO-QA-01`  
Goal: launch-ready Admin OS QA for July 1.  
Rule: admin and owner-dashboard management UX should be English. User-entered listing/ad content may remain in the language entered by the client.

## 1. Admin Command Center QA

1. Open `/admin`.
2. Confirm the page title says `Leonix Command Center`.
3. Confirm the top purpose card explains data sources, safe actions, partial/planned tools, and next gate.
4. Confirm no fake revenue, fake AI status, or fake system health is shown.
5. Click `Review listings`, `Open leads`, `Open reports`, `Manage team`, `Site sections`, and `View site`.
6. Expected result: each live CTA opens an existing route; planned tools remain labeled planned/partial and are not presented as working routes.

## 2. Marketplace Ops QA

1. Open `/admin/workspace/clasificados`.
2. Confirm the purpose card says the workspace reviews/searches listings across categories.
3. Search by a known title, Leonix Ad ID, UUID, or owner ID.
4. Confirm action groups wrap on mobile and do not overflow at 390px.
5. Expand action explainers for `Republish`, `Suspend`, `Restore`, `Archive`, `Feature`, and `Verify Leonix`.
6. Expected result: each explainer states what the action does, data touched, risk, status, confirmation/audit guidance, and next gate.

## 3. Servicios Admin QA

1. Open `/admin/workspace/clasificados/servicios`.
2. Confirm the purpose card identifies `servicios_public_listings` and labels live proof honestly.
3. Search by slug, id, Leonix Ad ID, or owner user ID.
4. Open a listing card and review `Status & moderation`, `Trust`, `Monetization`, and `Staff actions`.
5. Confirm `Save listing status`, `Save Verify Leonix`, `View public listing`, `Feature`, `Verify Leonix`, `Archive`, and `Republish` are English.
6. Expected result: the page loads real rows when Supabase is configured; partial analytics remain labeled partial; promote/verify actions remain live-proof aware.

## 4. Autos Admin QA

1. Open `/admin/workspace/clasificados/autos`.
2. Confirm purpose card explains Autos ops and data source.
3. Use queue/live scope toggle.
4. Search by vehicle text, Leonix Ad ID, owner, VIN, or stock number.
5. Expand staff action explainers.
6. Expected result: no layout overflow at 390px; staff actions keep existing behavior and explain risk before use.

## 5. Restaurantes Admin QA

1. Open `/admin/workspace/clasificados/restaurantes`.
2. Confirm purpose card labels the page as paid Restaurante ops and partial.
3. Filter by slug, UUID, Leonix Ad ID, or owner.
4. Confirm `View public`, `View in results`, `Suspend`, `Archive`, `Republish`, `Feature`, and `Verify Leonix` are clear.
5. Expected result: no action claims payment/package proof is complete until the next QA gate verifies it.

## 6. Reports QA

1. Open `/admin/reportes`.
2. Confirm purpose card labels reports as partial and explains resolution actions still need QA.
3. Search by report id, listing id, reporter id, or reason text.
4. Open related queue actions from the dashboard review cards if available.
5. Expected result: read model works; mark reviewed/clear flag/delete actions are not silently presented as fully proven.

## 7. Leads Inbox QA

1. Open `/admin/leads/inbox`.
2. Confirm purpose card says email is mailto/copy based and not sent from server.
3. Switch active/archive views.
4. Test `Copy reply`, `Copy email`, `Archive`, `Restore`, and `Export CSV` on safe test rows.
5. Expected result: no fake sent-email success appears; export downloads only from real route.

## 8. Team/Users QA

1. Open `/admin/team`.
2. Confirm staff workspace purpose card explains permission boundaries.
3. Open roster, create staff login, clients, sales tracker, and customer creation if available to your role.
4. Open `/admin/usuarios`.
5. Search by name, email, phone, or short reference.
6. Expected result: user support remains support-safe; no impersonation, raw card access, or password visibility appears.

## 9. Website Control QA

1. Open `/admin/workspace`.
2. Confirm purpose card says Website Control / Site Sections and explains partial status.
3. Use filter tabs for editable, partly editable, not built, and locked.
4. Open Home, Contact, Nosotros, Revista, Tienda, and Global site settings.
5. Expected result: editable sections open existing routes; missing/locked sections stay honest and do not pretend to work.

## 10. Magazine Manager QA

1. Open `/admin/workspace/revista`.
2. Confirm purpose card says Magazine manager and references `magazine_issues`.
3. Create a draft issue with safe test metadata.
4. Use `Save issue data`, `Publish issue`, `Mark as current issue`, `Archive issue`, and `Delete draft` only on test rows.
5. Open `Public template preview`.
6. Expected result: draft/publish/archive behavior matches labels; delete is limited to drafts; public resolver truth is visible.

## 11. Tienda QA

1. Open `/admin/tienda`.
2. Confirm purpose card separates real catalog/orders/storefront tools from missing inventory/settings.
3. Open promo leads, catalog, storefront editor, and orders.
4. Open `/admin/tienda/catalog`.
5. Filter by search, category, visibility, CTA mode, and pricing mode.
6. Expected result: catalog CRUD is real when Supabase tables are available; fulfillment/customer notification proof remains for the next gate.

## 12. Owner Dashboard Mis Anuncios QA

1. Log in as a listing owner.
2. Open `/dashboard/mis-anuncios?lang=en&cat=servicios`.
3. Confirm labels use `Manage ad`, `Edit listing`, `View public`, and `View in public results`.
4. Confirm there is no `Open panel` or `Continue editing`.
5. Click `Edit listing` on a Servicios listing.
6. Expected result: Servicios publish/edit flow opens in edit mode with saved data, slug, listing ID, and Leonix Ad ID preserved.
7. Repeat with one En Venta listing.
8. Expected result: En Venta edit/manage flow still works and does not create duplicate listings.

## 13. Mobile 390px QA

1. Open Chrome DevTools or browser responsive mode at 390px width.
2. Test `/admin`, `/admin/workspace/clasificados`, Servicios, Autos, Restaurantes, Reports, Leads, Users, Tienda Catalog, and `/dashboard/mis-anuncios`.
3. Confirm purpose cards stack vertically.
4. Confirm action explainers expand without horizontal overflow.
5. Confirm buttons are at least 40-44px tall and readable.
6. Expected result: tables may scroll horizontally when unavoidable, but action/help/purpose cards remain mobile-first and readable.

## 14. Dangerous Actions QA

1. Locate `Archive`, `Delete`, `Permanent delete`, `Suspend`, and `Feature/Verify` actions.
2. Confirm action explainers show risk and confirmation/audit guidance.
3. Confirm destructive actions are visually separated or danger-colored where implemented.
4. Use only safe test records.
5. Expected result: Archive is positioned as safer than Delete; Permanent delete is not casual or hidden among primary actions.

## 15. English UX QA

1. Search admin and owner-dashboard management UI for Spanish action labels.
2. Confirm shell/action labels are English: `Save`, `Publish`, `Edit listing`, `Delete`, `View public`, `Pause`, `Republish`.
3. Confirm user-created ad/listing content can remain Spanish if the client entered it.
4. Expected result: Admin OS chrome is English; content data is not forcibly translated.

## 16. Ready-to-commit Checklist

1. Run `git status --short`.
2. Confirm unrelated dirty files are documented separately.
3. Run `npm run verify:admin-os-battlefield-finish-to-qa-01`.
4. Run `npm run build`.
5. Confirm no new migration file was added in this gate.
6. Confirm no public listing visual design was changed.
7. Confirm known warning from `ofertasLocalesPdfPageImages.ts` is the only build warning if it appears.
8. Expected result: ready to commit only if verifier and build pass and unrelated dirty tree is understood.
