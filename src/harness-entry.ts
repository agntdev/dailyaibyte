// TOKENLESS factory for the replay harness (AGNTDEV_BOT_MODULE →
// dist/harness-entry.js). Builds the SAME bot as main.ts but with a dummy
// token, a fresh in-memory store and fixed config — and never calls .start().
// No top-level side effects: everything happens inside makeBot().

import type { Bot } from "grammy";
import { buildBot, type Ctx } from "./bot.js";
import { defaultFeatures } from "./features.js";
import { Store } from "./store.js";

export function makeBot(): Bot<Ctx> {
  const store = new Store();
  return buildBot(
    "0:harness-tokenless",
    store,
    { gnewsApiKey: null, digestHourUtc: 7 },
    defaultFeatures,
  );
}

export default makeBot;
