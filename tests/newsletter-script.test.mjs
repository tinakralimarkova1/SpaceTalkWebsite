import test from "node:test";
import assert from "node:assert/strict";
import { createAppsScriptHarness } from "./apps-script-harness.mjs";

test("a saved signup stores only the five mailing-list columns and never emails", () => {
  const h = createAppsScriptHarness();
  assert.deepEqual(h.submit(), { ok: true });
  assert.equal(h.state.rows.length, 2);
  assert.equal(h.state.rows[1].length, 5);
  assert.equal(h.state.rows[1][1], "Test");
  assert.equal(h.state.rows[1][3], "NYU");
  assert.equal(h.state.rows[1][4], "test@example.org");
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 0);
  assert.equal(h.state.triggers.length, 0);
});

test("case-insensitive retries leave exactly one row", () => {
  const h = createAppsScriptHarness();
  h.submit();
  h.submit({ email: "  TEST@EXAMPLE.ORG  ", firstName: "Changed" });
  assert.equal(h.state.rows.length, 2);
  assert.equal(h.state.rows[1][1], "Test");
  assert.equal(h.state.mail.length, 0);
});

test("formula-like inputs are written as literal cells", () => {
  const h = createAppsScriptHarness();
  assert.deepEqual(h.submit({ firstName: " =1+1 ", lastName: "+1", organization: "@example", email: "=person@example.org" }), { ok: true });
  assert.equal(h.state.rows[1][1], "=1+1");
  assert.equal(h.state.rows[1][4], "=person@example.org");
  assert.ok(h.state.writes.includes("'=1+1"));
  assert.ok(h.state.writes.includes("'=person@example.org"));
  h.submit({ email: "=person@example.org" });
  assert.equal(h.state.rows.length, 2);
});

test("lock contention cannot append a duplicate", () => {
  const h = createAppsScriptHarness();
  h.state.locked = true;
  assert.equal(h.submit().code, "BUSY");
  assert.equal(h.state.rows.length, 1);
});

test("invalid secrets and fields do not store data or consume limits", () => {
  const h = createAppsScriptHarness();
  assert.equal(h.submit({ secret: "wrong" }).code, "UNAUTHORIZED");
  assert.equal(h.submit({ firstName: "" }).code, "INVALID");
  assert.equal(h.submit({ clientKey: "spoof" }).code, "INVALID");
  assert.equal(h.submit({ firstName: "x".repeat(81) }).ok, false);
  assert.equal(h.submit({ organization: "bad\nvalue" }).ok, false);
  assert.equal(h.state.rows.length, 1);
  assert.equal(Object.keys(h.state.properties).filter((key) => key.startsWith("NEWSLETTER_RATE_")).length, 0);
});

test("per-client rate limiting is durable, bounded, and expires", () => {
  const h = createAppsScriptHarness();
  for (let i = 0; i < 5; i++) assert.equal(h.submit().ok, true);
  assert.deepEqual(h.submit(), { ok: false, code: "RATE_LIMITED", retryAfter: 600 });
  h.advance(600001);
  assert.equal(h.submit().ok, true);
  assert.equal(h.state.rows.length, 2);
});

test("global limit caps rotating clients", () => {
  const h = createAppsScriptHarness();
  for (let i = 0; i < 200; i++) {
    assert.equal(h.submit({ clientKey: i.toString(16).padStart(64, "0") }).ok, true);
  }
  assert.equal(h.submit({ clientKey: "f".repeat(64) }).code, "RATE_LIMITED");
  h.advance(86400001);
  assert.equal(h.submit().ok, true);
  assert.equal(Object.keys(h.state.properties).filter((key) => key.startsWith("NEWSLETTER_RATE_")).length, 2);
});

test("upgrade preserves data and secret while removing only the old notification trigger", () => {
  const h = createAppsScriptHarness();
  const row = [new Date(), "Existing", "Person", "NYU", "old@example.org", "pending", 0];
  h.state.rows.push([...row]);
  h.state.triggers.push("retryPendingNotifications", "unrelatedTask");
  h.state.properties.NOTIFICATION_EMAIL = "previous@example.org";
  h.script.setupNewsletterForm();
  h.script.setupNewsletterForm();
  assert.equal(h.state.properties.NEWSLETTER_FORM_SECRET, "test-secret");
  assert.equal(h.state.properties.NOTIFICATION_EMAIL, undefined);
  assert.deepEqual(h.state.triggers, ["unrelatedTask"]);
  assert.deepEqual(h.state.rows[1], row);
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 0);
});

test("setup preserves unrelated extra columns and rejects changed signup headers", () => {
  const h = createAppsScriptHarness();
  h.state.rows[0][5] = "Important unrelated column";
  h.script.setupNewsletterForm();
  assert.equal(h.state.rows[0][5], "Important unrelated column");
  h.state.rows[0][4] = "Wrong email header";
  assert.throws(() => h.script.setupNewsletterForm(), /Unexpected column/);
});
