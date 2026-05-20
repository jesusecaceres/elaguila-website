# Gate 12D-2 — HOA / community application surfacing (Bienes Raíces)

## Summary

Surfaces Gate 12D HOA/community fields in BR **Privado** and **Negocio** publish applications via a shared collapsible section, maps them to preview and `Leonix:br_gate12d_v1` without DB schema changes.

## TRUE/FALSE

| Requirement | Status |
|---|---|
| Shared HOA section in application | TRUE |
| Negocio `gate12d` on form state | TRUE |
| Preview HOA card (Privado + Negocio) | TRUE |
| Live detail via existing `buildBrLiveGate12dHoaCard` | TRUE |
| No DB migration | TRUE |
| Rentas untouched | TRUE |

## Manual QA

See gate 12D-2 prompt checklist (Privado + Negocio application, preview hide/show, live detail).
