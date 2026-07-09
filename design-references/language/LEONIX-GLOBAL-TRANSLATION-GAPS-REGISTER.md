# LEONIX GLOBAL TRANSLATION GAPS REGISTER

Gate: `LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX1`
Date: 2026-07-09

---

## Purpose

Track remaining website UI translation gaps after the Restaurantes-focused fix in `LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX.md`. User-generated listing content is out of scope.

---

## Gaps

| Page / Area | Missing Language | Reason | Future Gate |
|-------------|------------------|--------|-------------|
| Autos results/landing | PT/TL dedicated copy | Only ES/EN inline patterns today | `LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX2` |
| Servicios results/landing | PT/TL dedicated copy | Category-local copy files | Same |
| Empleos results/landing | PT/TL dedicated copy | Category-local copy files | Same |
| Bienes raíces / rentas / en-venta | PT/TL dedicated copy | Not audited this gate | Same |
| `categoryStandardV2` shared shell | PT/TL | Inline ES/EN; uses `navCopyLang` EN fallback for PT/TL routes | Shared dictionary expansion |
| Portuguese UI dictionary | PT native chrome | Honest EN fallback until reviewer-approved PT copy | `LEONIX-PORTUGUESE-WEB-UI-COPY1` |
| Tagalog UI dictionary | TL native chrome | Honest EN fallback until reviewer path | `LEONIX-TAGALOG-WEB-UI-COPY1` |
| Clasificados hub landing | Partial | Hub cards have `{es,en}` objects; PT/TL not wired | Hub i18n gate |
| Dashboard / admin | N/A | Out of launch public scope | — |

---

## Safe Fallback Rules (Locked)

- `?lang=pt` or `?lang=tl` on public pages → route lang preserved in URL
- UI chrome copy → `navCopyLang(routeLang)` → English for non-Spanish official languages until dedicated copy exists
- `?lang=vi` / hidden langs → `normalizeLang` → Spanish default
- Never auto-translate business names, addresses, phones, emails, URLs, or user descriptions

---

## Next Recommended Gate

`LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX2` — extend same pattern to next highest-traffic category (servicios or autos).
