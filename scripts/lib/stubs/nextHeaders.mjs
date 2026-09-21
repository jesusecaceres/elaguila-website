/**
 * `next/headers`, driven by the test.
 *
 * The cookie jar IS the attacker's input on the admin path: `leonix_admin=1` alone used to read any
 * customer's balance. The test sets the jar directly, so an auth gate that stops reading it is a
 * test failure rather than a diff nobody executes.
 */
let jar = new Map();

export function __setCookies(entries) {
  jar = new Map(Object.entries(entries ?? {}));
}

export async function cookies() {
  return {
    get: (name) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    getAll: () => [...jar.entries()].map(([name, value]) => ({ name, value })),
    has: (name) => jar.has(name),
  };
}

export async function headers() {
  return { get: () => null };
}
