// fix-eef4dfae367123ea: explicit coverage for the invalid GNEWS_API_KEY
// (401/403) error path — log + generic message, NO retry — as distinct from
// the general GNews failure path, which retries exactly once
// (docs/details.md "Error handling"). Behavior implemented by FEAT06
// (src/features/digest-job.ts) on top of FEAT04's GNewsError status.
//
// Run: npm run build && node tests/unit/digest-error-handling.test.mjs

import assert from "node:assert/strict";
import { runDailyDigest } from "../../dist/features/digest-job.js";
import { Store } from "../../dist/store.js";
import { TECH_ERROR_MESSAGE } from "../../dist/strings.js";

const cfg = { gnewsApiKey: "test-key", digestHourUtc: 7 };

function makeStore() {
  const store = new Store();
  store.addSubscriber(1, "private");
  store.addSubscriber(2, "private");
  return store;
}

function captureApi(sent) {
  return { sendMessage: async (chatId, text, opts) => void sent.push({ chatId, text, opts }) };
}

const okBody = {
  articles: [
    { title: "AI enterprise funding news", description: "market launch", url: "https://e.com/a" },
    { title: "AI regulation policy update", description: "industry", url: "https://e.com/b" },
  ],
};

// 1. 401 invalid key → exactly ONE fetch (no retry), TECH_ERROR to all subscribers
for (const status of [401, 403]) {
  const sent = [];
  let fetchCalls = 0;
  const denied = async () => { fetchCalls++; return { ok: false, status, json: async () => ({}) }; };
  await runDailyDigest(captureApi(sent), makeStore(), cfg, denied);
  assert.equal(fetchCalls, 1, `${status} must NOT be retried`);
  assert.equal(sent.length, 2, "generic message goes to every subscriber");
  assert.ok(sent.every((m) => m.text === TECH_ERROR_MESSAGE), "copy is the generic technical error");
  console.log(`PASS ${status} invalid key: single fetch, generic message, no retry`);
}

// 2. Distinct path: transient failure → retried exactly once, then succeeds
{
  const sent = [];
  let fetchCalls = 0;
  const flaky = async () => {
    if (++fetchCalls === 1) throw new Error("ECONNRESET");
    return { ok: true, status: 200, json: async () => okBody };
  };
  await runDailyDigest(captureApi(sent), makeStore(), cfg, flaky);
  assert.equal(fetchCalls, 2, "transient failure is retried exactly once");
  assert.ok(sent.every((m) => m.text !== TECH_ERROR_MESSAGE), "retry success delivers the digest");
  assert.equal(sent.length, 2);
  console.log("PASS transient failure: retried once, digest delivered");
}

// 3. Transient failure twice → TECH_ERROR after the single retry
{
  const sent = [];
  let fetchCalls = 0;
  const down = async () => { fetchCalls++; throw new Error("ETIMEDOUT"); };
  await runDailyDigest(captureApi(sent), makeStore(), cfg, down);
  assert.equal(fetchCalls, 2, "exactly one retry, then give up");
  assert.ok(sent.every((m) => m.text === TECH_ERROR_MESSAGE));
  console.log("PASS double transient failure: one retry then generic message");
}

console.log("ALL PASS digest-error-handling");
