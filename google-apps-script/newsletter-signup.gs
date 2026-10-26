const SHEET_NAME = "Signups";
const SHEET_HEADERS = [
  "Timestamp", "First name", "Last name", "Organization", "Email",
];
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_PER_CLIENT = 5;
const RATE_PER_DAY = 200;

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
    // Retire the previous email workflow without deleting signup data or extra columns.
    ScriptApp.getProjectTriggers().forEach(function (trigger) {
      if (trigger.getHandlerFunction() === "retryPendingNotifications") {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    properties.deleteProperty("NOTIFICATION_EMAIL");
    SpreadsheetApp.flush();
    console.log("Setup complete. Find NEWSLETTER_FORM_SECRET in Project Settings > Script Properties. Signups are saved to the Sheet only; no emails are sent.");
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
      sheet.appendRow([
        new Date(), literalCell_(firstName), literalCell_(lastName), literalCell_(organization), literalCell_(email),
      ]);
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

// Compatibility no-op for old triggers, including triggers owned by another editor.
// setupNewsletterForm removes triggers owned by the account running setup.
function retryPendingNotifications() {
  return;
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
