import test from "node:test";
import assert from "node:assert/strict";
import { createAppsScriptHarness } from "./apps-script-harness.mjs";

test("a saved signup queues a notification to the tester without delaying success", () => {
  const h = createAppsScriptHarness();
  assert.deepEqual(h.submit(), { ok: true });
  assert.equal(h.state.rows.length, 2);
  assert.equal(h.state.rows[1].length, 11);
  assert.equal(h.state.rows[1][1], "Test");
  assert.equal(h.state.rows[1][3], "NYU");
  assert.equal(h.state.rows[1][4], "test@example.org");
  assert.equal(h.state.mail.length, 0);
  assert.equal(h.state.rows[1][5], "pending");
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 1);
  assert.equal(h.state.mail[0].to, "tinathetinytuna@gmail.com");
  assert.match(h.state.mail[0].body, /Name: Test Person\nEmail: test@example.org\nOrganization: NYU/);
  assert.equal(h.state.rows[1][5], "sent");
  assert.deepEqual(h.state.triggers, ["retryPendingNotifications"]);
});

test("case-insensitive retries leave exactly one row", () => {
  const h = createAppsScriptHarness();
  h.submit();
  h.submit({ email: "  TEST@EXAMPLE.ORG  ", firstName: "Changed" });
  assert.equal(h.state.rows.length, 2);
  assert.equal(h.state.rows[1][1], "Test");
  assert.equal(h.state.mail.length, 0);
  h.script.retryPendingNotifications();
  h.submit();
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 1);
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

test("upgrade preserves historical rows, columns, secret, and configured recipient", () => {
  const row = [new Date(), "Existing", "Person", "NYU", "old@example.org", "pending", 0];
  const h = createAppsScriptHarness({ beforeSetup(state) {
    state.rows[0].push("Old notification status", "Old attempts");
    state.rows.push([...row]);
    state.triggers.push("retryPendingNotifications", "unrelatedTask");
    state.properties.NOTIFICATION_EMAIL = "professor@example.org";
  } });
  h.script.setupNewsletterForm();
  assert.equal(h.state.properties.NEWSLETTER_FORM_SECRET, "test-secret");
  assert.equal(h.state.properties.NOTIFICATION_EMAIL, "professor@example.org");
  assert.equal(h.state.properties.SIGNUP_NOTIFICATION_COLUMN, "8");
  assert.deepEqual(h.state.triggers, ["unrelatedTask", "retryPendingNotifications"]);
  assert.deepEqual(h.state.rows[1], row);
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 0);
  h.submit();
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail[0].to, "professor@example.org");
  assert.equal(h.state.rows[2][7], "sent");
});

test("setup preserves unrelated extra columns and rejects changed signup headers", () => {
  const h = createAppsScriptHarness({ beforeSetup(state) {
    state.rows[0][5] = "Important unrelated column";
  } });
  h.script.setupNewsletterForm();
  assert.equal(h.state.rows[0][5], "Important unrelated column");
  h.state.rows[0][4] = "Wrong email header";
  assert.throws(() => h.script.setupNewsletterForm(), /Unexpected column/);
});

test("delivery failures retry later without losing a signup or changing its success response", () => {
  const h = createAppsScriptHarness();
  h.state.failMail = true;
  assert.equal(h.submit().ok, true);
  h.script.retryPendingNotifications();
  assert.equal(h.state.rows[1][5], "retry");
  assert.equal(h.state.rows[1][6], 1);
  assert.match(h.state.rows[1][10], /Mail send failed/);
  h.state.failMail = false;
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 0);
  h.advance(300001);
  h.script.retryPendingNotifications();
  assert.equal(h.state.rows[1][5], "sent");
  assert.equal(h.state.rows[1][6], 2);
  assert.equal(h.state.rows[1][10], "");
  assert.equal(h.state.rows.length, 2);
});

test("exhausted sending quota leaves notifications queued without consuming attempts", () => {
  const h = createAppsScriptHarness();
  h.submit();
  h.state.quota = 0;
  h.script.retryPendingNotifications();
  assert.equal(h.state.rows[1][5], "pending");
  assert.equal(h.state.rows[1][6], 0);
  h.state.quota = 1;
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 1);
});

test("delivery stops after five failed attempts and can be manually requeued", () => {
  const h = createAppsScriptHarness();
  h.submit();
  h.state.failMail = true;
  for (let i = 0; i < 6; i++) {
    h.script.retryPendingNotifications();
    h.advance(86400000);
  }
  assert.equal(h.state.rows[1][5], "failed");
  assert.equal(h.state.rows[1][6], 5);
  h.state.failMail = false;
  h.state.rows[1][5] = "pending";
  h.state.rows[1][6] = 0;
  h.state.rows[1][8] = "";
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 1);
});

test("recipient changes apply to queued mail and user input cannot override them", () => {
  const h = createAppsScriptHarness();
  h.submit({ notificationEmail: "attacker@example.org", organization: "" });
  h.state.properties.NOTIFICATION_EMAIL = "professor@example.org";
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail[0].to, "professor@example.org");
  assert.match(h.state.mail[0].body, /Organization: Not provided/);
});

test("invalid notification configuration fails closed and concurrent workers cannot duplicate mail", () => {
  const h = createAppsScriptHarness();
  h.submit();
  h.state.properties.NOTIFICATION_EMAIL = "one@example.org,two@example.org";
  assert.throws(() => h.script.retryPendingNotifications(), /one recipient/);
  assert.equal(h.state.locked, false);
  assert.equal(h.state.mail.length, 0);
  h.state.properties.NOTIFICATION_EMAIL = "professor@example.org";
  h.state.onMail = () => h.script.retryPendingNotifications();
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 1);
});

test("changed notification headers cannot silently discard or misroute pending mail", () => {
  const h = createAppsScriptHarness();
  h.state.rows[0][5] = "Unrelated data";
  assert.equal(h.submit().ok, false);
  assert.equal(h.state.rows.length, 1);
  assert.throws(() => h.script.retryPendingNotifications(), /Notification columns changed/);
});

test("notification runs are bounded and resume remaining rows next time", () => {
  const h = createAppsScriptHarness();
  for (let i = 0; i < 12; i++) {
    h.submit({ email: `person${i}@example.org`, clientKey: i.toString(16).padStart(64, "0") });
  }
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 10);
  h.script.retryPendingNotifications();
  assert.equal(h.state.mail.length, 12);
});
