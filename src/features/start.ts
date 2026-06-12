// FEAT01: /start opt-in handler (docs/details.md "Commands → /start").
// Private chats only — group/channel subscription is implicit (FEAT07), so
// /start in a non-private chat is silently ignored. Idempotent: an already
// subscribed user gets the same confirmation, no error and no special copy.

import type { Feature } from "../bot.js";
import { START_REPLY } from "../strings.js";

export { START_REPLY };

export const startFeature: Feature = (app) => {
  app.bot.command("start", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    app.store.addSubscriber(ctx.chat.id, "private");
    await ctx.reply(START_REPLY);
  });
};
