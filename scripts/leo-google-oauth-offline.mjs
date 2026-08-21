#!/usr/bin/env node
/**
 * LEO Google OAuth — One-time LOCAL helper for Preview refresh token.
 *
 * LOCAL OPS ONLY. Not imported by the app. Not an API. Not deployed.
 *
 * Usage (PowerShell):
 *   $env:LEO_GOOGLE_CLIENT_ID="..."
 *   $env:LEO_GOOGLE_CLIENT_SECRET="..."
 *   node scripts/leo-google-oauth-offline.mjs
 *
 * Requires a Google Cloud OAuth client that allows loopback redirect:
 *   http://127.0.0.1:<port>/oauth/callback
 *
 * Scope union (LEO-21E.1 — prepared for future RED consent; DO NOT run until 21E.2):
 *   https://www.googleapis.com/auth/gmail.readonly
 *   https://www.googleapis.com/auth/calendar.readonly
 *   https://www.googleapis.com/auth/gmail.send
 *
 * Does NOT write tokens to disk. Does NOT print access tokens or client secrets.
 * DO NOT paste the refresh token into Cursor/chat.
 */

import http from "node:http";
import { URL } from "node:url";

const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const SCOPES = `${GMAIL_READONLY_SCOPE} ${CALENDAR_READONLY_SCOPE} ${GMAIL_SEND_SCOPE}`;
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const LISTEN_HOST = "127.0.0.1";
const CALLBACK_PATH = "/oauth/callback";
const TIMEOUT_MS = 5 * 60 * 1000;

function fail(message) {
  console.error(`\nERROR: ${message}\n`);
  process.exit(1);
}

const clientId = (process.env.LEO_GOOGLE_CLIENT_ID || "").trim();
const clientSecret = (process.env.LEO_GOOGLE_CLIENT_SECRET || "").trim();

if (!clientId) fail("LEO_GOOGLE_CLIENT_ID is missing in the local environment.");
if (!clientSecret) fail("LEO_GOOGLE_CLIENT_SECRET is missing in the local environment.");

const server = http.createServer();

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, LISTEN_HOST, resolve);
});

const address = server.address();
if (!address || typeof address === "string") {
  fail("Could not bind a local loopback port.");
}

const port = address.port;
const redirectUri = `http://${LISTEN_HOST}:${port}${CALLBACK_PATH}`;

const authParams = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: SCOPES,
  access_type: "offline",
  prompt: "consent",
  include_granted_scopes: "false",
});

const authorizationUrl = `${AUTH_URL}?${authParams.toString()}`;

console.log("");
console.log("LEO Google OAuth — LOCAL ONE-TIME HELPER");
console.log("========================================");
console.log("Scope union:");
console.log("  - gmail.readonly");
console.log("  - calendar.readonly");
console.log("  - gmail.send");
console.log("(No modify, compose, or full-mailbox scopes)");
console.log(`Loopback redirect: ${redirectUri}`);
console.log("");
console.log("1. Add this exact redirect URI to your Google Cloud OAuth client.");
console.log("2. Open this URL in your browser and authorize the configured LEO owner account:");
console.log("");
console.log(authorizationUrl);
console.log("");
console.log("Waiting for Google callback (5 minutes max)…");
console.log("");

/** @type {{ code?: string; error?: string }} */
const result = await new Promise((resolve) => {
  const timer = setTimeout(() => {
    resolve({ error: "timeout_waiting_for_callback" });
  }, TIMEOUT_MS);

  server.on("request", (req, res) => {
    try {
      const reqUrl = new URL(req.url || "/", `http://${LISTEN_HOST}:${port}`);
      if (reqUrl.pathname !== CALLBACK_PATH) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      const error = reqUrl.searchParams.get("error");
      const code = reqUrl.searchParams.get("code");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<html><body><h1>Authorization failed</h1><p>You can close this window.</p></body></html>");
        clearTimeout(timer);
        resolve({ error: String(error) });
        return;
      }

      if (!code) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<html><body><h1>Missing authorization code</h1></body></html>");
        clearTimeout(timer);
        resolve({ error: "missing_authorization_code" });
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<html><body><h1>Authorization received</h1><p>Return to the terminal. You can close this window.</p></body></html>",
      );
      clearTimeout(timer);
      resolve({ code });
    } catch {
      clearTimeout(timer);
      resolve({ error: "callback_parse_failed" });
    }
  });
});

server.close();

if (result.error || !result.code) {
  fail(
    result.error === "timeout_waiting_for_callback"
      ? "Timed out waiting for Google callback. Re-run the helper and complete consent promptly."
      : `Authorization failed (${result.error || "unknown"}).`,
  );
}

const body = new URLSearchParams({
  code: result.code,
  client_id: clientId,
  client_secret: clientSecret,
  redirect_uri: redirectUri,
  grant_type: "authorization_code",
});

const ctrl = new AbortController();
const exchangeTimer = setTimeout(() => ctrl.abort(), 12_000);

let tokenJson;
try {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    signal: ctrl.signal,
  });

  if (!tokenRes.ok) {
    fail(
      "Token exchange failed. Confirm the OAuth client type allows this loopback redirect and that the client secret is correct. Google error details are intentionally not printed.",
    );
  }

  tokenJson = await tokenRes.json();
} catch {
  fail("Token exchange network/timeout failure.");
} finally {
  clearTimeout(exchangeTimer);
}

const refreshToken =
  typeof tokenJson?.refresh_token === "string" && tokenJson.refresh_token.trim()
    ? tokenJson.refresh_token.trim()
    : null;

if (!refreshToken) {
  fail(
    "No refresh_token returned. Google often omits it unless prompt=consent is used with a first-time grant. Revoke prior Leonix access in Google Account permissions, then re-run this helper.",
  );
}

let authorizedAccount = null;
const idToken = typeof tokenJson?.id_token === "string" ? tokenJson.id_token : null;
if (idToken) {
  try {
    const payloadPart = idToken.split(".")[1];
    if (payloadPart) {
      const json = Buffer.from(payloadPart.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      );
      const payload = JSON.parse(json);
      if (typeof payload.email === "string" && payload.email.includes("@")) {
        authorizedAccount = payload.email.toLowerCase();
      }
    }
  } catch {
    // ignore — email is optional confirmation only
  }
}

console.log("AUTHORIZATION COMPLETE");
if (authorizedAccount) {
  console.log(`AUTHORIZED ACCOUNT: ${authorizedAccount}`);
} else {
  console.log("AUTHORIZED ACCOUNT: (not verified from token response — set LEO_GOOGLE_ACCOUNT_EMAIL manually)");
}
console.log("REFRESH TOKEN ACQUIRED: YES");
console.log("");
console.log("SENSITIVE — COPY THIS ONCE INTO A SECURE VAULT. DO NOT PASTE INTO CURSOR/CHAT.");
console.log(refreshToken);
console.log("");
console.log("NEXT (LEO-21E.2 RED only): validate candidate token, then set LEO_GOOGLE_REFRESH_TOKEN in Vercel Preview only.");
console.log("Also ensure LEO_GOOGLE_CLIENT_ID, LEO_GOOGLE_CLIENT_SECRET, and LEO_GOOGLE_ACCOUNT_EMAIL.");
console.log("Do not enable LEO_GMAIL_REPLY_WRITE_ENABLED until scope proof passes. Production remains untouched.");
console.log("");
console.log("This helper did not write any secrets to disk.");
