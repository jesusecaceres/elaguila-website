#!/usr/bin/env node
/**
 * LEO-21E.2B — LOCAL candidate refresh-token validator.
 *
 * LOCAL OPS ONLY. Not imported by the app. Not an API. Not deployed.
 *
 * Validates a CANDIDATE refresh token BEFORE it is written to Vercel Preview.
 * Does NOT use LEO_GOOGLE_REFRESH_TOKEN (that is the live configured token).
 *
 * Usage (PowerShell) — owner machine only, never in Cursor:
 *   $env:LEO_GOOGLE_CLIENT_ID="..."
 *   $env:LEO_GOOGLE_CLIENT_SECRET="..."
 *   $env:LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN="..."
 *   $env:LEO_GOOGLE_ACCOUNT_EMAIL="owner@example.com"
 *   node scripts/leo-google-candidate-token-validate.mjs
 *
 * NEVER paste the refresh token into Cursor/chat.
 * NEVER print refresh tokens, access tokens, secrets, prefixes, or lengths.
 * NEVER call messages.send / Gmail mutate / Calendar write / Vercel APIs.
 */

const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

const FORBIDDEN_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://mail.google.com/",
  "https://mail.google.com",
];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GMAIL_PROFILE_URL = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
const GMAIL_LIST_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1";
const CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1&singleEvents=true";

const TIMEOUT_MS = 12_000;

function line(label, value) {
  console.log(`${label}: ${value}`);
}

function present(name) {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

function env(name) {
  return (process.env[name] || "").trim();
}

async function fetchJson(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, cache: "no-store" });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  } finally {
    clearTimeout(timer);
  }
}

function parseScopes(scopeStr) {
  if (typeof scopeStr !== "string") return [];
  return scopeStr.split(/\s+/).map((s) => s.trim()).filter(Boolean);
}

function hasScope(granted, required) {
  return granted.includes(required);
}

function hasForbidden(granted) {
  return granted.some((s) => {
    const n = s.replace(/\/$/, "");
    return FORBIDDEN_SCOPES.some((f) => n === f.replace(/\/$/, "") || s === f);
  });
}

console.log("LEO GOOGLE CANDIDATE TOKEN VALIDATION");
console.log("LOCAL ONLY — no Vercel mutation, no Gmail send, no Calendar write.");

if (present("LEO_GOOGLE_REFRESH_TOKEN") && !present("LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN")) {
  line("REFRESH", "FAIL");
  line("ERROR", "Use LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN, not LEO_GOOGLE_REFRESH_TOKEN.");
  line("CANDIDATE_TOKEN_VALID", "FALSE");
  process.exit(1);
}

const clientId = env("LEO_GOOGLE_CLIENT_ID");
const clientSecret = env("LEO_GOOGLE_CLIENT_SECRET");
const candidate = env("LEO_GOOGLE_CANDIDATE_REFRESH_TOKEN");
const expectedOwner = env("LEO_GOOGLE_ACCOUNT_EMAIL").toLowerCase();

if (!clientId || !clientSecret || !candidate || !expectedOwner) {
  line("REFRESH", "FAIL");
  line("GMAIL_READ_SCOPE", "FAIL");
  line("CALENDAR_READ_SCOPE", "FAIL");
  line("GMAIL_SEND_SCOPE", "FAIL");
  line("UNEXPECTED_BROAD_SCOPE", "FALSE");
  line("OWNER_IDENTITY", "FAIL");
  line("GMAIL_READ", "FAIL");
  line("CALENDAR_READ", "FAIL");
  line("CANDIDATE_TOKEN_VALID", "FALSE");
  line("ERROR", "Missing required local env (client id/secret, candidate refresh token, owner email).");
  process.exit(1);
}

let refreshPass = false;
let gmailScopePass = false;
let calendarScopePass = false;
let sendScopePass = false;
let unexpectedBroad = false;
let ownerPass = false;
let gmailReadPass = false;
let calendarReadPass = false;
let accessToken = null;

{
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: candidate,
    grant_type: "refresh_token",
  });
  const tokenRes = await fetchJson(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  const token =
    tokenRes.ok &&
    tokenRes.json &&
    typeof tokenRes.json.access_token === "string" &&
    tokenRes.json.access_token.trim()
      ? tokenRes.json.access_token.trim()
      : null;
  if (token) {
    refreshPass = true;
    accessToken = token;
  }
}

line("REFRESH", refreshPass ? "PASS" : "FAIL");

if (!refreshPass || !accessToken) {
  line("GMAIL_READ_SCOPE", "FAIL");
  line("CALENDAR_READ_SCOPE", "FAIL");
  line("GMAIL_SEND_SCOPE", "FAIL");
  line("UNEXPECTED_BROAD_SCOPE", "FALSE");
  line("OWNER_IDENTITY", "FAIL");
  line("GMAIL_READ", "FAIL");
  line("CALENDAR_READ", "FAIL");
  line("CANDIDATE_TOKEN_VALID", "FALSE");
  process.exit(1);
}

{
  const infoUrl = new URL(TOKENINFO_URL);
  infoUrl.searchParams.set("access_token", accessToken);
  const info = await fetchJson(infoUrl.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const granted = parseScopes(
    info.ok && info.json && typeof info.json.scope === "string" ? info.json.scope : "",
  );
  gmailScopePass = hasScope(granted, GMAIL_READONLY_SCOPE);
  calendarScopePass = hasScope(granted, CALENDAR_READONLY_SCOPE);
  sendScopePass = hasScope(granted, GMAIL_SEND_SCOPE);
  unexpectedBroad = hasForbidden(granted);
}

line("GMAIL_READ_SCOPE", gmailScopePass ? "PASS" : "FAIL");
line("CALENDAR_READ_SCOPE", calendarScopePass ? "PASS" : "FAIL");
line("GMAIL_SEND_SCOPE", sendScopePass ? "PASS" : "FAIL");
line("UNEXPECTED_BROAD_SCOPE", unexpectedBroad ? "TRUE" : "FALSE");

if (gmailScopePass && !unexpectedBroad) {
  const profile = await fetchJson(GMAIL_PROFILE_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  const email =
    profile.ok &&
    profile.json &&
    typeof profile.json.emailAddress === "string"
      ? profile.json.emailAddress.trim().toLowerCase()
      : "";
  ownerPass = Boolean(email && email === expectedOwner);
}

line("OWNER_IDENTITY", ownerPass ? "PASS" : "FAIL");
line("EXPECTED_OWNER_MATCH", ownerPass ? "TRUE" : "FALSE");

if (gmailScopePass && !unexpectedBroad) {
  const list = await fetchJson(GMAIL_LIST_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  gmailReadPass = list.ok === true;
}

line("GMAIL_READ", gmailReadPass ? "PASS" : "FAIL");

if (calendarScopePass && !unexpectedBroad) {
  const cal = await fetchJson(CALENDAR_LIST_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  calendarReadPass = cal.ok === true;
}

line("CALENDAR_READ", calendarReadPass ? "PASS" : "FAIL");

accessToken = null;

const valid =
  refreshPass &&
  gmailScopePass &&
  calendarScopePass &&
  sendScopePass &&
  !unexpectedBroad &&
  ownerPass &&
  gmailReadPass &&
  calendarReadPass;

line("CANDIDATE_TOKEN_VALID", valid ? "TRUE" : "FALSE");
process.exit(valid ? 0 : 1);
