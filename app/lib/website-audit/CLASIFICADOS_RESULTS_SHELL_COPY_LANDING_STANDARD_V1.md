# CLASIFICADOS — Results Shell Copy-Landing Standard V1

**Task:** `CLASIFICADOS-RESULTS-SHELL-COPY-LANDING-STANDARD-V1`  
**Date:** 2026-07-06

## Product doctrine

| Surface | Question |
|---------|----------|
| Landing | “What am I here for?” |
| Results | “Help me narrow exactly what I want to find.” |

## Required results order

1. Category title + result count  
2. Landing-style compact search shell  
3. Filter button / drawer  
4. Search button  
5. View all / reset all  
6. Quick chips / active chips  
7. Sort + view row (below shell/chips, not inside search card)  
8. Results / listings  
9. Compact empty state if no results  
10. Promo / visibility block lower only  

## Screenshot problems addressed

| Problem | Category | Fix |
|---------|----------|-----|
| Cross-category nav above shell | Bienes Raíces | Remove `BienesRaicesCategoryNav` from results flow |
| Sort/view inside search card | En Venta | Move sort/view row below shell + chips |
| Custom shell + giant empty state | Empleos | Standard shell rhythm; compact empty state |
| Promo before listings | BR / En Venta | Move `CategoryVisibilityCta` below results |
| Mobile lane cards too tall | Negocios Locales | Mobile-only compact padding/min-height |

## Rentas model

Rentas results remains the reference — protect behavior; align shared tokens only.

---

## A. Results shell consistency table

| Category | Landing shell in results | Cross-nav removed | Search shell standard | Chips near shell | Sort/view row standard | Status |
|----------|-------------------------|-------------------|----------------------|------------------|------------------------|--------|
| bienes-raices | YES — CompactSearchCanvas | YES — CategoryNav removed | YES | YES | YES — header below chips | **Fixed** |
| en-venta | YES — CompactSearchCanvas | N/A | YES | YES — active chips | YES — moved outside panel | **Fixed** |
| empleos | YES — LX search canvas | N/A | YES | YES — active chips | YES — row below shell | **Fixed** |
| rentas | YES — model | N/A | YES | YES | YES | OK — protected |
| negocios-locales | N/A (hub) | N/A | N/A | N/A | N/A | Mobile cards compact |

## B. Mobile results table

| Category | Compact mobile shell | No huge empty state | Results under controls | No overflow | Status |
|----------|---------------------|---------------------|------------------------|-------------|--------|
| bienes-raices | YES | YES | YES | YES | OK |
| en-venta | YES | YES | YES | YES | OK |
| empleos | YES | YES — compact empty | YES | YES | **Fixed** |
| rentas | YES | YES | YES | YES | OK |

## C. Negocios Locales mobile table

| Lane page | Mobile cards compact | Explore route preserved | Advertise route preserved | Status |
|-----------|---------------------|-------------------------|---------------------------|--------|
| negocios-locales | YES — min-h/padding reduced on mobile | YES | YES | **Fixed** |

## D. Truth table

| Area | No fake filters | No fake data | Lang preserved | Routes preserved | Status |
|------|-----------------|--------------|----------------|------------------|--------|
| All touched | YES | YES | YES | YES | OK |
