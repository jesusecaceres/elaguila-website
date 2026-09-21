# I-1B before-snapshot (read-only, canonical Leonix Media xuieateniufcrsfdomwl) — 2026-09-19
- counts: categories 6 · lessons 16 · published 8 · planned 8 · resources 25 · business_learning_progress 8 (count only)
- target keys present: 0 · capability_key conflicts: 0 · category clientes_y_demanda active: yes
- flag business_learning_center: enabled true / emergency_disabled false / updated_at 2026-09-09 00:32:35.641082+00
- md5 fingerprint of all 16 lesson rows (md5(string_agg(md5(row::text) order by lesson_key))): d8752ce8c2de83d47bd3637706f3bb1f
- catalog (key:status:sort): advertising_fundamentals:published:2, branding_basics:planned:2, consistent_business_information:published:1, customer_data_protection:planned:1, google_business_basics:published:1, healthy_boundaries_and_capacity:published:2, local_seo_basics:planned:3, product_photography_basics:planned:4, profitable_service_basics:planned:3, referrals_basics:planned:2, revenue_vs_profit:published:1, reviews_and_customer_response:published:2, short_video_basics:planned:5, simple_analytics:planned:4, whatsapp_business_basics:published:1, who_is_your_customer:published:1
- artifact: supabase/reviewed-seeds/learning-center/20260918_content_batch_i1b_lessons.sql on origin/main eac5b783
- withdrawal (never delete): UPDATE public.business_learning_lessons SET status='draft' WHERE lesson_key='<key>' AND status='published';
