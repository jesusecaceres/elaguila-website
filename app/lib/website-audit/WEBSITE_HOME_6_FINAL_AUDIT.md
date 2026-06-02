# Gate HOME-6-FINAL — One-Row Global Header + Destacados Placement

**Gate:** HOME-6-FINAL  
**Date:** 2026-05-30

## Cause of two-row bug
Nav inner container used `flex-wrap`, allowing Recursos Comunitarios + Más to drop to row 2.

## Fix
Single `flex flex-nowrap` header row; mid-tier inline only at `2xl+`; compact lg–2xl uses Más overflow.

## TRUE/FALSE

| Requirement | Result |
|---|---|
| Header stays one row on desktop | TRUE |
| No nav wrap to second row | TRUE |
| Destacados below hero | TRUE |
| Local Ecosystem after Destacados | TRUE |
| Coming Soon V2 untouched | TRUE |
| Home hero untouched | TRUE |
| npm run build passed | TRUE |
