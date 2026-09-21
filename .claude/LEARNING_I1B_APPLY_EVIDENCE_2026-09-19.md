# I-1B lesson publication — apply evidence (2026-09-19)
- Project: Leonix Media, ref xuieateniufcrsfdomwl (identity confirmed by explicit id before the write). cgeehvnfyrdoperdotdh never queried or written.
- Code first: Learning engine merged to main eac5b783bf08b3e56f51f66207990d627806b9da, Vercel deployment dpl_Do6zvWFr6ge3xWtgQ2WjS31f1hrb READY; existing content proven (8/8 lessons ES+EN, pathway counts 3/8/8, the three I-1 keys 404) BEFORE any write.
- Artifact: supabase/reviewed-seeds/learning-center/20260918_content_batch_i1b_lessons.sql, git blob 618b001f0c6d05146b8699f8bbbbfdba627ef508 (identical on origin/main). Statements sent verbatim in one BEGIN … 3 INSERT … DO-assertions … COMMIT batch. No error => md5 content assertions passed => committed. Applied once.
- Before: 6 / 16 (8 published, 8 planned) / 25 · progress 8 · keys 0 · flag true/false · fingerprint of the 16 rows d8752ce8c2de83d47bd3637706f3bb1f.
- After: 6 / 19 (11 published, 8 planned) / 25 · progress 8 · capability records 0 · duplicates 0 · flag unchanged · fingerprint of the original 16 rows STILL d8752ce8c2de83d47bd3637706f3bb1f (byte-identical).
- New rows: what_problem_do_you_solve (sort 3, 5023/5143 chars), customer_conversations (4, 5256/5355), know_your_competition (5, 5719/5919), all published.
- Production QA: 24/24 route×lang×journey combinations 200; pathway counts 6 / 11 / 10; no planned lesson leaks (8 planned keys 404); activities, AI labs (3 templates × stage variants), result bridge, print sheet, NEXT chain, 390/768/1440, 0 failed resources, 0 external hosts, 0 hydration warnings.
- Withdrawal (never delete): UPDATE public.business_learning_lessons SET status='draft' WHERE lesson_key='<key>' AND status='published';
