const SHEET_NAME = "Signups";
const SHEET_HEADERS = [
  "Timestamp", "First name", "Last name", "Organization", "Email",
];
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_PER_CLIENT = 5;
const RATE_PER_DAY = 200;
const DEFAULT_NOTIFICATION_EMAIL = "tinathetinytuna@gmail.com";
const NOTIFICATION_HEADERS = [
  "Signup notification status", "Signup notification attempts",
  "Signup notification last attempt", "Signup notification next attempt",
  "Signup notification sent at", "Signup notification error",
];
const MAX_NOTIFICATION_ATTEMPTS = 5;

function setupNewsletterForm() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open this script from the target Google Sheet.");
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperties({
      NEWSLETTER_FORM_SECRET: properties.getProperty("NEWSLETTER_FORM_SECRET") ||
        (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ""),
      SPREADSHEET_ID: spreadsheet.getId(),
    });
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    // Refuse to overwrite unrelated columns during an upgrade.
    if (sheet.getLastRow() > 0) {
      const headers = sheet.getRange(1, 1, 1, SHEET_HEADERS.length).getValues()[0];
      headers.forEach(function (header, index) {
        if (header && header !== SHEET_HEADERS[index]) {
          throw new Error("Unexpected column " + (index + 1) + ". Check the Signups headers before setup.");
        }
      });
    }
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
    sheet.setFrozenRows(1);
    // Append tracking columns after any historical or unrelated columns.
    if (!properties.getProperty("SIGNUP_NOTIFICATION_COLUMN")) {
      const column = Math.max(SHEET_HEADERS.length, sheet.getLastColumn()) + 1;
      sheet.getRange(1, column, 1, NOTIFICATION_HEADERS.length).setValues([NOTIFICATION_HEADERS]);
      properties.setProperties({ SIGNUP_NOTIFICATION_COLUMN: String(column) });
    }
    notificationColumn_(sheet, properties);
    properties.setProperties({
      NOTIFICATION_EMAIL: properties.getProperty("NOTIFICATION_EMAIL") || DEFAULT_NOTIFICATION_EMAIL,
    });
    notificationRecipient_(properties);
    // One trigger per setup owner; the shared lock also protects against other owners' triggers.
    ScriptApp.getProjectTriggers().forEach(function (trigger) {
      if (trigger.getHandlerFunction() === "retryPendingNotifications") {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    ScriptApp.newTrigger("retryPendingNotifications").timeBased().everyMinutes(5).create();
    SpreadsheetApp.flush();
    console.log("Setup complete. Check NOTIFICATION_EMAIL and NEWSLETTER_FORM_SECRET in Project Settings > Script Properties. New signups queue an email notification.");
  } finally {
    lock.releaseLock();
  }
}

function doPost(event) {
  try {
    const contents = event && event.postData && event.postData.contents;
    if (!contents || contents.length > 12000) return jsonResponse_({ ok: false, code: "INVALID" });
    const data = JSON.parse(contents);
    const properties = PropertiesService.getScriptProperties();
    const secret = properties.getProperty("NEWSLETTER_FORM_SECRET");
    if (!secret || !data || data.secret !== secret) return jsonResponse_({ ok: false, code: "UNAUTHORIZED" });
    const firstName = cleanValue_(data.firstName, 80);
    const lastName = cleanValue_(data.lastName, 80);
    const organization = cleanValue_(data.organization, 160);
    const email = cleanValue_(data.email, 254).toLowerCase();
    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof data.clientKey !== "string" || !/^[a-f0-9]{64}$/.test(data.clientKey)) {
      return jsonResponse_({ ok: false, code: "INVALID" });
    }
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return jsonResponse_({ ok: false, code: "BUSY" });
    try {
      const retryAfter = consumeRateLimit_(properties, data.clientKey, Date.now());
      if (retryAfter) return jsonResponse_({ ok: false, code: "RATE_LIMITED", retryAfter: retryAfter });
      const sheet = signupSheet_(properties);
      const headers = sheet.getRange(1, 1, 1, SHEET_HEADERS.length).getValues()[0];
      if (headers.some(function (header, index) { return header !== SHEET_HEADERS[index]; })) {
        throw new Error("Run setupNewsletterForm to check the sheet.");
      }
      const emails = sheet.getLastRow() > 1 ? sheet.getRange(2, 5, sheet.getLastRow() - 1, 1).getValues() : [];
      if (emails.some(function (row) { return String(row[0]).trim().toLowerCase() === email; })) {
        // Same response for new and existing addresses; never disclose membership.
        return jsonResponse_({ ok: true });
      }
      const column = notificationColumn_(sheet, properties);
      const row = [
        new Date(), literalCell_(firstName), literalCell_(lastName), literalCell_(organization), literalCell_(email),
      ];
      while (row.length < column - 1) row.push("");
      // Signup and pending status are saved in one row write, before returning success.
      sheet.appendRow(row.concat(["pending", 0, "", "", "", ""]));
      SpreadsheetApp.flush();
      return jsonResponse_({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch {
    console.error("Newsletter signup failed. Check script configuration and quotas.");
    return jsonResponse_({ ok: false, code: "UNAVAILABLE" });
  }
}

// Script Properties are shared and durable across server instances. All updates use the script lock.
function consumeRateLimit_(properties, clientKey, now) {
  const prefix = "NEWSLETTER_RATE_";
  const all = properties.getProperties();
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(prefix) === 0 && JSON.parse(all[key]).expires <= now) properties.deleteProperty(key);
  });
  const clientName = prefix + clientKey;
  const globalName = prefix + "GLOBAL";
  const client = JSON.parse(properties.getProperty(clientName) || "null") || { count: 0, expires: now + RATE_WINDOW_MS };
  const global = JSON.parse(properties.getProperty(globalName) || "null") || { count: 0, expires: now + 86400000 };
  if (global.count >= RATE_PER_DAY) return Math.ceil((global.expires - now) / 1000);
  if (client.count >= RATE_PER_CLIENT) return Math.ceil((client.expires - now) / 1000);
  client.count += 1;
  global.count += 1;
  properties.setProperties({ [clientName]: JSON.stringify(client), [globalName]: JSON.stringify(global) });
  return 0;
}

function retryPendingNotifications() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const properties = PropertiesService.getScriptProperties();
    const recipient = notificationRecipient_(properties);
    const sheet = signupSheet_(properties);
    const column = notificationColumn_(sheet, properties);
    if (sheet.getLastRow() < 2) return;
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, column + NOTIFICATION_HEADERS.length - 1).getValues();
    const deadline = Date.now() + 20000;
    let processed = 0;
    for (let index = 0; index < rows.length; index++) {
      if (processed >= 10 || Date.now() >= deadline) break;
      const row = rows[index];
      const state = row.slice(column - 1);
      // Blank states belong to historical signups and must not send retroactive mail.
      if (state[0] !== "pending" && state[0] !== "retry") continue;
      if (state[3] && new Date(state[3]).getTime() > Date.now()) continue;
      const range = sheet.getRange(index + 2, column, 1, NOTIFICATION_HEADERS.length);
      const attempts = Number(state[1]) || 0;
      if (attempts >= MAX_NOTIFICATION_ATTEMPTS) {
        state[0] = "failed";
        range.setValues([state]);
        continue;
      }
      if (MailApp.getRemainingDailyQuota() < 1) break;
      processed++;
      const attemptedAt = new Date();
      const nextAttempt = new Date(Date.now() + 5 * 60 * 1000 * Math.pow(2, attempts));
      range.setValues([["retry", attempts + 1, attemptedAt, nextAttempt, "", ""]]);
      SpreadsheetApp.flush();
      try {
        MailApp.sendEmail({
          to: recipient,
          subject: "NYU Space Talks: new newsletter signup",
          body: [
            "A new subscriber joined the NYU Space Talks mailing list.", "",
            "Name: " + row[1] + " " + row[2],
            "Email: " + row[4],
            "Organization: " + (row[3] || "Not provided"), "",
            "View the mailing list: https://docs.google.com/spreadsheets/d/" + properties.getProperty("SPREADSHEET_ID"),
          ].join("\n"),
          name: "NYU Space Talks",
        });
      } catch {
        range.setValues([[
          attempts + 1 >= MAX_NOTIFICATION_ATTEMPTS ? "failed" : "retry",
          attempts + 1, attemptedAt, nextAttempt, "", "Mail send failed; check authorization and sending quota.",
        ]]);
        continue;
      }
      range.setValues([["sent", attempts + 1, attemptedAt, "", new Date(), ""]]);
      SpreadsheetApp.flush();
    }
  } finally {
    lock.releaseLock();
  }
}

