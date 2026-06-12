// FEAT03: silent-ignore fallback (docs/details.md "Everything else" and
// docs/design.md Subscription Mechanics). The bot is delivery-only: any
// command other than /start//stop, any text, media, reply or callback gets NO
// response of any kind. The handlers exist (rather than relying on grammY's
// implicit drop) to make the contract explicit and to keep any future
// middleware from accidentally replying. MUST stay LAST in defaultFeatures so
// the real handlers win.

import type { Feature } from "../bot.js";

export const fallbackFeature: Feature = (app) => {
  // Unmatched messages of every kind: consume silently.
  app.bot.on("message", () => {
    /* silent by design */
  });

  // The bot ships no inline keyboards (design.md), so any callback is from a
  // stale/forged message. Answer it only to stop the client's spinner — no
  // text, no alert — then drop it.
  app.bot.on("callback_query", async (ctx) => {
    await ctx.answerCallbackQuery();
  });
};
