-- SQL2E: Expand translation_records locale constraints for non-RTL dynamic Translate Ad targets.
-- Preserves existing rows, RLS, and unique cache key. Does NOT activate ar/fa (RTL held).
-- Alias codes tl/fil and zh/zh-CN/zh-Hans are allowed to prevent cache mismatch with provider mapping.

ALTER TABLE public.translation_records
  DROP CONSTRAINT IF EXISTS translation_records_source_locale_chk;

ALTER TABLE public.translation_records
  DROP CONSTRAINT IF EXISTS translation_records_target_locale_chk;

ALTER TABLE public.translation_records
  ADD CONSTRAINT translation_records_source_locale_chk CHECK (
    source_locale IN (
      'es',
      'en',
      'vi',
      'pt',
      'fil',
      'tl',
      'km',
      'zh',
      'zh-CN',
      'zh-Hans',
      'ja',
      'ko',
      'hi',
      'hy',
      'ru',
      'pa',
      'unknown'
    )
  );

ALTER TABLE public.translation_records
  ADD CONSTRAINT translation_records_target_locale_chk CHECK (
    target_locale IN (
      'es',
      'en',
      'vi',
      'pt',
      'fil',
      'tl',
      'km',
      'zh',
      'zh-CN',
      'zh-Hans',
      'ja',
      'ko',
      'hi',
      'hy',
      'ru',
      'pa'
    )
  );

COMMENT ON TABLE public.translation_records IS
  'Server-side Translate Ad translation cache. SQL2E expanded non-RTL locale constraints (ar/fa held). Service role only.';
