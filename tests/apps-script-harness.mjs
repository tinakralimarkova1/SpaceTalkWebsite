import { readFileSync } from "node:fs";
import vm from "node:vm";
import { randomUUID } from "node:crypto";

export function createAppsScriptHarness() {
  const state = {
    now: Date.now(), rows: [["Timestamp", "First name", "Last name", "Organization", "Email"]],
    properties: { NEWSLETTER_FORM_SECRET: "test-secret" }, triggers: [], mail: [],
    writes: [], quota: 100, failMail: false, locked: false, flushes: 0,
  };
  const properties = {
    getProperty: (key) => state.properties[key] ?? null,
    setProperties: (values) => Object.assign(state.properties, values),
    getProperties: () => ({ ...state.properties }),
    deleteProperty: (key) => delete state.properties[key],
  };
  function cell(value) {
    state.writes.push(value);
    if (typeof value === "string" && value.startsWith("=")) throw new Error("Unsafe formula write");
    return typeof value === "string" && value.startsWith("'") ? value.slice(1) : value;
  }
  const sheet = {
    getLastRow: () => state.rows.length,
    getRange(row, col, height = 1, width = 1) {
      const range = {
        getValues: () => Array.from({ length: height }, (_, r) =>
          Array.from({ length: width }, (_, c) => state.rows[row - 1 + r]?.[col - 1 + c] ?? "")),
        setValues(values) {
          values.forEach((valuesRow, r) => {
            state.rows[row - 1 + r] ??= [];
            valuesRow.forEach((value, c) => { state.rows[row - 1 + r][col - 1 + c] = cell(value); });
          });
          return range;
        },
        getValue: () => range.getValues()[0][0],
        setValue: (value) => range.setValues([[value]]),
      };
      return range;
    },
    getDataRange: () => sheet.getRange(1, 1, state.rows.length, 11),
    appendRow: (row) => state.rows.push(row.map(cell)),
    setFrozenRows() {},
  };
  const spreadsheet = { getId: () => "test-sheet", getSheetByName: () => sheet, insertSheet: () => sheet };
  const lock = {
    waitLock() {
      if (state.locked) throw new Error("Lock timeout");
      state.locked = true;
    },
    tryLock() {
      if (state.locked) return false;
      state.locked = true;
      return true;
    },
    releaseLock() { state.locked = false; },
  };
  const script = vm.createContext({
    console: { log() {}, error() {} },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [state.now])); }
      static now() { return state.now; }
    },
    PropertiesService: { getScriptProperties: () => properties },
    LockService: { getScriptLock: () => lock },
    Utilities: { getUuid: randomUUID },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet, flush: () => { state.flushes++; } },
    ScriptApp: {
      getProjectTriggers: () => state.triggers.map((name) => ({ getHandlerFunction: () => name })),
      deleteTrigger(trigger) { state.triggers = state.triggers.filter((name) => name !== trigger.getHandlerFunction()); },
      newTrigger(name) {
        const builder = { timeBased: () => builder, everyMinutes: () => builder, create: () => state.triggers.push(name) };
        return builder;
      },
    },
    MailApp: {
      getRemainingDailyQuota: () => state.quota,
      sendEmail(message) {
        state.onMail?.();
        if (state.failMail) throw new Error("Simulated delivery failure");
        state.mail.push(message);
        state.quota--;
      },
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput(text) { return { text, setMimeType() { return this; } }; },
    },
  });
  vm.runInContext(readFileSync(new URL("../google-apps-script/newsletter-signup.gs", import.meta.url), "utf8"), script);
  script.setupNewsletterForm();
  const valid = {
    secret: "test-secret", firstName: "Test", lastName: "Person", organization: "NYU",
    email: "test@example.org", clientKey: "a".repeat(64),
  };
  return {
    state, script,
    submit: (overrides = {}) => JSON.parse(script.doPost({ postData: { contents: JSON.stringify({ ...valid, ...overrides }) } }).text),
    advance: (milliseconds) => { state.now += milliseconds; },
  };
}
