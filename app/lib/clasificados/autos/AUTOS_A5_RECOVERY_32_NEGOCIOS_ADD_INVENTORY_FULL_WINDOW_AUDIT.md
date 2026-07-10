# A5.RECOVERY-32 — Autos Negocios Added Inventory Full-Window Application Container

## 1. Gate title

**A5.RECOVERY-32 — Autos Negocios Added Inventory Full-Window Application Container**

## 2. Correct repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin` → `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `2ad251f54816085424e17d28c8be921d36347de9` |

**Correct repo confirmed:** TRUE

## 3. Files inspected

- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/BrNegocioChildInventoryFullApplication.tsx` (read-only)

## 4. Files changed

- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx`
- `scripts/autos-a5-recovery-32-negocios-add-inventory-full-window-audit.ts` (new)
- `package.json` (R32 audit script entry only)
- This audit file

## 5. Bienes reference inspected

**File:** `BrNegocioChildInventoryFullApplication.tsx`

**Layout mirrored:**

- `fixed inset-0 z-[80] flex flex-col` full-viewport application shell
- Opaque application background blocks parent page
- Header with explicit cancel/close button (no backdrop dismiss)
- `min-h-0 flex-1 overflow-y-auto overscroll-contain` internal scroll
- Sticky footer with save actions
- Mobile full-screen usable layout

## 6. Before container behavior

| Property | Before |
| -------- | ------ |
| Width | `max-w-[min(1120px,calc(100vw-48px))]` centered panel |
| Height | `h-[calc(100vh-48px)]` bottom-sheet on mobile |
| Layout | Centered drawer with dimmed backdrop |
| Backdrop | Click triggered `requestClose` via `handleBackdropClose` |
| Mobile | Bottom sheet drag handle, rounded top corners |
| Feel | Narrow centered modal/drawer |

## 7. After container behavior

| Property | After |
| -------- | ------- |
| Width | Full viewport shell; content `max-w-[min(96vw,1500px)]` |
| Height | `h-[100dvh] max-h-[100dvh]` full viewport |
| Layout | Full-window application mode (`data-autos-inventory-full-window="1"`) |
| Backdrop | No outside-click close; opaque shell blocks page |
| Mobile | Full-screen application (no bottom-sheet handle) |
| Feel | Application workspace, not narrow drawer |

## 8. Desktop result

**PASS** — Opens as full-viewport application shell at 100% zoom. Content area up to 1500px wide. Step sidebar + form have room. Footer buttons visible in sticky footer.

## 9. Mobile result

**PASS** — Full `100dvh` shell. Internal scroll. Tappable footer buttons. No horizontal overflow from container change.

## 10. Close / click-out safety result

**PASS** — Backdrop click handler removed. Outside click cannot silently discard data. Escape and header/footer Cancel use `requestClose` → dirty confirm modal. Save inventory / Save and add another unchanged.

## 11. R31 regression safety result

**PASS** — No changes to: child form fields, state keys, draft persistence, Step 5 inheritance, media/video paths, `additionalInventoryVehicles` upsert, publish mapper, preview logic. `persist()`, `handleEditInMainApplication`, `onInProgressChange`, and `AutosNegociosInventoryChildApplication` props unchanged.

## 12. Build / check result

- `npm run autos:a5-recovery-32-negocios-add-inventory-full-window-audit` — gate run
- `npm run build` — gate run

## 13. Manual QA checklist

1. Open `https://leonixmedia.com/publicar/autos/negocios?lang=en`
2. Go to Step 7 inventory area
3. Click Add vehicle to inventory
4. Confirm full-window/wide application modal (not narrow drawer)
5. Confirm not a new tab
6. Confirm page behind is blocked
7. Confirm no easy accidental outside-click close
8. Fill child fields
9. Click outside / press Escape — data not silently lost
10. Footer buttons visible/usable
11. Save inventory works
12. Save and add another works
13. Child appears in inventory preview
14. Reopen child edit — full-window still works
15. Mobile width check — usable full-screen

## 14. Remaining risks

- Ultra-wide monitors show full opaque shell (intentional application mode).
- Local file upload blobs still browser-session scoped (unchanged from R31).

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Autos Negocios scope only | TRUE | §4 |
| Autos Privado untouched | TRUE | no privado files in diff |
| Unrelated categories untouched | TRUE | only drawer + audit changed |
| Bienes inspected read-only | TRUE | §5 |
| Autos Add Inventory container identified | TRUE | `AutosNegociosAddInventoryDrawer.tsx` |
| Narrow drawer/panel replaced | TRUE | removed 1120px centered panel |
| Full-window overlay implemented | TRUE | `fixed inset-0` + `data-autos-inventory-full-window` |
| Desktop width uses near-full viewport | TRUE | `max-w-[min(96vw,1500px)]` |
| Desktop height uses near-full viewport | TRUE | `h-[100dvh]` |
| Backdrop blocks page interaction | TRUE | opaque full-viewport shell |
| Outside click does not silently discard data | TRUE | backdrop handler removed |
| Dirty close safety preserved | TRUE | `requestClose` + unsaved modal |
| Header/cancel close remains explicit | TRUE | header + footer Cancel |
| Internal scroll works | TRUE | `overflow-y-auto` scroll region |
| Footer buttons remain usable | TRUE | sticky footer |
| Mobile remains usable | TRUE | full-screen `100dvh` |
| No child field logic changed | TRUE | child app props unchanged |
| No Step 5 inherited contact logic changed | TRUE | not touched |
| No draft persistence logic changed | TRUE | persist/flush unchanged |
| No media/image/video persistence logic changed | TRUE | not touched |
| No publish mapper changed | TRUE | not touched |
| Save inventory still works | TRUE | `persist(false)` unchanged |
| Save and add another still works | TRUE | `persist(true)` unchanged |
| Child Step 5 remains read-only/inherited | TRUE | not touched |
| No Supabase schema/migrations touched | TRUE | not touched |
| No Stripe/payment touched | TRUE | not touched |
| No dashboard/admin touched | TRUE | not touched |
| No global layout/theme touched | TRUE | component-local only |
| Build passed | TRUE | §12 gate run |
| No files staged | TRUE | gate run |
| No commit created | TRUE | gate run |
| No push attempted | TRUE | gate run |
| Ready for Chuy QA | TRUE | §13 |

## Final recommendation

Final recommendation: **GREEN**
