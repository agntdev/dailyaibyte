// FEAT06: scheduled 07:00 UTC delivery job (docs/details.md "Daily Digest
// Pipeline" step 5 + "Error handling"). runDailyDigest is exported standalone
// so the harness/tests can invoke one pipeline run directly; the installer
// only arms the wall-clock timer, and only when a GNews key is configured
// (the tokenless harness builds the bot with gnewsApiKey: null, so no timers
// and no network in spec runs).

import type { Api } from "grammy";
import type { BotConfig } from "../config.js";
import type { Feature } from "../bot.js";
import { Store } from "../store.js";
import { fetchTopArticles, filterRelevant, GNewsError, type Article } from "../news.js";
import { composeDigest, NO_NEWS_MESSAGE, TECH_ERROR_MESSAGE } from "../digest.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Broadcast to every subscriber. Per-chat failures are logged and skipped —
 *  one blocked user must not stop the run; a chat that blocked/kicked the bot
 *  is dropped from the store (details.md step 5). */
async function broadcast(api: Api, store: Store, text: string, markdown: boolean): Promise<void> {
  for (const sub of store.listSubscribers()) {
    try {
      await api.sendMessage(sub.chatId, text, markdown ? { parse_mode: "Markdown" } : undefined);
    } catch (err) {
      console.error(`[dailyaibyte] send to ${sub.chatId} failed:`, err);
      const desc = err instanceof Error ? err.message.toLowerCase() : "";
      if (desc.includes("blocked") || desc.includes("kicked") || desc.includes("chat not found")) {
        store.removeSubscriber(sub.chatId);
      }
    }
  }
}

/** One full pipeline run: fetch (retry once on transient failure, never on an
 *  invalid key) → filter → compose → broadcast. */
export async function runDailyDigest(
  api: Api,
  store: Store,
  cfg: BotConfig,
  fetchFn: typeof fetch = fetch,
  now: () => Date = () => new Date(),
): Promise<void> {
  if (!cfg.gnewsApiKey) {
    console.error("[dailyaibyte] digest run skipped: GNEWS_API_KEY not configured");
    await broadcast(api, store, TECH_ERROR_MESSAGE, false);
    return;
  }

  let articles: Article[];
  try {
    articles = await fetchTopArticles(cfg.gnewsApiKey, fetchFn);
  } catch (err) {
    if (err instanceof GNewsError && (err.status === 401 || err.status === 403)) {
      // Invalid key (details.md): log, generic message, no retry.
      console.error("[dailyaibyte] GNews key rejected:", err.message);
      await broadcast(api, store, TECH_ERROR_MESSAGE, false);
      return;
    }
    try {
      articles = await fetchTopArticles(cfg.gnewsApiKey, fetchFn); // retry once
    } catch (err2) {
      console.error("[dailyaibyte] GNews failed after retry:", err2);
      await broadcast(api, store, TECH_ERROR_MESSAGE, false);
      return;
    }
  }

  const relevant = filterRelevant(articles);
  if (relevant.length === 0) {
    await broadcast(api, store, NO_NEWS_MESSAGE, false);
    return;
  }

  await broadcast(api, store, composeDigest(relevant, now()), true);
}

/** ms until the next HH:00 UTC occurrence of `hourUtc`. */
export function msUntilNextRun(hourUtc: number, from: Date): number {
  const next = new Date(from);
  next.setUTCHours(hourUtc, 0, 0, 0);
  if (next.getTime() <= from.getTime()) next.setTime(next.getTime() + DAY_MS);
  return next.getTime() - from.getTime();
}

export const digestJobFeature: Feature = (app) => {
  if (!app.cfg.gnewsApiKey) return; // harness / unconfigured: no timers armed

  const arm = () => {
    const timer = setTimeout(async () => {
      try {
        await runDailyDigest(app.bot.api, app.store, app.cfg);
      } catch (err) {
        console.error("[dailyaibyte] digest run crashed:", err);
      }
      arm(); // schedule tomorrow's run
    }, msUntilNextRun(app.cfg.digestHourUtc, new Date()));
    timer.unref?.();
  };
  arm();
};
