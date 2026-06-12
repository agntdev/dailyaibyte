# Daily AI News Digest Bot - DETAILS SPEC

Concrete per-command and per-flow behaviour, consistent with `docs/design.md`
(UX spec) and `docs/general.md` (scope). The bot is **delivery-only**: the only
user-facing interactions are the two subscription commands; everything else is
silently ignored.

## Runtime & Architecture

- **Framework**: grammY with `@agntdev/bot-toolkit` (`makeBot()` entry point) so
  the bot runs identically under long polling and the tokenless test harness.
- **Update types consumed**: `message` (commands only) and `my_chat_member`
  (implicit group/channel subscription). All other update types are ignored.
- **Scheduling**: a daily job at **07:00 UTC** triggers the digest pipeline
  (fetch → filter → summarize → deliver). The job is invoked by the platform
  scheduler (cron/webhook); the handler is exported so the harness can invoke
  it directly.

## Configuration

| Variable | Required | Purpose |
|---|---|---|
| `BOT_TOKEN` | yes (injected by platform) | Telegram Bot API token |
| `GNEWS_API_KEY` | yes | GNews API authentication |
| `DIGEST_HOUR_UTC` | no (default `7`) | Delivery hour, UTC |

## Storage Model

A single `subscribers` store (toolkit storage adapter; SQLite in production,
in-memory in the harness):

| Field | Type | Notes |
|---|---|---|
| `chat_id` | integer | Telegram chat ID (user, group, or channel) |
| `chat_type` | enum `private` \| `group` \| `channel` | `group` covers supergroups |
| `subscribed_at` | ISO-8601 string | Set on insert |

Operations: `add(chat_id, chat_type)` (idempotent upsert), `remove(chat_id)`
(idempotent), `listAll()`.

## Commands (subscription mechanics only)

### /start — opt-in (private chats)

- **Behaviour**: upsert `chat_id` into `subscribers` with `chat_type=private`,
  then reply:
  ```
  Good morning! 🌟 You’re receiving today’s AI News Digest for business professionals.
  To stop receiving updates, send /stop.
  ```
- **Already subscribed**: same reply (idempotent; no error, no special copy).
- **In groups/channels**: `/start` is ignored — group subscription is implicit
  (see below).

### /stop — opt-out (private chats)

- **Behaviour**: remove `chat_id` from `subscribers`, then reply:
  ```
  You’ve been unsubscribed from the AI News Digest. Send /start to rejoin.
  ```
- **Not subscribed**: same reply (idempotent).
- **In groups**: ignored; a group unsubscribes by removing the bot.

### Everything else

Any other command, text message, reply, callback, or media is **silently
ignored** — no response of any kind (per design.md Subscription Mechanics and
general.md Non-Goals).

## Implicit Group/Channel Subscription (optional flow)

Driven entirely by `my_chat_member` updates:

1. **Bot added** to a group/supergroup (status becomes `member`/`administrator`)
   → upsert `chat_id` with `chat_type=group` and post the one-time confirmation:
   ```
   This group will now receive the daily AI News Digest every morning at 7:00 AM UTC. An admin can remove me at any time to stop the digest.
   ```
2. **Bot added** to a channel with post permission (status `administrator` with
   `can_post_messages`) → upsert with `chat_type=channel`, post **nothing**
   (silent until the first digest).
3. **Bot removed** (status `left`/`kicked`) or channel post permission revoked
   → `remove(chat_id)`. No farewell message is sent.

## Daily Digest Pipeline (07:00 UTC)

1. **Fetch**: query GNews API for the top **10** AI-related articles
   (`q="artificial intelligence" OR "AI"`, `lang=en`, sorted by relevance,
   `max=10`).
2. **Filter**: keyword-based relevance scoring for *general* AI topics. Score
   each article on business/industry keywords (e.g. "launch", "funding",
   "enterprise", "regulation", "model release"); penalize subfield-specific
   topics excluded by general.md (healthcare-AI, AI-ethics papers, technical
   research deep-dives). Keep the **3–5 highest-scoring** articles.
3. **Summarize**: condense each kept article's title + description into one
   brief takeaway sentence.
4. **Compose** a single message:
   - Headline line: `📰 *Today’s AI News Digest* (<date>)` — the rendered line
     **must not exceed 120 characters**; if it would, truncate to 119 chars and
     append `…`.
   - 3 bullet-point takeaways, each prefixed `• ` (never a numbered list).
   - Optional plain URL to the single most relevant article on its own final
     line — **no inline keyboards, no buttons**.
   - Parse mode: Markdown.
5. **Deliver**: `sendMessage` to every `chat_id` in `subscribers`. Per-chat
   send failures are logged and skipped (one blocked user must not stop the
   run); a chat that returns "bot was blocked/kicked" is removed from
   `subscribers`.

### Error handling

| Condition | Behaviour |
|---|---|
| GNews request fails (network/5xx/timeout) | Retry **once**; if the retry also fails, send to all subscribers: `Technical error – try again later.` and log the error |
| GNews returns zero articles after filtering | Send: `No significant AI news today. Check back tomorrow!` |
| Invalid `GNEWS_API_KEY` (401/403) | Log the error; send the generic technical-error message; do not retry |

## Out of Scope (re-affirmed)

No `/help`, no unknown-command replies, no inline keyboards or buttons, no user
customization, no real-time alerts, no monetization (general.md Non-Goals).

## i18n

All user-facing strings above live in a single `strings.ts` module so they can
be translated as a unit. No runtime language switching in v1.
