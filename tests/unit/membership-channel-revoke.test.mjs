// fix-1d6c03e03fe50c7e: explicit coverage for unsubscribe on channel
// post-permission revocation (docs/details.md Implicit Unsubscribe — "or
// revoking its posting permission"), delivered via a my_chat_member status
// change. Behavior implemented by FEAT07 (src/features/membership.ts).
//
// Run: npm run build && node tests/unit/membership-channel-revoke.test.mjs

import assert from "node:assert/strict";
import { buildBot } from "../../dist/bot.js";
import { Store } from "../../dist/store.js";
import { defaultFeatures } from "../../dist/features.js";

function makeTestBot() {
  const store = new Store();
  const bot = buildBot("0:test", store, { gnewsApiKey: null, digestHourUtc: 7 }, defaultFeatures);
  bot.botInfo = {
    id: 1, is_bot: true, first_name: "TestBot", username: "test_bot",
    can_join_groups: true, can_read_all_group_messages: false,
    supports_inline_queries: false, can_connect_to_business: false, has_main_web_app: false,
  };
  const calls = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload });
    return { ok: true, result: { message_id: 1 } };
  });
  return { bot, store, calls };
}

const me = { id: 1, is_bot: true, first_name: "TestBot", username: "test_bot" };
const from = { id: 7, is_bot: false, first_name: "Admin" };
const chan = { id: -200, type: "channel", title: "C" };

function admin(canPost) {
  return {
    status: "administrator", user: me, can_be_edited: false, is_anonymous: false,
    can_manage_chat: true, can_delete_messages: false, can_manage_video_chats: false,
    can_restrict_members: false, can_promote_members: false, can_change_info: false,
    can_invite_users: false, can_post_stories: false, can_edit_stories: false,
    can_delete_stories: false, can_post_messages: canPost,
  };
}

function memberUpdate(id, chat, oldMember, newMember) {
  return {
    update_id: id,
    my_chat_member: {
      chat, from, date: 1780000000,
      old_chat_member: oldMember,
      new_chat_member: newMember,
    },
  };
}

// 1. Post permission revoked (admin stays admin, can_post_messages → false) → unsubscribed, silently
{
  const { bot, store, calls } = makeTestBot();
  await bot.handleUpdate(memberUpdate(1, chan, { status: "left", user: me }, admin(true)));
  assert.equal(store.listSubscribers().length, 1, "precondition: channel subscribed");

  await bot.handleUpdate(memberUpdate(2, chan, admin(true), admin(false)));
  assert.equal(store.listSubscribers().length, 0, "revoking post permission must unsubscribe");
  assert.equal(calls.length, 0, "no farewell message");
  console.log("PASS post-permission revocation: unsubscribed silently");
}

// 2. Bot kicked from the channel → unsubscribed
{
  const { bot, store, calls } = makeTestBot();
  await bot.handleUpdate(memberUpdate(3, chan, { status: "left", user: me }, admin(true)));
  await bot.handleUpdate(memberUpdate(4, chan, admin(true),
    { status: "kicked", user: me, until_date: 0 }));
  assert.equal(store.listSubscribers().length, 0, "kick must unsubscribe");
  assert.equal(calls.length, 0);
  console.log("PASS channel kick: unsubscribed silently");
}

console.log("ALL PASS membership-channel-revoke");
