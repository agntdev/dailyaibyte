// FEAT07: implicit group/channel subscription via my_chat_member updates
// (docs/details.md "Implicit Group/Channel Subscription"). No commands: a
// chat subscribes when the bot is added and unsubscribes when it is removed
// (or loses channel post permission). Groups get a one-time confirmation on
// first add; channels stay silent until the first digest.

import type { ChatMember } from "grammy/types";
import type { Feature } from "../bot.js";

export const GROUP_CONFIRMATION =
  "This group will now receive the daily AI News Digest every morning at 7:00 AM UTC. " +
  "An admin can remove me at any time to stop the digest.";

function isActive(member: ChatMember, isChannel: boolean): boolean {
  if (member.status === "administrator") {
    return isChannel ? member.can_post_messages === true : true;
  }
  return !isChannel && member.status === "member";
}

export const membershipFeature: Feature = (app) => {
  app.bot.on("my_chat_member", async (ctx) => {
    const upd = ctx.myChatMember;
    const chat = upd.chat;
    if (chat.type === "private") return; // private opt-in is /start (FEAT01)

    const isChannel = chat.type === "channel";
    if (isActive(upd.new_chat_member, isChannel)) {
      const isNew = !app.store.subscribers.has(chat.id);
      app.store.addSubscriber(chat.id, isChannel ? "channel" : "group");
      if (isNew && !isChannel) {
        await ctx.api.sendMessage(chat.id, GROUP_CONFIRMATION);
      }
      return;
    }
    // left/kicked, restricted, or channel admin without post permission
    app.store.removeSubscriber(chat.id);
  });
};
