// Bot assembly: the update router skeleton every feature plugs into
// (docs/details.md "Runtime & Architecture"; docs/work_breakdown.json F00).
//
// Features (FEAT01 /start, FEAT02 /stop, FEAT03 silent-ignore fallback,
// FEAT04-06 digest pipeline, FEAT07 group membership) are INSTALLERS: each
// gets the BotApp and registers its own handlers on `app.bot`. buildBot wires
// the error boundary AROUND them and installs features in array order —
// command features first, the FEAT03 catch-all fallback LAST, so specific
// handlers always win.

import { createBot, type BotContext } from "@agntdev/bot-toolkit";
import type { Bot } from "grammy";
import type { BotConfig } from "./config.js";
import { Store } from "./store.js";

/** Per-chat session scratch. The bot is delivery-only (no multi-step flows),
 *  so the session is empty; it exists so the toolkit wiring and Ctx type stay
 *  stable if a future feature needs draft state. */
export interface Session {}

export type Ctx = BotContext<Session>;

export interface BotApp {
  bot: Bot<Ctx>;
  store: Store;
  cfg: BotConfig;
}

export type Feature = (app: BotApp) => void;

export function buildBot(token: string, store: Store, cfg: BotConfig, features: Feature[]): Bot<Ctx> {
  const bot = createBot<Session>(token, { initial: () => ({}) });

  const app: BotApp = { bot, store, cfg };

  // Error boundary (details.md "Error handling"): a handler failure is logged
  // and swallowed — the bot is delivery-only, so it never sends an apology to
  // the chat, and the update loop never crashes.
  bot.use(async (_ctx, next) => {
    try {
      await next();
    } catch (err) {
      console.error("[dailyaibyte] handler error:", err);
    }
  });

  // Feature installers run in array order (see header comment).
  for (const install of features) install(app);

  return bot;
}
