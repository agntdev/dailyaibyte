// FEAT02: /stop opt-out handler (docs/details.md "Commands → /stop").
// Private chats only — a group unsubscribes by removing the bot (FEAT07).
// Idempotent: /stop from a non-subscriber gets the same confirmation.

import type { Feature } from "../bot.js";
import { STOP_REPLY } from "../strings.js";

export { STOP_REPLY };

export const stopFeature: Feature = (app) => {
  app.bot.command("stop", async (ctx) => {
    if (ctx.chat?.type !== "private") return;
    app.store.removeSubscriber(ctx.chat.id);
    await ctx.reply(STOP_REPLY);
  });
};