function notificationRecipient_(properties) {
  const recipient = (properties.getProperty("NOTIFICATION_EMAIL") || "").trim();
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(recipient)) {
    throw new Error("Set NOTIFICATION_EMAIL to one recipient in Script Properties.");
  }
  return recipient;
}

function notificationColumn_(sheet, properties) {
  const column = Number(properties.getProperty("SIGNUP_NOTIFICATION_COLUMN"));
  if (!Number.isInteger(column) || column <= SHEET_HEADERS.length) {
    throw new Error("Run setupNewsletterForm before enabling notifications.");
  }
  const headers = sheet.getRange(1, column, 1, NOTIFICATION_HEADERS.length).getValues()[0];
  if (headers.some(function (header, index) { return header !== NOTIFICATION_HEADERS[index]; })) {
    throw new Error("Notification columns changed. Restore their headers and position.");
  }
  return column;
}

function signupSheet_(properties) {
  const id = properties.getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Run setupNewsletterForm first.");
  const sheet = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Signups sheet is missing.");
  return sheet;
}

function cleanValue_(value, maximumLength) {
  if (typeof value !== "string") return "";
  const result = value.trim();
  if (result.length > maximumLength || /[\x00-\x1f\x7f]/.test(result)) throw new Error("Invalid field.");
  return result;
}

function literalCell_(value) {
  // The apostrophe is a Sheets literal-text marker, not a formula prefix.
  return /^[=+@\x2d']/.test(value) ? "'" + value : value;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
