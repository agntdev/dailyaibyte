// fix-0f64f84a7196618a: explicit coverage for the i18n strings module
// (docs/details.md "i18n": all user-facing text lives in a single module so
// it can be translated as a unit). Module delivered by INT01 (src/strings.ts);
// this test pins the contract: every user-facing string is exported from
// strings.ts, feature modules re-export the SAME values (no copy drift), and
// the copy matches docs/design.md exactly.
//
// Run: npm run build && node tests/unit/strings-module.test.mjs

import assert from "node:assert/strict";
import * as strings from "../../dist/strings.js";
import { START_REPLY } from "../../dist/features/start.js";
import { STOP_REPLY } from "../../dist/features/stop.js";
import { GROUP_CONFIRMATION } from "../../dist/features/membership.js";
import { NO_NEWS_MESSAGE, TECH_ERROR_MESSAGE } from "../../dist/digest.js";

// 1. The module exports every user-facing string, non-empty.
const EXPECTED_EXPORTS = [
  "START_REPLY",
  "STOP_REPLY",
  "GROUP_CONFIRMATION",
  "NO_NEWS_MESSAGE",
  "TECH_ERROR_MESSAGE",
];
for (const name of EXPECTED_EXPORTS) {
  assert.equal(typeof strings[name], "string", `${name} must be exported from strings.ts`);
  assert.ok(strings[name].length > 0, `${name} must be non-empty`);
}
console.log("PASS strings.ts exports all user-facing copy");

// 2. Feature modules re-export the identical values — single source of truth.
assert.equal(START_REPLY, strings.START_REPLY);
assert.equal(STOP_REPLY, strings.STOP_REPLY);
assert.equal(GROUP_CONFIRMATION, strings.GROUP_CONFIRMATION);
assert.equal(NO_NEWS_MESSAGE, strings.NO_NEWS_MESSAGE);
assert.equal(TECH_ERROR_MESSAGE, strings.TECH_ERROR_MESSAGE);
console.log("PASS feature modules re-export strings.ts values (no copy drift)");

// 3. Copy matches docs/design.md exactly.
assert.equal(
  strings.START_REPLY,
  "Good morning! 🌟 You’re receiving today’s AI News Digest for business professionals.\nTo stop receiving updates, send /stop.",
);
assert.equal(
  strings.STOP_REPLY,
  "You’ve been unsubscribed from the AI News Digest. Send /start to rejoin.",
);
assert.equal(strings.NO_NEWS_MESSAGE, "No significant AI news today. Check back tomorrow!");
assert.equal(strings.TECH_ERROR_MESSAGE, "Technical error – try again later.");
console.log("PASS copy matches docs/design.md");

console.log("ALL PASS strings-module");
