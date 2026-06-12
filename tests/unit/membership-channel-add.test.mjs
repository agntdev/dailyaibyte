// fix-a1f85b28763afc16: explicit coverage for the "bot added to channel with
// post permission" flow (docs/details.md Implicit Subscription step 2) —
// SILENT upsert as chat_type 'channel', no confirmation message, in contrast
// to the group add which does confirm. Behavior implemented by FEAT07
// (src/features/membership.ts).
//
// Run: npm run build && node tests/unit/membership-channel-add.test.mjs

import assert from "node:assert/strict";
import { buildBot } from "../../dist/bot.js";
import { Store } from "../../dist/store.js";
import { defaultFeatures } from "../../dist/features.js";
import { GROUP_CONFIRMATION } from "../../dist/strings.js";

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

function memberUpdate(id, chat, oldStatus, newMember) {
  return {
    update_id: id,
    my_chat_member: {
      chat, from, date: 1780000000,
      old_chat_member: { status: oldStatus, user: me },
      new_chat_member: newMember,
    },
  };
}

// 1. Channel add WITH post permission → silent upsert as 'channel'
{
  const { bot, store, calls } = makeTestBot();
  await bot.handleUpdate(memberUpdate(1, { id: -200, type: "channel", title: "C" }, "left", {
    status: "administrator", user: me, can_be_edited: false, is_anonymous: false,
    can_manage_chat: true, can_delete_messages: false, can_manage_video_chats: false,
    can_restrict_members: false, can_promote_members: false, can_change_info: false,
    can_invite_users: false, can_post_stories: false, can_edit_stories: false,
    can_delete_stories: false, can_post_messages: true,
  }));
  const subs = store.listSubscribers();
  assert.equal(subs.length, 1, "channel must be subscribed");
  assert.equal(subs[0].chatType, "channel");
  assert.equal(calls.filter((c) => c.method === "sendMessage").length, 0,
    "channel add must send NO confirmation");
  console.log("PASS channel add with post permission: silent upsert as 'channel'");
}

// 2. Channel add WITHOUT post permission → not subscribed
{
  const { bot, store, calls } = makeTestBot();
  await bot.handleUpdate(memberUpdate(2, { id: -201, type: "channel", title: "C2" }, "left", {
    status: "administrator", user: me, can_be_edited: false, is_anonymous: false,
    can_manage_chat: true, can_delete_messages: false, can_manage_video_chats: false,
    can_restrict_members: false, can_promote_members: false, can_change_info: false,
    can_invite_users: false, can_post_stories: false, can_edit_stories: false,
    can_delete_stories: false, can_post_messages: false,
  }));
  assert.equal(store.listSubscribers().length, 0, "channel without post permission must not subscribe");
  assert.equal(calls.length, 0);
  console.log("PASS channel add without post permission: ignored");
}

// 3. Contrast: group add → subscribe as 'group' WITH one-time confirmation
{
  const { bot, store, calls } = makeTestBot();
  await bot.handleUpdate(memberUpdate(3, { id: -300, type: "group", title: "G" }, "left",
    { status: "member", user: me }));
  assert.equal(store.listSubscribers()[0]?.chatType, "group");
  const sends = calls.filter((c) => c.method === "sendMessage");
  assert.equal(sends.length, 1, "group add sends exactly one confirmation");
  assert.equal(sends[0].payload.text, GROUP_CONFIRMATION);
  console.log("PASS group add (contrast): confirmation sent");
}

console.log("ALL PASS membership-channel-add");
