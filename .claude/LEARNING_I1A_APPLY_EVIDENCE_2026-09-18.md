# I-1A canonical content repair — apply evidence (2026-09-18)
- Project: Leonix Media, ref xuieateniufcrsfdomwl (identity confirmed by explicit id before the write). cgeehvnfyrdoperdotdh never touched.
- Applied artifact: supabase/reviewed-seeds/learning-center/20260918_content_batch_i1a_repairs.sql @ d2b6741150552ca7df6bd24f8271228cf1b50caa (blob c1b20f467b844a5695514f3fb498fd2931ac5fcd). Executable statements sent verbatim (SQL comment lines omitted), one BEGIN…DO-assertions…COMMIT batch. No error => assertions passed => committed.
- Pre-apply: 75/75 Part B guards, C1–C3 match, C4/C5 chain simulation exact, drift 0, counts 6/16(8/8)/25, progress 8, capability 0, I-1 keys 0, flag true/false.
- Post-apply: same counts; I-1 keys 0; flag unchanged (updated_at 2026-09-09 00:32:35); 80/80 guards now match nothing; old ES headings 0, new 8/8; five English repairs present, old forms absent; no blank bodies; no mojibake.
- Public spot check (leonixmedia.com): 8 published lessons 200 with "Por qué importa"; ES + EN bodies render repaired text; glossary + category repaired; the three I-1 keys 404.
- Rollback source: .claude/LEARNING_I1A_BEFORE_SNAPSHOT_2026-09-18.json
- Noted, NOT changed (missed by D3, still as originally seeded): consistent_business_information.summary_es "Por que tu nombre…" (should be "Por qué"); healthy_boundaries_and_capacity.body_es "…y tu terminas agotado" (should be "tú").
