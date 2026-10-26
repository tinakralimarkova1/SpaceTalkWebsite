import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { createAppsScriptHarness } from "./apps-script-harness.mjs";

const source = readFileSync(new URL("../app/api/newsletter/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function routeHarness(upstream = () => new Response('{"ok":true}'), environment = {}) {
  const calls = [];
  const context = {
    exports: {}, require: createRequire(import.meta.url), Buffer, URL, AbortSignal,
    console: { error() {} },
    process: { env: { GOOGLE_APPS_SCRIPT_URL: "https://example.test/exec", NEWSLETTER_FORM_SECRET: "test-secret", ...environment } },
    fetch: async (url, options) => { calls.push({ url, ...options }); return upstream(url, options); },
  };
  vm.runInNewContext(compiled, context);
  return { post: context.exports.POST, calls };
}
const valid = { firstName: "Test", lastName: "Person", organization: "NYU", email: "test@example.org" };
function request(data = valid, headers = {}) {
  return new Request("https://space-talks.test/api/newsletter", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(data),
  });
}

for (const body of ["SUCCESS", " SUCCESS\n", '{"ok":true}']) {
  test("accepts confirmed Google response: " + body.trim(), async () => {
    const h = routeHarness(() => new Response(body));
    const response = await h.post(request());
    assert.equal(response.status, 201);
    assert.match((await response.json()).message, /Thank you/);
    const forwarded = JSON.parse(h.calls[0].body);
    assert.match(forwarded.clientKey, /^[a-f0-9]{64}$/);
    assert.ok(h.calls[0].signal instanceof AbortSignal);
  });
}

test("the real route and simulated Apps Script save once and return success on retry", async () => {
  const google = createAppsScriptHarness();
  const h = routeHarness((url, options) => new Response(google.script.doPost({ postData: { contents: options.body } }).text));
  for (let i = 0; i < 2; i++) {
    const response = await h.post(request());
    assert.equal(response.status, 201);
    assert.match((await response.json()).message, /Thank you/);
  }
  assert.equal(google.state.rows.length, 2);
  google.script.retryPendingNotifications();
  assert.equal(google.state.rows[1].length, 5);
  assert.equal(google.state.mail.length, 0);
});

for (const body of ['{"ok":false}', "<html>Login required</html>", "null", '{"ok":"true"}', ""]) {
  test("does not falsely confirm an unrecognized backend response: " + body, async () => {
    const h = routeHarness(() => new Response(body));
    assert.equal((await h.post(request())).status, 502);
  });
}

test("rate limiting becomes HTTP 429 with Retry-After", async () => {
  const h = routeHarness(() => new Response('{"ok":false,"code":"RATE_LIMITED","retryAfter":600}'));
  const response = await h.post(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "600");
});

test("validation, honeypot and origin checks do not contact Google", async () => {
  const h = routeHarness();
  assert.equal((await h.post(request({}))).status, 400);
  assert.equal((await h.post(request({ ...valid, email: "invalid" }))).status, 400);
  assert.equal((await h.post(request({ ...valid, firstName: "x".repeat(81) }))).status, 400);
  assert.equal((await h.post(request({ ...valid, firstName: "test\nheader" }))).status, 400);
  assert.equal((await h.post(request(valid, { Origin: "https://other.test" }))).status, 403);
  assert.equal((await h.post(request({ ...valid, website: "bot" }))).status, 200);
  assert.equal(h.calls.length, 0);
});

test("oversized bodies are rejected even without Content-Length", async () => {
  const h = routeHarness();
  assert.equal((await h.post(request({ ...valid, organization: "x".repeat(11000) }))).status, 413);
  assert.equal(h.calls.length, 0);
});

test("origin validation uses the browser host when Next normalizes the internal URL", async () => {
  const h = routeHarness();
  const response = await h.post(new Request("http://localhost:3107/api/newsletter", {
    method: "POST", body: JSON.stringify(valid),
    headers: { host: "127.0.0.1:3107", origin: "http://127.0.0.1:3107" },
  }));
  assert.equal(response.status, 201);
  assert.equal((await h.post(request(valid, { origin: "null" }))).status, 403);
});

test("missing configuration and backend/network errors fail safely", async () => {
  assert.equal((await routeHarness(undefined, { NEWSLETTER_FORM_SECRET: "" }).post(request())).status, 503);
  assert.equal((await routeHarness(() => new Response("SUCCESS", { status: 500 })).post(request())).status, 502);
  assert.equal((await routeHarness(() => { throw new DOMException("Timed out", "TimeoutError"); }).post(request())).status, 502);
});

test("only trusted Vercel headers affect the hashed client key", async () => {
  const local = routeHarness();
  await local.post(request(valid, { "x-vercel-forwarded-for": "1.2.3.4" }));
  await local.post(request(valid, { "x-vercel-forwarded-for": "5.6.7.8" }));
  assert.equal(JSON.parse(local.calls[0].body).clientKey, JSON.parse(local.calls[1].body).clientKey);
  const vercel = routeHarness(undefined, { VERCEL: "1" });
  await vercel.post(request(valid, { "x-vercel-forwarded-for": "1.2.3.4" }));
  await vercel.post(request(valid, { "x-vercel-forwarded-for": "5.6.7.8" }));
  assert.notEqual(JSON.parse(vercel.calls[0].body).clientKey, JSON.parse(vercel.calls[1].body).clientKey);
  assert.ok(!vercel.calls[0].body.includes("1.2.3.4"));
});
