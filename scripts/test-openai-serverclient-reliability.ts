/**
 * Gate D — reliability hardening tests for the shared OpenAI server client (MD Part 5): bounded
 * retry (transient failures only), rate-limit-specific handling, and that a genuinely-bad request
 * (4xx) is never retried. Same scratch-copy technique as scripts/test-growth-analyst-provider-safety.ts
 * — the real, unmodified serverClient.ts is copied into a scratch dir with only its "server-only"
 * marker stripped; global.fetch is mocked per-check to return a deterministic sequence of
 * responses, and the actual retry/backoff logic under test is never reimplemented.
 *
 * Run from repo root: npx tsx scripts/test-openai-serverclient-reliability.ts
 */
import { strict as assert } from "node:assert";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("OpenAI serverClient reliability — bounded retry / rate-limit tests\n");

const ROOT = path.resolve(__dirname, "..");
const scratchDir = mkdtempSync(path.join(tmpdir(), "openai-serverclient-reliability-"));
const scratchFile = path.join(scratchDir, "serverClient.ts");
cpSync(path.join(ROOT, "app/lib/openai/serverClient.ts"), scratchFile);
let source = readFileSync(scratchFile, "utf8");
source = source.replace('import "server-only";\n\n', "");
writeFileSync(scratchFile, source, "utf8");

type MockResponse = { status: number; headers?: Record<string, string>; body: unknown };

function mockFetchSequence(responses: MockResponse[]): { calls: number; restore: () => void } {
  const state = { calls: 0 };
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    const r = responses[Math.min(state.calls, responses.length - 1)];
    state.calls += 1;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      headers: { get: (name: string) => r.headers?.[name.toLowerCase()] ?? null },
      json: async () => r.body,
    } as unknown as Response;
  }) as typeof fetch;
  return {
    get calls() {
      return state.calls;
    },
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

process.env.OPENAI_API_KEY = "sk-test-not-real-smoke-only";

const SUCCESS_BODY = { choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } };

async function main(): Promise<void> {
  const mod = await import(pathToFileURL(scratchFile).href);
  const { requestOpenAiChatCompletion } = mod;

  await check("A. A 429 (rate limited) is retried once and succeeds on the second attempt — bounded, not unbounded", async () => {
    const mock = mockFetchSequence([{ status: 429, body: {} }, { status: 200, body: SUCCESS_BODY }]);
    try {
      const result = await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p" });
      assert.equal(mock.calls, 2, "expected exactly 2 fetch attempts (1 original + 1 bounded retry)");
      assert.ok(result.ok, "expected the retry to succeed");
    } finally {
      mock.restore();
    }
  });

  await check("B. A 429 on every attempt fails with the distinct rate_limited failure code, never generic provider_failed", async () => {
    const mock = mockFetchSequence([{ status: 429, body: {} }, { status: 429, body: {} }]);
    try {
      const result = await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p" });
      assert.equal(mock.calls, 2, "expected exactly 2 attempts total, never more (bounded)");
      assert.ok(!result.ok);
      assert.equal(result.failureCode, "rate_limited");
    } finally {
      mock.restore();
    }
  });

  await check("C. A transient 503 is retried once and succeeds — same bounded policy as 429", async () => {
    const mock = mockFetchSequence([{ status: 503, body: { error: { message: "Service unavailable" } } }, { status: 200, body: SUCCESS_BODY }]);
    try {
      const result = await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p" });
      assert.equal(mock.calls, 2);
      assert.ok(result.ok);
    } finally {
      mock.restore();
    }
  });

  await check("D. A 400 (bad request) is NEVER retried — retrying a request that is wrong by construction wastes a call", async () => {
    const mock = mockFetchSequence([{ status: 400, body: { error: { message: "Invalid request" } } }, { status: 200, body: SUCCESS_BODY }]);
    try {
      const result = await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p" });
      assert.equal(mock.calls, 1, "a 4xx client error must exhaust in exactly 1 attempt, no retry");
      assert.ok(!result.ok);
      assert.equal(result.failureCode, "provider_failed");
    } finally {
      mock.restore();
    }
  });

  await check("E. A network-level throw (e.g. connection reset) is retried once, bounded, then reported as provider_failed if it persists", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      throw new Error("ECONNRESET");
    }) as typeof fetch;
    try {
      const result = await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p" });
      assert.equal(calls, 2, "expected exactly 2 attempts (1 original + 1 bounded retry) for a transient network error");
      assert.ok(!result.ok);
      assert.equal(result.failureCode, "provider_failed");
    } finally {
      globalThis.fetch = original;
    }
  });

  await check("F. max_tokens is included when the caller passes maxOutputTokens, and omitted entirely when it does not (Creative Studio's existing behavior untouched)", async () => {
    let capturedBodyWithCap: string | null = null;
    let capturedBodyNoCap: string | null = null;
    const original = globalThis.fetch;
    globalThis.fetch = (async (_url: unknown, init: { body: string }) => {
      if (capturedBodyWithCap === null && !capturedBodyNoCap) capturedBodyNoCap = init.body;
      else capturedBodyWithCap = init.body;
      return { ok: true, status: 200, headers: { get: () => null }, json: async () => SUCCESS_BODY } as unknown as Response;
    }) as typeof fetch;
    try {
      await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p" });
      await requestOpenAiChatCompletion({ model: "gpt-test", systemInstruction: "sys", prompt: "p", maxOutputTokens: 4000 });
      assert.ok(!JSON.parse(capturedBodyNoCap!).max_tokens, "no maxOutputTokens passed -> max_tokens must be absent from the request body");
      assert.equal(JSON.parse(capturedBodyWithCap!).max_tokens, 4000, "maxOutputTokens passed -> max_tokens must appear in the request body");
    } finally {
      globalThis.fetch = original;
    }
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.error("\nSOME CHECKS FAILED.");
  } else {
    console.log("ALL CHECKS PASSED.");
  }
}

main().finally(() => {
  rmSync(scratchDir, { recursive: true, force: true });
});
