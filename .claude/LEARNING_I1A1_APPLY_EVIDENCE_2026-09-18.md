# I-1A.1 supplemental accent cleanup — apply evidence (2026-09-18)
- Project: Leonix Media, ref xuieateniufcrsfdomwl (identity confirmed by explicit id before the write). cgeehvnfyrdoperdotdh never queried or written.
- Applied artifact: supabase/reviewed-seeds/learning-center/20260918_content_batch_i1a1_accent_cleanup.sql @ 89aba6c78dfbbb6db13b07634b0d912391df96c9, sent verbatim (BEGIN … 2 guarded UPDATEs … DO assertions … COMMIT). No error => committed.
- Pre-write: both guards matched (188456c3…, 1179b758…); each old phrase occurred exactly once; corrected forms absent; counts 6 / 16 (8/8) / 25; progress 8; I-1 keys 0; flag true/false.
- Post-write: summary_es md5 79c58ebe…, body_es md5 1e67dadd… (reviewed text); old phrases gone; both guards match nothing; counts/flag unchanged; the other 14 lesson rows byte-identical (fingerprint bad7a677…); every other column of the two target rows identical (62ee6c26…); row 1 body_es and row 2 summary_es unchanged.
- Rollback source: the I-1A "after" values (generator / ledger sections 1–2) — before S1: "Por que tu nombre, dirección, teléfono y horario deben coincidir en todos lados."; before S2: same body with "y tu terminas agotado".
- Executed I-1A artifact untouched: git blob c1b20f467b844a5695514f3fb498fd2931ac5fcd.
