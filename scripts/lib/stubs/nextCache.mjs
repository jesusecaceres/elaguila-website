/**
 * `next/cache` for route harnesses. `revalidatePath` requires a Next static-generation store
 * that does not exist outside the framework, so a successful listing write must not crash
 * because cache invalidation is unavailable. Production Next still uses the real module.
 */
export function revalidatePath() {}
export function revalidateTag() {}
export function unstable_cache(fn) {
  return fn;
}
export function unstable_noStore() {}
